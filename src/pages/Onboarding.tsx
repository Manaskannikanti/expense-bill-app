import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orgName.trim()) {
      setError("Organization name is required");
      return;
    }
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create an organization",
      });
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const slug = generateSlug(orgName);
      
      // Create the organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: orgName.trim(),
          slug: slug + "-" + Date.now().toString(36), // Ensure uniqueness
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add the user as an admin of the organization
      const { error: memberError } = await supabase
        .from("organization_memberships")
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      // Create default expense categories
      const defaultCategories = [
        { name: "Team Lunch", icon: "🍽️", color: "#8b5cf6" },
        { name: "Team Outing", icon: "🎉", color: "#f97316" },
        { name: "Transportation", icon: "🚗", color: "#06b6d4" },
        { name: "Supplies", icon: "📦", color: "#10b981" },
        { name: "Other", icon: "📋", color: "#6b7280" },
      ];

      await supabase.from("expense_categories").insert(
        defaultCategories.map((cat) => ({
          organization_id: org.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
        }))
      );

      toast({
        title: "Organization created!",
        description: `Welcome to ${orgName}. You're all set to start managing expenses.`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        variant: "destructive",
        title: "Failed to create organization",
        description: error.message || "Please try again",
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
          <CardTitle className="font-display text-2xl">Create Your Organization</CardTitle>
          <CardDescription>
            Set up your company to start managing team expenses
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreateOrganization} className="space-y-6">
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
                This is the name of your company or team
              </p>
            </div>

            <Button type="submit" className="w-full gradient-primary" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Organization
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an organization?{" "}
        <span className="text-primary">
          Ask your admin for an invite
        </span>
      </p>
    </div>
  );
}
