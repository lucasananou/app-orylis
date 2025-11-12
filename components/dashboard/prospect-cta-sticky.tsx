"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProspectCTAStickyProps {
  projectStatus: string;
  projectProgress: number;
  className?: string;
}

const STATUS_MESSAGES: Record<string, { message: string; cta: string }> = {
  onboarding: {
    message: "Votre onboarding est en cours. Devenez client pour suivre tous les détails.",
    cta: "Activer mon accès client"
  },
  design: {
    message: "Votre projet est en phase Design 🎨. Devenez client pour voir les maquettes et donner votre avis.",
    cta: "Devenir client maintenant"
  },
  build: {
    message: "Votre site est en développement 🚀. Devenez client pour suivre l'avancement en détail.",
    cta: "Activer mon espace complet"
  },
  review: {
    message: "Votre projet est presque prêt ! Devenez client pour accéder à la version finale.",
    cta: "Devenir client maintenant"
  },
  delivered: {
    message: "Votre projet est livré ! Devenez client pour accéder à tous les fichiers et documents.",
    cta: "Activer mon accès client"
  }
};

export function ProspectCTASticky({
  projectStatus,
  projectProgress,
  className
}: ProspectCTAStickyProps) {
  const statusMessage = STATUS_MESSAGES[projectStatus] ?? STATUS_MESSAGES.onboarding;

  return (
    <div
      className={cn(
        "sticky bottom-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg",
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-full bg-accent/10 p-2 shrink-0">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{statusMessage.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Progression : {projectProgress}% · Projet actif
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="shrink-0 w-full sm:w-auto"
            onClick={() => {
              window.location.href = "https://buy.stripe.com/aFafZh02O6yJf7H3DOgIo0p";
            }}
          >
            {statusMessage.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

