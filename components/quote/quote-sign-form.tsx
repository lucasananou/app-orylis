"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { QuoteSignatureCanvas } from "./signature-canvas";
import { toast } from "@/components/ui/use-toast";

interface QuoteSignFormProps {
  quoteId: string;
  projectDetails?: {
    name: string;
    total: string;
    delay: string;
  };
}

export function QuoteSignForm({ quoteId, projectDetails }: QuoteSignFormProps) {
  const router = useRouter();
  const [isSigning, setIsSigning] = React.useState(false);

  const handleSign = async (signatureDataUrl: string) => {
    setIsSigning(true);
    console.log("[SignForm] Submitting signature, length:", signatureDataUrl?.length);
    if (!signatureDataUrl || signatureDataUrl.length < 100) {
      toast.error("La signature semble vide. Merci de signer à nouveau.");
      setIsSigning(false);
      return;
    }

    try {
      const response = await fetch(`/api/quotes/${quoteId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Erreur lors de la signature");
      }

      if (data.checkoutUrl) {
        toast.success("Devis signé ! Redirection vers le paiement...");
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.success("Devis signé avec succès !");
      router.refresh();
    } catch (error) {
      console.error("[QuoteSign] Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la signature du devis"
      );
    } finally {
      setIsSigning(false);
    }
  };

  return <QuoteSignatureCanvas onSign={handleSign} disabled={isSigning} projectDetails={projectDetails} />;
}

