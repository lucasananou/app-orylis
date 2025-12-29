"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Copy } from "lucide-react";
import { toast } from "sonner";

interface OnboardingViewerProps {
    projectId: string;
    onGenerateBrief?: (content: string) => void;
}

export function OnboardingViewer({ projectId, onGenerateBrief }: OnboardingViewerProps) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOnboarding();
    }, [projectId]);

    const fetchOnboarding = async () => {
        try {
            // We need an API route to fetch specific onboarding data for admin
            // For now, let's assume we can fetch it via a new endpoint or existing one
            // Since we don't have a dedicated endpoint for fetching onboarding by project ID for admin yet,
            // we might need to create one or use a server action.
            // Let's create a simple API route for this: /api/projects/[id]/onboarding
            const res = await fetch(`/api/projects/${projectId}/onboarding`);
            if (!res.ok) {
                if (res.status === 404) {
                    setData(null);
                } else {
                    throw new Error("Failed to fetch");
                }
            } else {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error(error);
            // Don't show error toast if it's just missing data (not started yet)
        } finally {
            setIsLoading(false);
        }
    };

    const generateBriefContent = () => {
        if (!data || !data.payload) return "";

        const p = data.payload;
        let content = `## Informations Générales\n`;
        content += `- **Secteur d'activité :** ${p.activity || "Non renseigné"}\n`;
        content += `- **Cible :** ${p.targetAudience || "Non renseigné"}\n`;
        content += `- **Objectifs du site :** ${p.siteGoal || "Non renseigné"}\n\n`;

        content += `## Design & Contenu\n`;
        content += `- **Style souhaité :** ${p.designStyle || "Non renseigné"}\n`;
        content += `- **Couleurs :** ${p.colors || "Non renseigné"}\n`;
        content += `- **Sites inspirants :** ${p.inspiration || "Non renseigné"}\n\n`;

        content += `## Fonctionnalités\n`;
        content += `- **Pages requises :** ${p.pages ? (Array.isArray(p.pages) ? p.pages.join(", ") : p.pages) : "Non renseigné"}\n`;
        content += `- **Fonctionnalités spécifiques :** ${p.features || "Non renseigné"}\n`;

        return content;
    };

    const handleGenerate = () => {
        const content = generateBriefContent();
        if (onGenerateBrief) {
            onGenerateBrief(content);
            toast.success("Contenu généré et copié dans l'éditeur de brief !");
        } else {
            navigator.clipboard.writeText(content);
            toast.success("Contenu copié dans le presse-papier !");
        }
    };

    if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-5 w-5 text-slate-400" /></div>;

    if (!data) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg">Réponses Onboarding Client</CardTitle>
                    <CardDescription>Utilisez ces informations pour rédiger le brief.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Générer le brief
                </Button>
            </CardHeader>
            <CardContent>
                <div className="bg-slate-50 p-4 rounded-md border text-sm font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {generateBriefContent()}
                </div>
            </CardContent>
        </Card>
    );
}
