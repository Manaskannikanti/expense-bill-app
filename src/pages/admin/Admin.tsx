import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Receipt, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Role = "admin" | "employee" | "hr" | "accounts" | "unassigned";

type MemberRow = {
  id: string;
  user_id: string;
  role: Role | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export default function Members() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Role>("unassigned");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const roleOptions: Role[] = useMemo(
    () => ["unassigned", "employee", "hr", "accounts"],
    []
  );

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
      // 1) Get my membership (org + role)
      const { data: myMembership, error: memErr } = await supabase
        .from("organization_memberships")
        .select("organization_id, role")
        .eq("user_id", user!.id)
        .single();

      if (memErr) throw memErr;

      const organization_id = myMembership.organization_id as string;
      const role = ((myMembership.role ?? "unassigned") as string).toLowerCase() as Role;

      setOrgId(organization_id);
      setMyRole(role);

      // Guard: only admin can access
      if (role !== "admin") {
        toast({
          variant: "destructive",
          title: "Not authorized",
          description: "Only admins can manage member roles.",
        });
        navigate("/dashboard");
        return;
      }

      // 2) Load org members + profile info (requires profiles table)
      const { data: rows, error: listErr } = await supabase
        .from("organization_memberships")
        .select("id, user_id, role, profiles:profiles(full_name, email)")
        .eq("organization_id", organization_id)
        .order("created_at", { ascending: true });

      if (listErr) throw listErr;

      setMembers((rows as any) ?? []);
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Failed to load members",
        description: e?.message ?? "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (membershipId: string, newRole: Role) => {
    setSavingId(membershipId);
    try {
      const { error } = await supabase
        .from("organization_memberships")
        .update({ role: newRole })
        .eq("id", membershipId);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, role: newRole } : m))
      );

      toast({ title: "Role updated", description: `Member set to ${newRole}` });
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: e?.message ?? "Please try again",
      });
    } finally {
      setSavingId(null);
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
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
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

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Manage Members</h1>
            <p className="text-sm text-muted-foreground">
              Assign roles inside your organization
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              New users join as <b>unassigned</b>. Admin sets them to employee/hr/accounts.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {members.length === 0 ? (
              <div className="text-sm text-muted-foreground">No members found.</div>
            ) : (
              members.map((m) => {
                const role = ((m.role ?? "unassigned") as string).toLowerCase() as Role;

                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border bg-card"
                  >
                    <div>
                      <div className="font-medium">{m.profiles?.full_name ?? "User"}</div>
                      <div className="text-sm text-muted-foreground">
                        {m.profiles?.email ?? m.user_id}
                      </div>
                    </div>

                    {role === "admin" ? (
                      <div className="text-sm font-medium capitalize px-3 py-2 rounded-lg bg-muted">
                        admin
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Select
                          value={role}
                          onValueChange={(val) => updateRole(m.id, val as Role)}
                          disabled={savingId === m.id || myRole !== "admin"}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {savingId === m.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
