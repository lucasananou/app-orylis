"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { ModificationRequestDialog } from "@/components/projects/modification-request-dialog";
import { toast } from "@/components/ui/use-toast";

interface SiteReviewCardProps {
    project: {
        id: string;
        name: string;
        demoUrl: string | null;
    };
}

export function SiteReviewCard({ project }: SiteReviewCardProps) {
    const router = useRouter();
    const [isValidating, setIsValidating] = React.useState(false);

    if (!project.demoUrl) return null;

    const handleValidate = async () => {
        setIsValidating(true);
        try {
            const response = await fetch(`/api/projects/${project.id}/validate-review`, {
                method: "POST",
            });

            if (!response.ok) throw new Error("Erreur lors de la validation");

            toast.success("Site validé ! Félicitations !");
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

                    <Button
                        onClick={handleValidate}
                        disabled={isValidating}
                        variant="outline"
                        className="gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                    >
                        {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Valider le site
                    </Button>

                    <ModificationRequestDialog projectId={project.id} />
                </div>
            </CardContent>
        </Card>
    );
}
