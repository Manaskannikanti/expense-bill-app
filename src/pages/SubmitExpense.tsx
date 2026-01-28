import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, Receipt } from "lucide-react";

type ExpenseStatus = "pending" | "approved" | "rejected" | "reimbursed";

export default function SubmitExpense() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const bootstrap = async () => {
    setLoading(true);
    try {
      const { data: membership, error } = await supabase
        .from("organization_memberships")
        .select("organization_id, role")
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;

      setOrgId(membership.organization_id);
      setMyRole(membership.role);

      // If you keep "unassigned" flow:
      if ((membership.role ?? "").toLowerCase() === "unassigned") {
        navigate("/pending");
        return;
      }
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Could not load organization",
        description: e?.message ?? "Please try again",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgId || !user) return;

    const cleanTitle = title.trim();
    const cleanAmount = Number(amount);

    if (!cleanTitle) {
      toast({ variant: "destructive", title: "Title is required" });
      return;
    }
    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" });
      return;
    }

    setSaving(true);
    try {
      const status: ExpenseStatus = "pending";

      // ✅ IMPORTANT: must include user_id for your RLS policy
      const { error } = await supabase.from("expenses").insert({
        organization_id: orgId,
        user_id: user.id,
        title: cleanTitle,
        amount: cleanAmount,
        status,
        receipt_url: null, // now allowed after SQL fix
      });

      if (error) throw error;

      toast({
        title: "Expense submitted",
        description: "Your expense is now pending.",
      });

      navigate("/dashboard");
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Failed to submit expense",
        description: e?.message ?? "Please try again",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold">ExpenseFlow</span>
          </Link>

          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-10">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Submit New Expense</CardTitle>
            <CardDescription>
              Role: <b className="capitalize">{myRole}</b>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Team lunch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="1200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <Button
                className="w-full gradient-primary"
                size="lg"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit Expense"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
