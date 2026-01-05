"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { generateAdminQuote } from "@/actions/admin/quotes";
import { toast } from "sonner";

interface QuoteButtonProps {
    projectId: string;
}

export function QuoteButton({ projectId }: QuoteButtonProps) {
    return (
        <Button
            variant="outline"
            onClick={async () => {
                toast.promise(generateAdminQuote(projectId), {
                    loading: 'Génération du devis...',
                    success: (data: any) => data.error ? data.error : (data.message || 'Devis généré ! 📄'),
                    error: 'Erreur lors de la génération'
                });
            }}
        >
            <FileText className="mr-2 h-4 w-4" />
            Générer un devis
        </Button>
    );
}
