"use client";

import { CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Milestone {
    id: string;
    label: string;
    status: "completed" | "in_progress" | "pending";
}

const MILESTONES: Milestone[] = [
    { id: "setup", label: "Configuration Serveur & Environnement", status: "completed" },
    { id: "integration", label: "Intégration des Maquettes", status: "in_progress" },
    { id: "features", label: "Développement des Fonctionnalités", status: "pending" },
    { id: "mobile", label: "Optimisation Mobile & Tablette", status: "pending" },
    { id: "seo", label: "Optimisation SEO & Performance", status: "pending" },
    { id: "qa", label: "Tests Qualité & Recette Interne", status: "pending" },
];

export function ProjectMilestones() {
    // In a real app, we would fetch the actual progress from the backend.
    // For now, we simulate a "Build" phase progress.

    return (
        <Card className="border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/5">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    <CardTitle className="text-lg text-blue-950 dark:text-blue-100">
                        Construction en cours
                    </CardTitle>
                </div>
                <CardDescription className="text-blue-800/80 dark:text-blue-200/70">
                    Votre site est entre de bonnes mains. Voici l'avancement actuel de la production.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {MILESTONES.map((milestone, index) => {
                        const isCompleted = milestone.status === "completed";
                        const isInProgress = milestone.status === "in_progress";
                        const isPending = milestone.status === "pending";

                        return (
                            <div key={milestone.id} className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                    {isInProgress && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                                    {isPending && <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />}
                                </div>
                                <div className={cn("flex-1", isPending && "opacity-50")}>
                                    <p className={cn("text-sm font-medium",
                                        isCompleted && "text-green-800 dark:text-green-300",
                                        isInProgress && "text-blue-700 dark:text-blue-300",
                                        isPending && "text-slate-600 dark:text-slate-400"
                                    )}>
                                        {milestone.label}
                                    </p>
                                    {isInProgress && (
                                        <p className="text-xs text-blue-600/80 mt-0.5">
                                            En cours de traitement...
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
