"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

interface SiteReviewCardProps {
    project: {
        name: string;
        demoUrl: string | null;
    };
}

export function SiteReviewCard({ project }: SiteReviewCardProps) {
    if (!project.demoUrl) return null;

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
                        <Link href={project.demoUrl as string} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Voir mon site
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href={"/tickets/new?category=validation" as any}>
                            <CheckCircle className="h-4 w-4" />
                            Valider le site
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="gap-2">
                        <Link href={"/tickets/new?category=modification" as any}>
                            <MessageSquare className="h-4 w-4" />
                            Demander des modifications
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
