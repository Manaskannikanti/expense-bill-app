import { Shield, Zap, Users } from "lucide-react";

const points = [
  {
    icon: Zap,
    title: "Fast workflows",
    desc: "Submit, approve, and reimburse in a clean, guided flow.",
  },
  {
    icon: Shield,
    title: "Built for control",
    desc: "Role-based views so everyone sees exactly what they need.",
  },
  {
    icon: Users,
    title: "Made for teams",
    desc: "Track team spend, receipts, and approvals without chaos.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-muted/50 px-4 py-24 sm:px-6 lg:px-8 scroll-mt-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              About ExpenseFlow
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              ExpenseFlow is a simple expense management UI designed for modern teams.
              It focuses on clean approvals, clear status tracking, and quick reporting —
              without overwhelming users.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {points.map((p) => (
                <div key={p.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <p.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-8 shadow-lg">
            <div className="text-sm text-muted-foreground">Why it looks strong in an interview</div>
            <h3 className="mt-2 font-display text-2xl font-bold">
              Clean UI + role-based experience
            </h3>
            <p className="mt-4 text-muted-foreground">
              This project shows you can build a polished product interface with reusable components,
              responsive layouts, and clear user flows — exactly what interviewers want to see.
            </p>

            <div className="mt-6 rounded-2xl bg-muted p-5 text-sm">
              <div className="font-medium">Tip for demo:</div>
              <div className="mt-1 text-muted-foreground">
                Walk them through Landing → Sign in → Dashboard → Approvals UI.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

