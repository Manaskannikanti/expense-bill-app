import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 -z-10 gradient-hero opacity-90" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)] opacity-40" />
      
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
          <Sparkles className="h-4 w-4" />
          <span>Start for free, no credit card required</span>
        </div>
        
        <h2 className="mt-8 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          Ready to simplify your team's expense management?
        </h2>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
          Join organizations that have already transformed their expense workflow. 
          Get started in minutes, not days.
        </p>
        
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 text-base shadow-xl">
            <Link to="/auth">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-white hover:bg-white/10 text-base">
            <Link to="#features">
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
