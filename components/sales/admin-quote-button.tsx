"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminQuoteButtonProps {
    projectId: string | undefined;
    prospectName: string;
}

export function AdminQuoteButton({ projectId, prospectName }: AdminQuoteButtonProps) {
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!projectId) {
            toast.error("Aucun projet associé à ce prospect. Impossible de créer un devis.");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch("/api/quotes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId })
            });

            const data = await response.json();

            if (!response.ok) {
                // If quote already exists, the API returns the ID
                if (data.quoteId) {
                    toast.info("Un devis existe déjà pour ce prospect.");
                    // Optionally redirect to it?
                    // router.push(`/dashboard/quote/${data.quoteId}`);
                }
                throw new Error(data.error ?? "Erreur lors de la génération");
            }

            toast.success(`Devis créé et envoyé à ${prospectName}`);
            router.refresh(); // Refresh page to show the new document in the list

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Erreur inconnue");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs h-8 gap-2"
            onClick={handleGenerate}
            disabled={isGenerating || !projectId}
            title={!projectId ? "Aucun projet trouvé pour ce prospect" : "Générer et envoyer un devis"}
        >
            {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <Plus className="h-3 w-3" />
            )}
            Créer un devis
        </Button>
    );
}
