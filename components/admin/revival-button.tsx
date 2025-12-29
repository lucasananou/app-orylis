"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { launchRevivalCampaign } from "@/actions/admin/campaigns";

interface RevivalButtonProps {
    ghostCount: number;
}

export function RevivalButton({ ghostCount }: RevivalButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleLaunch = async () => {
        setIsLoading(true);
        try {
            const result = await launchRevivalCampaign();
            if (result.success) {
                toast.success(result.message);
                setOpen(false);
            } else {
                toast.error("Erreur lors du lancement de la campagne.");
            }
        } catch (error) {
            toast.error("Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    if (ghostCount === 0) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-600 border-none hover:from-orange-600 hover:to-red-700 text-white shadow-lg">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-white" />}
                    Relancer {ghostCount} fantômes 👻
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lancer l'opération "Réveil" ?</DialogTitle>
                    <DialogDescription>
                        Vous allez envoyer un email de relance minimaliste ("Votre projet ?") à <strong>{ghostCount} prospects</strong> inactifs depuis plus de 7 jours.
                        <br /><br />
                        Cette action est irréversible. Êtes-vous sûr ?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={handleLaunch} className="bg-red-600 hover:bg-red-700 text-white border-0">
                        🚀 Envoyer les emails
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
