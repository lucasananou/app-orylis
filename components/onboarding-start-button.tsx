"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";

export function OnboardingStartButton(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const start = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/onboarding/start", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Erreur inconnue.");
      }
      // Aller sur la page d'onboarding qui affichera le formulaire
      router.replace("/onboarding");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de démarrer l’onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Button type="button" size="lg" className="rounded-full" onClick={start} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        Créer mon onboarding maintenant
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
