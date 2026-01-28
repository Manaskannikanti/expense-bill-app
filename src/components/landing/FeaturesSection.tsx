import { Camera, CheckCircle2, FileText, PieChart, Shield, Users } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Smart Receipt Scanning",
    description: "Snap a photo or upload a receipt. Our OCR extracts amount, date, and vendor automatically.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: CheckCircle2,
    title: "Streamlined Approvals",
    description: "Multi-level approval workflow from managers to finance. Approve or reject with one click.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Users,
    title: "Team Organization",
    description: "Organize by departments and teams. Tag expenses to specific outings and events.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Custom roles for employees, managers, HR, and finance. Everyone sees what they need.",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    icon: FileText,
    title: "Custom Categories",
    description: "Define expense categories that match your organization's needs and policies.",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: PieChart,
    title: "Real-Time Reports",
    description: "Track spending trends, pending approvals, and reimbursement status at a glance.",
    color: "bg-primary/10 text-primary",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-24 bg-muted/50 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to manage
            <span className="text-gradient-primary"> team expenses</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            From receipt capture to final reimbursement, we've got you covered.
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} transition-transform group-hover:scale-110`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">
                {feature.title}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
