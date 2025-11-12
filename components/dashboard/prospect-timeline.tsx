"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatProgress } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PHASE_ORDER = ["onboarding", "design", "build", "review", "delivered"] as const;
const PHASE_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  onboarding: { label: "Onboarding", icon: "📋", description: "Collecte des informations" },
  design: { label: "Design", icon: "🎨", description: "Création des maquettes" },
  build: { label: "Développement", icon: "🚀", description: "Construction du site" },
  review: { label: "Review", icon: "👀", description: "Révision et ajustements" },
  delivered: { label: "Livré", icon: "✅", description: "Projet terminé" }
};

interface ProspectTimelineProps {
  projectName: string;
  currentStatus: string;
  progress: number;
  createdAt: string | null;
}

export function ProspectTimeline({
  projectName,
  currentStatus,
  progress,
  createdAt
}: ProspectTimelineProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentStatus as (typeof PHASE_ORDER)[number]);
  const safeProgress = formatProgress(progress);
  const phaseInfo = PHASE_LABELS[currentStatus] ?? PHASE_LABELS.onboarding;

  return (
    <Card className="border border-border/70">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">{projectName}</CardTitle>
            <CardDescription className="mt-2">
              Votre projet est actuellement en phase <strong>{phaseInfo.label}</strong>
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {phaseInfo.icon} {phaseInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression globale</span>
            <span className="font-medium">{safeProgress}%</span>
          </div>
          <Progress value={safeProgress} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Timeline du projet</h3>
          <div className="relative space-y-4">
            {PHASE_ORDER.map((phase, index) => {
              const phaseData = PHASE_LABELS[phase];
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isUpcoming = index > currentIndex;

              return (
                <div key={phase} className="relative flex items-start gap-4">
                  {/* Ligne verticale */}
                  {index < PHASE_ORDER.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-[11px] top-8 h-full w-0.5",
                        isCompleted ? "bg-accent" : "bg-muted"
                      )}
                    />
                  )}

                  {/* Icône */}
                  <div
                    className={cn(
                      "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                      isCompleted
                        ? "border-accent bg-accent text-accent-foreground"
                        : isCurrent
                          ? "border-accent bg-background text-accent"
                          : "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 space-y-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-foreground">
                        {phaseData.icon} {phaseData.label}
                      </span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          En cours
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{phaseData.description}</p>
                    {isCompleted && index === 0 && createdAt && (
                      <p className="text-xs text-muted-foreground">
                        Commencé le {formatDate(createdAt, { dateStyle: "medium" })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prochaine étape */}
        {currentIndex < PHASE_ORDER.length - 1 && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Prochaine étape</p>
            <p className="text-sm text-muted-foreground">
              {currentStatus === "onboarding"
                ? "Prenez rendez-vous pour valider votre démo"
                : `${PHASE_LABELS[PHASE_ORDER[currentIndex + 1]]?.label} : ${PHASE_LABELS[PHASE_ORDER[currentIndex + 1]]?.description}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

