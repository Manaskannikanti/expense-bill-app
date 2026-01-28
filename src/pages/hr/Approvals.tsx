import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

type Role = "admin" | "employee" | "hr" | "accounts" | "unassigned";
type ExpenseStatus = "pending" | "approved" | "rejected";

type ExpenseRow = {
  id: string;
  title: string;
  amount: number;
  status: ExpenseStatus;
  created_at: string;
  user_id: string;
};

export default function HrApprovals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("unassigned");
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

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
      // 1) membership + role
      const { data: mem, error: memErr } = await supabase
        .from("organization_memberships")
        .select("organization_id, role")
        .eq("user_id", user!.id)
        .single();

      if (memErr) throw memErr;

      const myRole = (mem.role ?? "unassigned") as Role;
      setRole(myRole);
      setOrgId(mem.organization_id);

      if (myRole === "unassigned") {
        navigate("/pending");
        return;
      }
      if (myRole !== "hr" && myRole !== "admin") {
        toast({
          variant: "destructive",
          title: "Not authorized",
          description: "Only HR (or Admin) can approve expenses.",
        });
        navigate("/dashboard");
        return;
      }

      // 2) load pending expenses for org
      const { data: rows, error: listErr } = await supabase
        .from("expenses")
        .select("id, title, amount, status, created_at, user_id")
        .eq("organization_id", mem.organization_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (listErr) throw listErr;

      setItems((rows as any) ?? []);
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Failed to load approvals",
        description: e?.message ?? "Please try again",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const decide = async (expenseId: string, nextStatus: ExpenseStatus) => {
    if (!orgId) return;
    setActingId(expenseId);
    try {
      const { error } = await supabase
        .from("expenses")
        .update({ status: nextStatus })
        .eq("id", expenseId)
        .eq("organization_id", orgId);

      if (error) throw error;

      setItems((prev) => prev.filter((x) => x.id !== expenseId));

      toast({
        title: nextStatus === "approved" ? "Approved" : "Rejected",
        description: `Expense has been ${nextStatus}.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Action failed",
        description: e?.message ?? "Please try again",
      });
    } finally {
      setActingId(null);
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
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
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

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">HR Approvals</h1>
            <p className="text-sm text-muted-foreground">
              Review pending expenses (role: <span className="capitalize">{role}</span>)
            </p>
          </div>

          <Badge variant="secondary">{items.length} pending</Badge>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No pending expenses</CardTitle>
              <CardDescription>You're all caught up.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((x) => (
              <Card key={x.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{x.title}</CardTitle>
                  <CardDescription>
                    Amount: <b>${x.amount.toFixed(2)}</b> • Submitted{" "}
                    {new Date(x.created_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => decide(x.id, "rejected")}
                    disabled={actingId === x.id}
                  >
                    {actingId === x.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>

                  <Button
                    className="gradient-primary"
                    onClick={() => decide(x.id, "approved")}
                    disabled={actingId === x.id}
                  >
                    {actingId === x.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
