import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Hourglass } from "lucide-react";

type Role = "admin" | "employee" | "hr" | "accounts" | "unassigned";

export default function PendingApproval() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    const checkRole = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("role")
        .eq("user_id", user.id)
        .single();

      // If no membership row, push them to onboarding
      if (error) {
        navigate("/onboarding");
        return;
      }

      const role = (data?.role ?? "unassigned") as Role;

      // If admin assigns a role later, send to dashboard automatically
      if (role !== "unassigned") {
        navigate("/dashboard");
        return;
      }

      setLoading(false);
    };

    checkRole();
  }, [user, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Hourglass className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Waiting for Admin Approval</CardTitle>
          <CardDescription>
            Your account is created, but your role is not assigned yet.
            Please contact your organization admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Logout
          </Button>
          <Button onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

