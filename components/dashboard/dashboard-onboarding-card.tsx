"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { summarizeOnboardingPayload, type OnboardingChecklistSummary } from "@/lib/onboarding-summary";
import { formatDate, formatProgress, type UserRole } from "@/lib/utils";

const sectionIcons: Record<string, string> = {
  "Identité & contact": "🧾",
  "Objectifs": "🎯",
  "Structure": "📄",
  "Inspirations": "💡",
  "Technique": "⚙️",
  "Validation": "✅"
};

interface OnboardingProjectInfo {
  id: string;
  name: string;
  progress: number;
  dueDate: string | null;
  updatedAt: string | null;
  payload: Record<string, unknown> | null;
}

export interface DashboardOnboardingCardProps {
  project: OnboardingProjectInfo | null;
  role: UserRole;
}

export function DashboardOnboardingCard({ project, role }: DashboardOnboardingCardProps) {
  if (!project) {
    return (
      <Card className="border border-border/70">
        <CardHeader className="pb-3">
          <CardTitle>Onboarding</CardTitle>
          <CardDescription>
            Aucune phase d’onboarding en cours. Lancez un nouveau projet pour commencer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/onboarding">Ouvrir l'onboarding</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const safeProgress = formatProgress(project.progress);
  const summary: OnboardingChecklistSummary = summarizeOnboardingPayload(project.payload);

  return (
    <Card className="border border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{project.name}</span>
          <Button size="sm" variant="outline" asChild>
            <a href="/onboarding">Ouvrir l’onboarding</a>
          </Button>
        </CardTitle>
        <CardDescription>
          {summary.nextAction
            ? role === "prospect"
              ? "Prochaine Étape : Prenez rendez-vous pour valider votre démo"
              : `Étape suivante : informations sur ton entreprise`
            : "✅ Onboarding terminé ! Nous pouvons maintenant démarrer la création."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Progress value={safeProgress} />
          <p className="text-xs text-muted-foreground">
            Progression {safeProgress}%
            {project.dueDate ? ` · Échéance ${formatDate(project.dueDate)}` : ""}
            {project.updatedAt ? ` · Dernier enregistrement ${formatDate(project.updatedAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
        </div>

        <ul className="space-y-3">
          {summary.items.map((item) => {
            const icon = sectionIcons[item.title] ?? "";
            return (
              <li key={item.id} className="flex items-start gap-3">
                {item.completed ? (
                  <CheckCircle2 className="mt-1 h-5 w-5 text-accent" />
                ) : (
                  <Circle className="mt-1 h-5 w-5 text-muted-foreground" />
                )}
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    {icon && <span>{icon}</span>}
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {role === "staff" ? (
          <div className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
            <p>
              Astuce staff : utilisez la checklist pour identifier les informations manquantes avant de
              programmer le kick-off.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
