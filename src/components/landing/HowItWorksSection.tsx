import { Camera, FileCheck, Send, Wallet } from "lucide-react";

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
      className="relative px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            From receipt to reimbursement in four simple steps
          </p>
        </div>

        {/* Steps container */}
        <div className="relative mt-20 grid gap-16 md:grid-cols-2 lg:grid-cols-4">
          
          {/* CONNECTOR LINE (desktop only) */}
          <div className="absolute left-0 right-0 top-8 hidden lg:block">
            <div className="mx-auto h-px w-[85%] bg-border" />
          </div>

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative z-10 flex flex-col items-center text-center"
            >
              {/* Step label */}
              <div className="mb-3 text-sm font-semibold text-muted-foreground">
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
              <p className="mt-2 text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
