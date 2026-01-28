import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Receipt,
  LogOut,
  Plus,
  Clock,
  CheckCircle2,
  DollarSign,
  Building2,
  TrendingUp,
  Loader2,
  Shield,
  Users,
  FileDown,
} from "lucide-react";

type Role = "admin" | "employee" | "hr" | "accounts" | "unassigned";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface OrganizationMembership {
  id: string;
  role: Role | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<OrganizationMembership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) void fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Membership + org
      const { data: membershipData, error: membershipErr } = await supabase
        .from("organization_memberships")
        .select(
          `
          id,
          role,
          organization:organizations(id, name, slug)
        `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipErr) {
        console.error("Membership fetch error:", membershipErr);
        setMembership(null);
        return;
      }

      if (!membershipData) {
        setMembership(null);
        return;
      }

      const transformed: OrganizationMembership = {
        id: membershipData.id,
        role: (membershipData.role ?? "unassigned") as Role,
        organization: Array.isArray(membershipData.organization)
          ? membershipData.organization[0]
          : membershipData.organization,
      };

      const role = ((transformed.role ?? "unassigned") as string).toLowerCase() as Role;

      // ✅ If unassigned -> pending screen
      if (role === "unassigned") {
        navigate("/pending");
        return;
      }

      setMembership({ ...transformed, role });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const role = useMemo(() => {
    return ((membership?.role ?? "unassigned") as string).toLowerCase() as Role;
  }, [membership?.role]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No org -> onboarding
  if (!membership) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold">ExpenseFlow</span>
            </Link>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary mb-6">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">
              Welcome, {profile?.full_name || "there"}!
            </h1>
            <p className="text-lg text-muted-foreground">
              You're not part of any organization yet. Create or join one to get started!
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Create or Join Organization</CardTitle>
              <CardDescription>
                Enter your organization name to create a new one or join an existing one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full gradient-primary" size="lg">
                <Link to="/onboarding">
                  <Plus className="h-4 w-4 mr-2" />
                  Continue to Onboarding
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ✅ Role dashboards (same page)
  const roleTitle =
    role === "admin" ? "Admin Dashboard" :
    role === "hr" ? "HR Dashboard" :
    role === "accounts" ? "Accounts Dashboard" :
    "Employee Dashboard";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold">ExpenseFlow</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{membership.organization.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                ({role})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-muted-foreground">
              {profile?.full_name || profile?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{roleTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Choose what you want to do based on your role.
          </p>
        </div>

        {/* ✅ Quick Actions per role */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(role === "employee" || role === "admin") && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Submit Expense
                </CardTitle>
                <CardDescription>Upload a new bill for approval.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gradient-primary" onClick={() => navigate("/expenses/new")}>
                  Submit New Expense
                </Button>
              </CardContent>
            </Card>
          )}

          {role === "admin" && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Manage Members
                </CardTitle>
                <CardDescription>Approve users and assign roles.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate("/admin/members")}>
                  Open Members Panel
                </Button>
              </CardContent>
            </Card>
          )}

          {role === "hr" && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> HR Approvals
                </CardTitle>
                <CardDescription>Approve or reject employee bills.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gradient-primary" onClick={() => navigate("/hr/approvals")}>
                  Review Pending Expenses
                </Button>
              </CardContent>
            </Card>
          )}

          {role === "accounts" && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" /> Accounts Export
                </CardTitle>
                <CardDescription>Download approved receipts for processing.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gradient-primary" onClick={() => navigate("/accounts/export")}>
                  Download Approved Bills
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Basic stats placeholder (we’ll wire real counts later) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">wire real count next</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">wire real count next</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reimbursed</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">wire real count next</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">wire real count next</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
