"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, FileText, Sparkles } from "lucide-react";
import Link from "next/link";

interface ProspectCTAWidgetProps {
  hasOnboarding: boolean;
  onboardingProgress: number;
  quoteStatus: "pending" | "signed" | "cancelled" | null;
  projectName: string;
}

export function ProspectCTAWidget({
  hasOnboarding,
  onboardingProgress,
  quoteStatus,
  projectName
}: ProspectCTAWidgetProps) {
  // Si onboarding incomplet
  if (hasOnboarding && onboardingProgress < 100) {
    return (
      <Card className="border border-blue-200 bg-gradient-to-br from-blue-50/50 to-accent/10 w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Prochaine étape</CardTitle>
          </div>
          <CardDescription>
            Complétez votre onboarding pour recevoir votre démo personnalisée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${onboardingProgress}%` }}
              />
            </div>
            <span className="text-xs font-medium">{onboardingProgress}%</span>
          </div>
          <Button asChild className="w-full" size="lg">
            <Link href="/onboarding">
              Continuer l&apos;onboarding
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Si onboarding complété mais pas de devis
  if (!quoteStatus) {
    return (
      <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Générez votre devis</CardTitle>
          </div>
          <CardDescription>
            Votre onboarding est complété ! Obtenez votre devis personnalisé en quelques clics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link href="/demo">
              Générer mon devis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Si devis en attente de signature
  if (quoteStatus === "pending") {
    return (
      <Card className="border border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-900">Votre devis est prêt !</CardTitle>
          </div>
          <CardDescription className="text-amber-800">
            Il ne vous reste plus qu&apos;à le valider pour lancer la création de votre site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white border-amber-600" size="lg">
            <Link href="/demo">
              Voir et signer mon devis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Si tout est fait (signé)
  return (
    <Card className="border border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/30 w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Tout est en ordre !</CardTitle>
        </div>
        <CardDescription>
          Votre projet {projectName} est en cours. Consultez les dernières mises à jour ci-dessous.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

