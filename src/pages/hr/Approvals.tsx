import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

type Role = "admin" | "employee" | "hr" | "accounts" | "unassigned";

type ExpenseRow = {
  id: string;
  title: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  receipt_url: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export default function HrApprovals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Role>("unassigned");

  const [pending, setPending] = useState<ExpenseRow[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      // 1) my membership
      const { data: mem, error: memErr } = await supabase
        .from("organization_memberships")
        .select("organization_id, role")
        .eq("user_id", user!.id)
        .single();

      if (memErr) throw memErr;

      const role = (mem.role ?? "unassigned") as Role;
      setMyRole(role);
      setOrgId(mem.organization_id);

      if (role !== "hr") {
        toast({
          variant: "destructive",
          title: "Not authorized",
          description: "Only HR can access approvals.",
        });
        navigate("/dashboard");
        return;
      }

      // 2) load pending expenses
      await loadPending(mem.organization_id);
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

  const loadPending = async (organization_id: string) => {
    const { data, error } = await supabase
      .from("expenses")
      .select("id, title, amount, status, created_at, user_id, receipt_url, profiles:profiles(full_name, email)")
      .eq("organization_id", organization_id)
      .in("status", ["pending", "pending_manager", "pending_hr", "pending_approval"]) // supports your earlier statuses
      .order("created_at", { ascending: false });

    if (error) throw error;

    setPending((data as any) ?? []);
  };

  const fmtMoney = useMemo(
    () => (n: number) =>
      new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0),
    []
  );

  const approve = async (expenseId: string) => {
    if (!orgId) return;
    setUpdatingId(expenseId);
    try {
      // choose ONE status name and keep it consistent.
      const { error } = await supabase.from("expenses").update({ status: "approved" }).eq("id", expenseId);
      if (error) throw error;

      setPending((prev) => prev.filter((x) => x.id !== expenseId));
      toast({ title: "Approved", description: "Expense approved successfully." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Approve failed", description: e?.message ?? "Try again" });
    } finally {
      setUpdatingId(null);
    }
  };

  const reject = async (expenseId: string) => {
    if (!orgId) return;
    setUpdatingId(expenseId);
    try {
      const { error } = await supabase.from("expenses").update({ status: "rejected" }).eq("id", expenseId);
      if (error) throw error;

      setPending((prev) => prev.filter((x) => x.id !== expenseId));
      toast({ title: "Rejected", description: "Expense rejected." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Reject failed", description: e?.message ?? "Try again" });
    } finally {
      setUpdatingId(null);
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

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">HR Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review employee expenses and approve or reject.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Pending Expenses</CardTitle>
            <CardDescription>
              Showing expenses with status: pending / pending_manager / pending_hr / pending_approval
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {pending.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending expenses 🎉</div>
            ) : (
              pending.map((x) => (
                <div
                  key={x.id}
                  className="p-4 rounded-xl border bg-card flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{x.title}</div>
                      <Badge variant="secondary" className="capitalize">
                        {x.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {fmtMoney(x.amount)} •{" "}
                      {x.profiles?.full_name ?? x.profiles?.email ?? x.user_id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Submitted: {new Date(x.created_at).toLocaleString()}
                    </div>

                    {x.receipt_url ? (
                      <a
                        href={x.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary underline"
                      >
                        View receipt
                      </a>
                    ) : (
                      <div className="text-xs text-muted-foreground">No receipt uploaded</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      className="gradient-primary"
                      onClick={() => approve(x.id)}
                      disabled={updatingId === x.id}
                    >
                      {updatingId === x.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => reject(x.id)}
                      disabled={updatingId === x.id}
                    >
                      {updatingId === x.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

