"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { useRouter } from "next/navigation";

interface Brief {
    id: string;
    version: number;
    content: string;
    status: "draft" | "sent" | "approved" | "rejected";
    clientComment: string | null;
    createdAt: string;
}

interface BriefValidationCardProps {
    brief: Brief;
}

export function BriefValidationCard({ brief }: BriefValidationCardProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [comment, setComment] = useState("");

    const router = useRouter();

    const handleStatusUpdate = async (status: "approved" | "rejected") => {
        if (status === "rejected" && !comment.trim()) {
            toast.error("Veuillez expliquer pourquoi vous demandez des modifications.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/briefs/${brief.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, clientComment: comment })
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(status === "approved" ? "Brief validé avec succès ! 🎉" : "Demande de modifications envoyée.");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-l-4 border-l-blue-600 border-y border-r border-slate-200 shadow-sm bg-white">
            <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        Étape 2
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Validation requise</span>
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Validation du Brief de Production
                </CardTitle>
                <CardDescription className="text-base">
                    Nous avons rédigé le cahier des charges de votre site (Version {brief.version}). Merci de le valider pour lancer la production.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-sm leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto font-mono text-slate-700">
                    {brief.content}
                </div>

                {showRejectForm ? (
                    <div className="space-y-4 bg-red-50 p-4 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-semibold text-red-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Demande de modifications
                        </h4>
                        <Textarea
                            placeholder="Expliquez-nous ce qui doit être modifié..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="bg-white"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)} disabled={isSubmitting}>
                                Annuler
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={() => handleStatusUpdate("rejected")}
                                disabled={isSubmitting || !comment.trim()}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Envoyer la demande
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            onClick={() => handleStatusUpdate("approved")}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                            Valider le brief & Lancer la production
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            onClick={() => setShowRejectForm(true)}
                            disabled={isSubmitting}
                        >
                            <XCircle className="mr-2 h-5 w-5" />
                            Demander des modifications
                        </Button>
                    </div>
                )}
            </CardContent>
            <CardFooter className="text-xs text-slate-500 border-t pt-4">
                Dernière mise à jour : {format(new Date(brief.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}
            </CardFooter>
        </Card>
    );
}

import { Send } from "lucide-react";
