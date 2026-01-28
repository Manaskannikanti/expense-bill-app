import { ArrowRight, Camera, FileCheck, Send, Wallet } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Capture Receipt",
    description: "Take a photo or upload your receipt. Works with any bill format.",
    color: "bg-primary text-primary-foreground",
  },
  {
    number: "02",
    icon: FileCheck,
    title: "Review & Submit",
    description: "Verify extracted data, add category and notes, then submit for approval.",
    color: "bg-accent text-accent-foreground",
  },
  {
    number: "03",
    icon: Send,
    title: "Get Approved",
    description: "Managers review and approve. Finance handles final sign-off.",
    color: "bg-success text-success-foreground",
  },
  {
    number: "04",
    icon: Wallet,
    title: "Get Reimbursed",
    description: "Track status and receive reimbursement. Everything in one place.",
    color: "bg-secondary text-secondary-foreground",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            From receipt to reimbursement in four simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-16 hidden h-px w-full bg-border lg:block">
                  <ArrowRight className="absolute -right-2 -top-2 h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                {/* Step number badge */}
                <div className="mb-4 text-sm font-bold text-muted-foreground">
                  STEP {step.number}
                </div>

                {/* Icon */}
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${step.color} shadow-lg`}
                >
                  <step.icon className="h-8 w-8" />
                </div>

                {/* Content */}
                <h3 className="mt-6 font-display text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
