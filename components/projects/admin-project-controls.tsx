"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ExternalLink, Loader2, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Cast Dialog components to any to avoid React version mismatch issues
const DialogComp = Dialog as any;
const DialogTriggerComp = DialogTrigger as any;
const DialogContentComp = DialogContent as any;
const DialogTitleComp = DialogTitle as any;
const DialogDescriptionComp = DialogDescription as any;

type ProjectStatus = "onboarding" | "demo_in_progress" | "design" | "build" | "review" | "delivered";

interface AdminProjectControlsProps {
    project: {
        id: string;
        name: string;
        status: string;
        demoUrl: string | null;
    };
    latestBrief?: {
        id: string;
        version: number;
        status: string;
        content: string;
        clientComment: string | null;
    };
}

const STATUS_STEPS: { value: ProjectStatus; label: string }[] = [
    { value: "onboarding", label: "Onboarding" },
    { value: "design", label: "Design" },
    { value: "build", label: "Build" },
    { value: "review", label: "Review" },
    { value: "delivered", label: "Livré" }
];

export function AdminProjectControls({ project, latestBrief }: AdminProjectControlsProps) {
    const router = useRouter();
    const [isUpdating, startTransition] = React.useTransition();
    const [demoUrl, setDemoUrl] = React.useState(project.demoUrl ?? "");
    const [isReviewDialogOpen, setIsReviewDialogOpen] = React.useState(false);

    const currentStatusIndex = STATUS_STEPS.findIndex((s) => s.value === project.status);

    const handleStatusChange = (newStatus: ProjectStatus, newDemoUrl?: string) => {
        startTransition(() => {
            (async () => {
                try {
                    const payload: any = { status: newStatus };
                    if (newDemoUrl !== undefined) {
                        payload.demoUrl = newDemoUrl;
                    }

                    const response = await fetch(`/api/projects/${project.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) throw new Error("Erreur lors de la mise à jour");

                    // Notifications triggers
                    if (newStatus === "review") {
                        await fetch(`/api/projects/${project.id}/review-notify`, { method: "POST" });
                        toast.success("Projet envoyé en review. Client notifié !");
                    } else if (newStatus === "delivered") {
                        // Could add delivery notification here
                        toast.success("Projet marqué comme livré !");
                    } else {
                        toast.success("Statut mis à jour.");
                    }

                    setIsReviewDialogOpen(false);
                    router.refresh();
                } catch (error) {
                    toast.error("Impossible de mettre à jour le statut.");
                }
            })();
        });
    };

    const hasModificationRequest = latestBrief?.status === "sent" && project.status === "build";

    return (
        <Card className="border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/10 mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg text-blue-950 dark:text-blue-100">
                            Cockpit Admin
                        </CardTitle>
                        <CardDescription className="text-blue-800/80 dark:text-blue-200/70">
                            Gérez le flux de production du projet.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {project.demoUrl && (
                            <Button variant="outline" size="sm" asChild className="h-8 bg-background">
                                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                    Voir la démo
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Stepper */}
                <div className="relative mb-8 mt-2">
                    <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-blue-200 dark:bg-blue-900" />
                    <div className="relative flex justify-between">
                        {STATUS_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = step.value === project.status;

                            return (
                                <div key={step.value} className="flex flex-col items-center gap-2 bg-transparent">
                                    <div
                                        className={cn(
                                            "z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                                            isCompleted
                                                ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                                                : "border-blue-200 bg-background text-muted-foreground dark:border-blue-800"
                                        )}
                                    >
                                        {index < currentStatusIndex ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <span className="text-xs font-medium">{index + 1}</span>
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            "absolute top-10 text-xs font-medium whitespace-nowrap",
                                            isCurrent ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground"
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Modification Request Alert */}
                {hasModificationRequest && (
                    <div className="mb-6 rounded-md bg-orange-50 p-4 border border-orange-200 text-orange-800">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 mt-0.5 text-orange-600" />
                            <div>
                                <h4 className="font-semibold">Modifications demandées (v{latestBrief?.version})</h4>
                                <p className="text-sm mt-1 mb-2">{latestBrief?.content}</p>
                                <p className="text-xs text-orange-600/80">
                                    Implémentez les changements puis renvoyez en review.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions Contextuelles */}
                <div className="flex items-center justify-end gap-3 border-t border-blue-200/50 pt-4 dark:border-blue-800/50">
                    {project.status === "onboarding" && (
                        <Button
                            onClick={() => handleStatusChange("design")}
                            disabled={isUpdating}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Valider le brief & Commencer le Design
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}

                    {(project.status === "design" || project.status === "build") && (
                        <DialogComp open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                            <DialogTriggerComp asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Send className="mr-2 h-4 w-4" />
                                    {hasModificationRequest ? "Renvoyer en Review (V2+)" : "Envoyer en Review Client"}
                                </Button>
                            </DialogTriggerComp>
                            <DialogContentComp>
                                <DialogHeader>
                                    <DialogTitleComp>Envoyer pour validation</DialogTitleComp>
                                    <DialogDescriptionComp>
                                        Le client recevra un email l'invitant à consulter le site.
                                    </DialogDescriptionComp>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="demo-url">URL de démonstration</Label>
                                        <Input
                                            id="demo-url"
                                            placeholder="https://..."
                                            value={demoUrl}
                                            onChange={(e) => setDemoUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="font-medium">Ce qui va se passer :</span>
                                        </div>
                                        <ul className="list-disc list-inside pl-1 space-y-1">
                                            <li>Le statut passera à <strong>Review</strong>.</li>
                                            <li>Le client recevra une notification par email.</li>
                                            <li>Il pourra valider ou demander des modifications.</li>
                                        </ul>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Annuler</Button>
                                    <Button
                                        onClick={() => handleStatusChange("review", demoUrl)}
                                        disabled={isUpdating || !demoUrl}
                                    >
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Envoyer
                                    </Button>
                                </DialogFooter>
                            </DialogContentComp>
                        </DialogComp>
                    )}

                    {project.status === "review" && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground mr-2">
                                En attente du retour client...
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange("build")}
                                disabled={isUpdating}
                            >
                                Repasser en Build (Modifs)
                            </Button>
                            <Button
                                onClick={() => handleStatusChange("delivered")}
                                disabled={isUpdating}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Valider la Livraison Finale
                                <Check className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {project.status === "delivered" && (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <Check className="h-5 w-5" />
                            Projet Livré
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
