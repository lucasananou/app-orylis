"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

// Cast Dialog components to any to avoid React version mismatch issues
const DialogComp = Dialog as any;
const DialogTriggerComp = DialogTrigger as any;
const DialogContentComp = DialogContent as any;
const DialogTitleComp = DialogTitle as any;
const DialogDescriptionComp = DialogDescription as any;

interface ModificationRequestDialogProps {
    projectId: string;
    trigger?: React.ReactNode;
}

export function ModificationRequestDialog({ projectId, trigger }: ModificationRequestDialogProps) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [feedback, setFeedback] = React.useState("");

    const handleSubmit = async () => {
        if (!feedback.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/modification-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback })
            });

            if (!response.ok) throw new Error("Erreur lors de l'envoi");

            toast.success("Demande envoyée ! Le projet repasse en production.");
            setOpen(false);
            setFeedback("");
            router.refresh();
        } catch (error) {
            toast.error("Impossible d'envoyer la demande.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DialogComp open={open} onOpenChange={setOpen}>
            <DialogTriggerComp asChild>
                {trigger || (
                    <Button variant="ghost" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Demander des modifications
                    </Button>
                )}
            </DialogTriggerComp>
            <DialogContentComp className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitleComp>Demande de modifications</DialogTitleComp>
                    <DialogDescriptionComp>
                        Détaillez vos retours sur cette version. Nous allons prendre en compte vos remarques et préparer une nouvelle version.
                    </DialogDescriptionComp>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Ex: La couleur du bouton contact n'est pas la bonne, il manque une section sur..."
                        className="min-h-[150px]"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !feedback.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Envoyer la demande
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContentComp>
        </DialogComp>
    );
}
