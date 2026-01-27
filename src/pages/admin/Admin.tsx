import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Role = "admin" | "employee" | "hr" | "accounts" | "unassigned";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<Role>("unassigned");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadRole = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("role")
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;

      const role = (data?.role ?? "unassigned") as Role;
      setMyRole(role);

      if (role !== "admin") {
        toast({
          variant: "destructive",
          title: "Not authorized",
          description: "Only admins can access the admin panel.",
        });
        navigate("/dashboard");
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to load admin role",
        description: e?.message ?? "Please try again",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
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
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage members and roles</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Organization Admin</CardTitle>
            <CardDescription>Your role: <b className="capitalize">{myRole}</b></CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="gap-2">
              <Link to="/admin/members">
                <Users className="h-4 w-4" />
                Manage Members
              </Link>
            </Button>

            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

