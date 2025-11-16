"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface GenerateQuoteButtonProps {
  projectId: string;
  existingQuoteId?: string | null;
}

export function GenerateQuoteButton({ projectId, existingQuoteId }: GenerateQuoteButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = async () => {
    if (existingQuoteId) {
      try {
        // Track Lead when user proceeds to view existing quote
        if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
          try { (window as any).fbq("track", "Lead"); } catch (e) {}
        }
      } catch {}
      router.push(`/quote/${existingQuoteId}`);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/quotes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Erreur lors de la génération du devis");
      }

      // Track Lead when quote successfully generated
      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        try { (window as any).fbq("track", "Lead"); } catch (e) {}
      }

      toast.success("Votre devis personnalisé est prêt !");
      router.push(`/quote/${data.quoteId}`);
    } catch (error) {
      console.error("[GenerateQuote] Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la génération du devis"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      size="lg"
      variant="outline"
      className="w-full text-sm sm:text-base"
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
          Préparation...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4 shrink-0" />
          {existingQuoteId ? "Voir mon devis personnalisé" : "Recevoir mon devis personnalisé"}
        </>
      )}
    </Button>
  );
}

