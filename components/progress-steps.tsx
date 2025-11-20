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

      {/* Liste des étapes - Mobile: vertical, Desktop: amélioré avec cartes */}
      <ol className="flex flex-col gap-3 sm:gap-4 md:hidden">
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

      {/* Version desktop améliorée avec cartes */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {steps.map((step, index) => {
          return (
            <div
              key={step.id}
              className={cn(
                "relative rounded-xl border-2 p-4 lg:p-5 transition-all duration-200",
                step.status === "current" && "border-accent bg-accent/5 shadow-md shadow-accent/10 scale-105",
                step.status === "done" && "border-green-200 bg-green-50/50",
                step.status === "upcoming" && "border-border/50 bg-muted/30 opacity-75"
              )}
            >
              {/* Numéro de l'étape */}
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full border-2 font-semibold text-sm lg:text-base transition-all",
                  step.status === "done" && "border-green-500 bg-green-500 text-white",
                  step.status === "current" && "border-accent bg-accent text-white shadow-lg",
                  step.status === "upcoming" && "border-muted-foreground/30 bg-muted text-muted-foreground"
                )}>
                  {step.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 lg:h-6 lg:w-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                {step.status === "current" && (
                  <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                    En cours
                  </span>
                )}
              </div>

              {/* Titre et description */}
              <div className="space-y-1.5">
                <h3 className={cn(
                  "font-semibold text-sm lg:text-base",
                  step.status === "current" && "text-foreground",
                  step.status === "done" && "text-foreground",
                  step.status === "upcoming" && "text-muted-foreground"
                )}>
                  {step.label}
                </h3>
                {step.description && (
                  <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Indicateur de progression pour l'étape courante */}
              {step.status === "current" && (
                <div className="mt-4 pt-3 border-t border-accent/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent w-1/3 animate-pulse" />
                    </div>
                    <span className="text-accent font-medium">En cours...</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

