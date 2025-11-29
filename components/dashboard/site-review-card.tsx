"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { ModificationRequestDialog } from "@/components/projects/modification-request-dialog";
import { toast } from "@/components/ui/use-toast";

interface SiteReviewCardProps {
    project: {
        id: string;
        name: string;
        demoUrl: string | null;
    };
}

// Cast Dialog components to any to avoid React version mismatch issues
const DialogComp = Dialog as any;
const DialogTriggerComp = DialogTrigger as any;
const DialogContentComp = DialogContent as any;
const DialogTitleComp = DialogTitle as any;
const DialogDescriptionComp = DialogDescription as any;
const DialogFooterComp = DialogFooter as any;
const DialogHeaderComp = DialogHeader as any;

export function SiteReviewCard({ project }: SiteReviewCardProps) {
    const router = useRouter();
    const [isValidating, setIsValidating] = React.useState(false);
    const [isValidationOpen, setIsValidationOpen] = React.useState(false);

    if (!project.demoUrl) return null;

    const handleValidate = async () => {
        setIsValidating(true);
        try {
            const response = await fetch(`/api/projects/${project.id}/validate-review`, {
                method: "POST",
            });

            if (!response.ok) throw new Error("Erreur lors de la validation");

            toast.success("Site validé ! Félicitations !");
            setIsValidationOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Impossible de valider le site.");
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <CheckCircle className="h-5 w-5" />
                    Votre site est prêt pour validation !
                </CardTitle>
                <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                    Le développement de votre site <strong>{project.name}</strong> est terminé.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Nous vous invitons à consulter votre site et à vérifier qu'il correspond à vos attentes.
                    Une fois validé, nous procéderons à la mise en ligne définitive.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="gap-2" variant="default">
                        <Link href={project.demoUrl as any} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Voir mon site
                        </Link>
                    </Button>

                    <DialogComp open={isValidationOpen} onOpenChange={setIsValidationOpen}>
                        <DialogTriggerComp asChild>
                            <Button
                                variant="outline"
                                className="gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Valider le site
                            </Button>
                        </DialogTriggerComp>
                        <DialogContentComp>
                            <DialogHeaderComp>
                                <DialogTitleComp>Confirmer la validation</DialogTitleComp>
                                <DialogDescriptionComp>
                                    Vous êtes sur le point de valider votre site. Cela déclenchera la mise en ligne définitive.
                                </DialogDescriptionComp>
                            </DialogHeaderComp>
                            <div className="py-4 space-y-4">
                                <div className="rounded-md bg-green-50 p-3 border border-green-100">
                                    <p className="text-sm font-medium text-green-800 mb-2">Checklist de validation :</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2">
                                            <input type="checkbox" id="check-pages" className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                            <label htmlFor="check-pages" className="text-sm text-green-700">J'ai vérifié toutes les pages</label>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <input type="checkbox" id="check-forms" className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                            <label htmlFor="check-forms" className="text-sm text-green-700">Les formulaires fonctionnent</label>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <input type="checkbox" id="check-legal" className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                            <label htmlFor="check-legal" className="text-sm text-green-700">Les mentions légales sont correctes</label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <DialogFooterComp>
                                <Button variant="outline" onClick={() => setIsValidationOpen(false)} disabled={isValidating}>
                                    Annuler
                                </Button>
                                <Button onClick={handleValidate} disabled={isValidating} className="bg-green-600 hover:bg-green-700 text-white">
                                    {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmer la validation
                                </Button>
                            </DialogFooterComp>
                        </DialogContentComp>
                    </DialogComp>

                    <ModificationRequestDialog projectId={project.id} />
                </div>
            </CardContent>
        </Card>
    );
}
