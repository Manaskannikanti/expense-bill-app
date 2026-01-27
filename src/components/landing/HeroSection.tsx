import { Button } from "@/components/ui/button";
import { ArrowRight, Receipt, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-32 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Simplify team expense management</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl" style={{ animationDelay: "0.1s" }}>
            <span className="block">Team Expenses,</span>
            <span className="text-gradient-primary block">Made Effortless</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-in mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: "0.2s" }}>
            Digitize receipts, streamline approvals, and track spending across your organization. 
            No more lost bills or manual data entry.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in mt-10 flex flex-col gap-4 sm:flex-row" style={{ animationDelay: "0.3s" }}>
            <Button asChild size="lg" className="gradient-primary gap-2 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link to="#features">
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="animate-fade-in mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">10x Faster</p>
              <p className="text-sm text-muted-foreground">Expense processing</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">99% Accuracy</p>
              <p className="text-sm text-muted-foreground">OCR extraction</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Users className="h-6 w-6 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">Teams Love It</p>
              <p className="text-sm text-muted-foreground">Easy for everyone</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
