import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Mail, Lock, User, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  // Check if user is already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = (isSignup: boolean) => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignup && !fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message === "Invalid login credentials" 
          ? "Email or password is incorrect. Please try again."
          : error.message,
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/dashboard");
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          variant: "destructive",
          title: "Account exists",
          description: "This email is already registered. Please sign in instead.",
        });
        setActiveTab("signin");
      } else {
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
        });
      }
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to ExpenseFlow. Let's get started!",
      });
      navigate("/dashboard");
    }
    
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }
    
    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to send magic link",
        description: error.message,
      });
    } else {
      setMagicLinkSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email for the sign-in link.",
      });
    }
    
    setLoading(false);
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
          <CardTitle className="font-display text-2xl">
            {activeTab === "signin" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {activeTab === "signin" 
              ? "Sign in to manage your team expenses" 
              : "Start managing your team expenses today"}
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mx-6" style={{ width: "calc(100% - 48px)" }}>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <CardContent className="pt-6">
            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {magicLinkSent ? (
                <div className="rounded-lg bg-success/10 p-4 text-center">
                  <Sparkles className="h-8 w-8 mx-auto text-success mb-2" />
                  <p className="font-medium text-success">Magic link sent!</p>
                  <p className="text-sm text-muted-foreground">Check your email to sign in.</p>
                </div>
              ) : (
                <form onSubmit={handleMagicLink}>
                  <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                </form>
              )}
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  <p className="text-xs text-muted-foreground">At least 8 characters</p>
                </div>

                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            {activeTab === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => setActiveTab("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => setActiveTab("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
