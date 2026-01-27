import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Receipt, 
  LogOut, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign,
  Building2,
  Users,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface OrganizationMembership {
  id: string;
  role: string;
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

    if (user) {
      fetchUserData();
    }
  }, [user, authLoading, navigate]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch organization membership
      const { data: membershipData } = await supabase
        .from("organization_memberships")
        .select(`
          id,
          role,
          organization:organizations(id, name, slug)
        `)
        .eq("user_id", user.id)
        .single();

      if (membershipData) {
        // Transform the data to match our interface
        const transformed = {
          id: membershipData.id,
          role: membershipData.role,
          organization: Array.isArray(membershipData.organization) 
            ? membershipData.organization[0] 
            : membershipData.organization
        };
        setMembership(transformed as OrganizationMembership);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No organization - show onboarding
  if (!membership) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
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
              You're not part of any organization yet. Create one to get started!
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Create Your Organization</CardTitle>
              <CardDescription>
                Set up your company to start managing team expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full gradient-primary" size="lg">
                <Link to="/onboarding">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Has organization - show dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <span className="text-xs text-muted-foreground capitalize">({membership.role})</span>
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

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <Button className="gradient-primary shadow-lg shadow-primary/25" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Submit New Expense
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approval
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">0 expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved This Month
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">0 expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reimbursed
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spending
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your latest expense submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No expenses yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Submit your first expense to get started
              </p>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Submit Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
