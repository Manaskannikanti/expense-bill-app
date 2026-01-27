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
  const [orgCode, setOrgCode] = useState(""); // optional
  const [error, setError] = useState("");

  // keep slug-safe
  const normalizeCode = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

  const generateSlugFromName = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Makes sure slug is UNIQUE in DB
  const makeUniqueSlug = async (base: string) => {
    const clean = generateSlugFromName(base) || "org";
    let slug = clean;

    for (let i = 0; i < 20; i++) {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!data?.id) return slug;

      slug = `${clean}-${Math.random().toString(36).slice(2, 6)}`;
    }

    return `${clean}-${Date.now().toString(36)}`;
  };

  const handleCreateOrJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to continue",
      });
      return;
    }

    const name = orgName.trim();
    if (!name) {
      setError("Organization name is required");
      return;
    }

    const codeInput = normalizeCode(orgCode);
    const baseSlug = codeInput || generateSlugFromName(name);

    if (!baseSlug) {
      setError("Organization code is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1) Try find org by slug (code)
      const { data: orgFound, error: findErr } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (findErr) throw findErr;

      let orgId: string;
      let created = false;
      let finalSlug = baseSlug;

      // 2) If not found → CREATE org
      if (!orgFound?.id) {
        // IMPORTANT: ensure uniqueness
        finalSlug = await makeUniqueSlug(baseSlug);

        const { data: orgCreated, error: createErr } = await supabase
          .from("organizations")
          .insert({
            name,
            slug: finalSlug,
            owner_id: user.id, // remove this line if your table doesn't have owner_id
          })
          .select("id, name, slug")
          .single();

        if (createErr) throw createErr;

        orgId = orgCreated.id;
        created = true;
      } else {
        orgId = orgFound.id;
      }

      // 3) If membership exists, just go dashboard
      const { data: mem, error: memErr } = await supabase
        .from("organization_memberships")
        .select("id, role")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memErr) throw memErr;

      if (!mem?.id) {
        const roleToSet = created ? "admin" : "unassigned";

        const { error: joinErr } = await supabase
          .from("organization_memberships")
          .insert({
            user_id: user.id,
            organization_id: orgId,
            role: roleToSet,
          });

        if (joinErr) throw joinErr;
      }

      toast({
        title: created ? "Organization created!" : "Joined organization!",
        description: created
          ? `Created ${name}. Organization Code: "${finalSlug}". Share it with members.`
          : `Joined ${orgFound?.name ?? name}. Admin will assign your role soon.`,
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
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
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

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
            If the code exists → you join as <b>unassigned</b>. If not → it creates the org and you become <b>admin</b>.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreateOrJoin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                type="text"
                placeholder="Acme Inc."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-code">Organization Code (optional)</Label>
              <Input
                id="org-code"
                type="text"
                placeholder="acme"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional. If empty, we generate from the name. If the slug already exists, it will auto-add a small suffix.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

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
        Members should use the same <b>Organization Code</b> to join.
      </p>
    </div>
  );
}
