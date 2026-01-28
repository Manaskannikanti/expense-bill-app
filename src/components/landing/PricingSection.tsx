import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for small teams trying ExpenseFlow.",
    badge: "Popular for demos",
    features: ["1 organization", "Basic approvals", "Receipt uploads", "Email support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹499",
    desc: "Best for growing teams needing speed + controls.",
    badge: "Recommended",
    features: [
      "Everything in Starter",
      "Role-based access",
      "Export reports",
      "Priority support",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "₹999",
    desc: "For companies needing advanced visibility & audit.",
    badge: "Teams",
    features: ["Everything in Pro", "Advanced reporting", "Policy controls", "Dedicated onboarding"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8 scroll-mt-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing that scales
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose a plan that fits your team. Switch anytime.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={[
                "rounded-2xl border bg-card p-8 shadow-sm transition-all",
                p.highlight ? "ring-2 ring-primary shadow-lg -translate-y-1" : "hover:shadow-lg hover:-translate-y-1",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {p.badge}
                </span>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <div className="text-4xl font-bold">{p.price}</div>
                {p.price !== "Free" && <div className="text-sm text-muted-foreground">/month</div>}
              </div>

              <p className="mt-3 text-muted-foreground">{p.desc}</p>

              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-8 w-full gradient-primary shadow-lg shadow-primary/25">
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

