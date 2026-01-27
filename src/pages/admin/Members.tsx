import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || data?.role !== "admin") {
        navigate("/dashboard");
      }
    };

    checkAdmin();
  }, [user, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Management</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link to="/admin/members">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
