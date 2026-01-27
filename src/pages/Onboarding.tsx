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
  const [orgCode, setOrgCode] = useState(""); // slug/org code
  const [error, setError] = useState("");

  const normalizeCode = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ""); // keep slug-safe

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = normalizeCode(orgCode);
    if (!code) {
      setError("Organization code is required");
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
      // 1) Find organization by slug (ORG CODE)
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("slug", code)
        .single();

      if (orgErr) {
        toast({
          variant: "destructive",
          title: "Organization not found",
          description:
            "Ask your admin for the correct Organization Code (slug).",
        });
        return;
      }

      // 2) If already a member, just go dashboard
      const { data: existingMembership, error: memFindErr } = await supabase
        .from("organization_memberships")
        .select("id, role")
        .eq("organization_id", org.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memFindErr) throw memFindErr;

      if (!existingMembership?.id) {
        // 3) Join as UNASSIGNED (admin will assign role later)
        const { error: joinErr } = await supabase
          .from("organization_memberships")
          .insert({
            user_id: user.id,
            organization_id: org.id,
            role: "unassigned",
          });

        if (joinErr) throw joinErr;
      }

      toast({
        title: "Joined organization!",
        description: `You're now in ${org.name}. Admin will assign your role soon.`,
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error joining organization:", err);
      toast({
        variant: "destructive",
        title: "Failed to join organization",
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
            Join Your Organization
          </CardTitle>
          <CardDescription>
            Enter the <b>Organization Code</b> shared by your admin (example:
            amex).
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleJoinOrganization} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org-code">Organization Code</Label>
              <Input
                id="org-code"
                type="text"
                placeholder="amex"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value)}
                className="text-lg"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">
                This is the organization slug. Ask admin if you don’t have it.
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
                  Join Organization
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        After joining, your role will be <b>unassigned</b> until admin assigns it.
      </p>
    </div>
  );
}
