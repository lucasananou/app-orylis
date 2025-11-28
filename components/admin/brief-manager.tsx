"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, History, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Brief {
    id: string;
    version: number;
    content: string;
    status: "draft" | "sent" | "approved" | "rejected";
    clientComment: string | null;
    createdAt: string;
}

interface BriefManagerProps {
    projectId: string;
}

export function BriefManager({ projectId }: BriefManagerProps) {
    const [briefs, setBriefs] = useState<Brief[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchBriefs();
    }, [projectId]);

    const fetchBriefs = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/briefs`);
            if (!res.ok) throw new Error("Failed to fetch briefs");
            const data = await res.json();
            setBriefs(data);

            // Pre-fill new content with last brief content if exists
            if (data.length > 0 && !newContent) {
                setNewContent(data[0].content);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement des briefs");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!newContent.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/briefs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newContent })
            });

            if (!res.ok) throw new Error("Failed to create brief");

            toast.success("Brief envoyé au client !");
            await fetchBriefs();
            // Keep content for reference but maybe clear if needed? No, better keep it.
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'envoi du brief");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
    }

    const currentBrief = briefs[0]; // Most recent because of sort in API
    const isPending = currentBrief?.status === "sent";
    const isApproved = currentBrief?.status === "approved";

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-xl font-semibold">Brief de Production</CardTitle>
                        <CardDescription>Rédigez et validez le périmètre du projet avec le client.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                        <History className="mr-2 h-4 w-4" />
                        {showHistory ? "Masquer l'historique" : "Voir l'historique"}
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Status Banner */}
                    {currentBrief && (
                        <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${isApproved ? "bg-green-50 border-green-200 text-green-800" :
                            currentBrief.status === "rejected" ? "bg-red-50 border-red-200 text-red-800" :
                                "bg-blue-50 border-blue-200 text-blue-800"
                            }`}>
                            {isApproved ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> :
                                currentBrief.status === "rejected" ? <XCircle className="h-5 w-5 mt-0.5" /> :
                                    <AlertCircle className="h-5 w-5 mt-0.5" />}

                            <div className="flex-1">
                                <h4 className="font-semibold text-sm uppercase tracking-wide mb-1">
                                    {isApproved ? "Brief Validé" :
                                        currentBrief.status === "rejected" ? "Modifications Demandées" :
                                            "En attente de validation"}
                                </h4>
                                {currentBrief.status === "rejected" && currentBrief.clientComment && (
                                    <div className="mt-2 text-sm bg-white/50 p-3 rounded border border-red-100 italic">
                                        "{currentBrief.clientComment}"
                                    </div>
                                )}
                                {isPending && (
                                    <p className="text-sm opacity-90">Le client a reçu la version {currentBrief.version} et doit la valider.</p>
                                )}
                                {isApproved && (
                                    <p className="text-sm opacity-90">Le périmètre est validé (Version {currentBrief.version}). Vous pouvez lancer la production.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Editor */}
                    {!isApproved && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    {currentBrief ? `Nouvelle version (v${currentBrief.version + 1})` : "Premier brouillon"}
                                </label>
                                <Textarea
                                    placeholder="Décrivez ici le périmètre du projet, les pages, les fonctionnalités..."
                                    className="min-h-[200px] font-mono text-sm"
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSubmit} disabled={isSubmitting || !newContent.trim()}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Envoyer au client
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            {showHistory && briefs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Historique des versions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {briefs.map((brief) => (
                                <div key={brief.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <span className="text-xs font-bold text-slate-600">v{brief.version}</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <time className="font-mono text-xs text-slate-500">
                                                {format(new Date(brief.createdAt), "d MMM yyyy HH:mm", { locale: fr })}
                                            </time>
                                            <Badge
                                                variant={brief.status === "approved" ? "success" : "outline"}
                                                className={brief.status === "rejected" ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-50" : ""}
                                            >
                                                {brief.status === "approved" ? "Validé" :
                                                    brief.status === "rejected" ? "Rejeté" :
                                                        brief.status === "sent" ? "Envoyé" : "Brouillon"}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto border-b pb-2 mb-2">
                                            {brief.content}
                                        </div>
                                        {brief.clientComment && (
                                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                                <strong>Retour client :</strong> {brief.clientComment}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
