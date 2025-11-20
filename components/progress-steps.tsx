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

      {/* Version desktop améliorée - Timeline horizontale */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Ligne de connexion horizontale */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-border hidden lg:block" />
          
          {/* Étapes en ligne horizontale */}
          <div className="relative flex flex-wrap lg:flex-nowrap gap-4 lg:gap-6 justify-center lg:justify-between">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "relative flex-1 min-w-[200px] max-w-[280px] lg:max-w-none lg:flex-initial lg:w-[calc(16.666%-1.25rem)]",
                    "rounded-xl border-2 p-5 transition-all duration-300",
                    step.status === "current" && "border-accent bg-accent/5 shadow-lg shadow-accent/20 scale-105 z-10",
                    step.status === "done" && "border-green-200 bg-green-50/50 hover:shadow-md",
                    step.status === "upcoming" && "border-border/50 bg-muted/20 opacity-60"
                  )}
                >
                  {/* Numéro de l'étape avec ligne de connexion */}
                  <div className="flex items-center justify-center mb-4 relative">
                    {/* Ligne de connexion à gauche (sauf première étape) */}
                    {index > 0 && (
                      <div className={cn(
                        "absolute right-full w-4 lg:w-6 h-0.5",
                        steps[index - 1].status === "done" ? "bg-green-500" : "bg-border"
                      )} />
                    )}
                    
                    {/* Cercle de l'étape */}
                    <div className={cn(
                      "relative flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full border-2 font-semibold text-base lg:text-lg transition-all z-10",
                      step.status === "done" && "border-green-500 bg-green-500 text-white shadow-md",
                      step.status === "current" && "border-accent bg-accent text-white shadow-lg ring-4 ring-accent/20",
                      step.status === "upcoming" && "border-muted-foreground/30 bg-background text-muted-foreground"
                    )}>
                      {step.status === "done" ? (
                        <CheckCircle2 className="h-6 w-6 lg:h-7 lg:w-7" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Ligne de connexion à droite (sauf dernière étape) */}
                    {!isLast && (
                      <div className={cn(
                        "absolute left-full w-4 lg:w-6 h-0.5",
                        step.status === "done" ? "bg-green-500" : "bg-border"
                      )} />
                    )}
                  </div>

                  {/* Contenu de l'étape */}
                  <div className="space-y-2 text-center">
                    {step.status === "current" && (
                      <span className="inline-block text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full mb-2">
                        En cours
                      </span>
                    )}
                    <h3 className={cn(
                      "font-semibold text-base lg:text-lg mb-2",
                      step.status === "current" && "text-foreground",
                      step.status === "done" && "text-foreground",
                      step.status === "upcoming" && "text-muted-foreground"
                    )}>
                      {step.label}
                    </h3>
                    {step.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
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
                        <span className="text-accent font-medium whitespace-nowrap">En cours...</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

