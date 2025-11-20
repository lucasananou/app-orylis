import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: "done" | "current" | "upcoming";
}

export interface ProgressStepsProps {
  steps: ProgressStep[];
  className?: string;
  showPercentage?: boolean;
  estimatedTimeRemaining?: number; // en minutes
}

export function ProgressSteps({ 
  steps, 
  className,
  showPercentage = false,
  estimatedTimeRemaining
}: ProgressStepsProps) {
  const completedSteps = steps.filter((s) => s.status === "done").length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  const currentStepNumber = steps.findIndex((s) => s.status === "current") + 1;

  return (
    <div className={cn("space-y-4", className)}>
      {/* En-tête avec progression globale */}
      {(showPercentage || estimatedTimeRemaining !== undefined) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Étape {currentStepNumber} sur {totalSteps}
              </span>
              {showPercentage && (
                <span className="text-sm text-muted-foreground">
                  • {percentage}% complété
                </span>
              )}
            </div>
            {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
              <span className="text-xs text-muted-foreground">
                ⏱️ ~{estimatedTimeRemaining} min restantes
              </span>
            )}
          </div>
          {showPercentage && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Liste des étapes */}
      <ol className="flex flex-col gap-3 sm:gap-4">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="relative flex gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                {step.status === "done" ? (
                  <CheckCircle2 className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
                ) : (
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-semibold sm:h-6 sm:w-6",
                      step.status === "current" && "border-accent bg-accent/10 text-accent",
                      step.status === "upcoming" && "border-border text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
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
              <div className="space-y-0.5 sm:space-y-1 flex-1">
                <p className={cn(
                  "text-xs font-semibold sm:text-sm",
                  step.status === "current" ? "text-foreground" : step.status === "done" ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground sm:text-sm">{step.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

