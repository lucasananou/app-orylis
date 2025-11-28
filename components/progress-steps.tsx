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
    <div className={cn("space-y-4 md:space-y-6 w-full", className)}>
      {/* En-tête avec progression globale - Séparé en haut */}
      {(showPercentage || estimatedTimeRemaining !== undefined) && (
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm md:text-base font-semibold text-foreground">
                Étape {currentStepNumber} sur {totalSteps}
              </span>
              {showPercentage && (
                <span className="text-sm md:text-base text-muted-foreground">
                  • {percentage}% complété
                </span>
              )}
            </div>
            {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
              <span className="text-xs md:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                ⏱️ ~{estimatedTimeRemaining} min restantes
              </span>
            )}
          </div>
          {showPercentage && (
            <div className="h-2 md:h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent/80 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--accent-rgb),0.4)]"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Liste des étapes - Mobile: vertical */}
      <ol className="flex flex-col gap-3 sm:gap-4 md:hidden">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="relative flex gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                {step.status === "done" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                ) : (
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                      step.status === "current"
                        ? "border-accent bg-accent text-white shadow-md"
                        : "border-muted-foreground/30 text-muted-foreground bg-background"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 h-full w-0.5 rounded-full",
                      step.status === "done" ? "bg-green-500/50" : "bg-border"
                    )}
                  />
                )}
              </div>
              <div className="space-y-0.5 sm:space-y-1 flex-1 pb-4">
                <p className={cn(
                  "text-sm font-semibold transition-colors",
                  step.status === "current" ? "text-accent" : step.status === "done" ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Version desktop améliorée - Grille 4 colonnes */}
      <div className="hidden md:block w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {steps.map((step, index) => {
            const isCurrent = step.status === "current";
            const isDone = step.status === "done";

            return (
              <div
                key={step.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-300 ease-out h-full",
                  // Styles pour l'étape en cours
                  isCurrent && "border-accent/50 bg-gradient-to-br from-accent/5 via-background to-background shadow-[0_4px_20px_-4px_rgba(var(--accent-rgb),0.15)] ring-1 ring-accent/20 scale-[1.02] z-10",
                  // Styles pour l'étape terminée
                  isDone && "border-green-200/60 bg-gradient-to-br from-green-50/50 to-background hover:border-green-300/60 hover:shadow-sm",
                  // Styles pour l'étape à venir
                  step.status === "upcoming" && "border-border/40 bg-muted/5 opacity-70 hover:opacity-100 hover:bg-muted/10"
                )}
              >
                <div>
                  {/* En-tête de la carte */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300",
                      isDone && "border-green-500 bg-green-500 text-white shadow-sm scale-110",
                      isCurrent && "border-accent bg-accent text-white shadow-md scale-110",
                      step.status === "upcoming" && "border-muted-foreground/20 text-muted-foreground bg-background"
                    )}>
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        En cours
                      </span>
                    )}
                  </div>

                  {/* Contenu */}
                  <h3 className={cn(
                    "font-semibold text-base mb-1.5 transition-colors",
                    isCurrent && "text-foreground",
                    isDone && "text-foreground/80",
                    step.status === "upcoming" && "text-muted-foreground"
                  )}>
                    {step.label}
                  </h3>

                  {step.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Barre de progression interne pour l'étape active */}
                {isCurrent && (
                  <div className="mt-4 pt-3 border-t border-accent/10">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-accent/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-1/2 animate-[shimmer_2s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-accent via-white/20 to-accent" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

