import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Building2, Loader2, ArrowRight } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleCreateOrJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = orgName.trim();
    if (!name) {
      setError("Organization name is required");
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to continue",
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1) If org already exists by name -> JOIN it
      const { data: existingOrg, error: findErr } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("name", name)
        .maybeSingle();

      if (findErr) throw findErr;

      let organizationId: string;
      let createdNewOrg = false;

      if (existingOrg?.id) {
        organizationId = existingOrg.id;
      } else {
        // 2) Else CREATE org (first user becomes admin)
        const slug = generateSlug(name);

        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name,
            slug: slug + "-" + Date.now().toString(36), // uniqueness
          })
          .select("id, name")
          .single();

        if (orgError) throw orgError;

        organizationId = org.id;
        createdNewOrg = true;

        // Create default expense categories ONLY when org is newly created
        const defaultCategories = [
          { name: "Team Lunch", icon: "🍽️", color: "#8b5cf6" },
          { name: "Team Outing", icon: "🎉", color: "#f97316" },
          { name: "Transportation", icon: "🚗", color: "#06b6d4" },
          { name: "Supplies", icon: "📦", color: "#10b981" },
          { name: "Other", icon: "📋", color: "#6b7280" },
        ];

        await supabase.from("expense_categories").insert(
          defaultCategories.map((cat) => ({
            organization_id: organizationId,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          })),
        );
      }

      // 3) Prevent duplicates: if user is already a member, do nothing
      const { data: existingMembership, error: memFindErr } = await supabase
        .from("organization_memberships")
        .select("id, role")
        .eq("organization_id", organizationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memFindErr) throw memFindErr;

      if (!existingMembership?.id) {
        const roleToSet = createdNewOrg ? "admin" : "unassigned";

        const { error: memberError } = await supabase
          .from("organization_memberships")
          .insert({
            user_id: user.id,
            organization_id: organizationId,
            role: roleToSet,
          });

        if (memberError) throw memberError;
      }

      toast({
        title: createdNewOrg ? "Organization created!" : "Joined organization!",
        description: createdNewOrg
          ? `Welcome to ${name}. You're set to start managing expenses.`
          : `You're now in ${name}. Your admin will assign your role soon.`,
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error creating/joining organization:", err);
      toast({
        variant: "destructive",
        title: "Failed",
        description: err?.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25">
          <Receipt className="h-6 w-6 text-white" />
        </div>
        <span className="font-display text-2xl font-bold">ExpenseFlow</span>
      </Link>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">
            Create or Join Organization
          </CardTitle>
          <CardDescription>
            If the name already exists, you’ll join it (role = unassigned). If not,
            you’ll create it (you become admin).
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreateOrJoinOrganization} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                type="text"
                placeholder="Acme Inc."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="text-lg"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">
                Type the exact org name to join an existing one.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Joining an org puts you as <b>unassigned</b> until admin sets your role.
      </p>
    </div>
  );
}
