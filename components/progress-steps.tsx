import { cn } from "@/lib/utils";

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: "done" | "current" | "upcoming";
}

export interface ProgressStepsProps {
  steps: ProgressStep[];
  className?: string;
}

export function ProgressSteps({ steps, className }: ProgressStepsProps) {
  return (
    <ol className={cn("flex flex-col gap-3 sm:gap-4", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3 sm:gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-semibold sm:h-6 sm:w-6",
                  step.status === "done" && "border-accent bg-accent text-accent-foreground",
                  step.status === "current" && "border-accent text-accent",
                  step.status === "upcoming" && "border-border text-muted-foreground"
                )}
              >
                {index + 1}
              </span>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 h-8 w-px sm:mt-2 sm:h-12",
                    step.status === "done" ? "bg-accent" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs font-semibold text-foreground sm:text-sm">{step.label}</p>
              {step.description && <p className="text-xs text-muted-foreground sm:text-sm">{step.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

