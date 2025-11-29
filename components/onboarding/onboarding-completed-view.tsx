"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate, type UserRole } from "@/lib/utils";
import { ProjectRequestDialog } from "@/components/projects/project-request-dialog";
import { ProjectFeedbackDialog } from "@/components/projects/project-feedback-dialog";

// We need to duplicate these types or import them if we move them to a shared file.
// For now, I'll redefine them to avoid circular deps if I can't easily move them yet.
// Ideally, these should be in a types file.

const GOAL_OPTIONS = [
    { value: "visibilite", label: "Visibilité & notoriété" },
    { value: "leads", label: "Acquisition de leads" },
    { value: "ecommerce", label: "Ventes en ligne" },
    { value: "autre", label: "Autre objectif principal" }
] as const;

const PAGE_OPTIONS = [
    { value: "home", label: "Accueil" },
    { value: "about", label: "À propos" },
    { value: "services", label: "Services" },
    { value: "pricing", label: "Tarifs" },
    { value: "blog", label: "Blog / Articles" },
    { value: "contact", label: "Contact" },
    { value: "faq", label: "FAQ" },
    { value: "careers", label: "Carrières" },
    { value: "custom", label: "Autres (à préciser)" }
] as const;

type CustomPageEntry = {
    title: string;
    description: string;
};

type UrlEntry = {
    value: string;
};

type OnboardingFormState = {
    fullName: string;
    company: string;
    phone: string;
    website: string;
    goals: string[];
    description: string;
    pages: string[];
    customPages: CustomPageEntry[];
    contentsNote: string;
    inspirations: UrlEntry[];
    competitors: UrlEntry[];
    domainOwned: boolean;
    domainName: string;
    hostingNotes: string;
    confirm: boolean;
};

interface OnboardingCompletedViewProps {
    values: OnboardingFormState;
    projectName: string;
    projectStatus: string;
    normalizedProgress: number;
    lastSavedAt: Date | null;
    projectId: string;
    isStaffRole: boolean;
    role: UserRole;
    onEdit: () => void;
}

export function OnboardingCompletedView({
    values,
    projectName,
    projectStatus,
    normalizedProgress,
    lastSavedAt,
    projectId,
    isStaffRole,
    role,
    onEdit
}: OnboardingCompletedViewProps) {
    const statusLabels: Record<string, string> = {
        onboarding: "Onboarding",
        design: "Design",
        build: "Build",
        review: "Review",
        delivered: "Livré"
    };

    const statusLabel = statusLabels[projectStatus] ?? projectStatus;
    const editLabel = isStaffRole ? "Modifier les réponses" : "Mettre à jour mes réponses";

    const goalLabels = values.goals.map(
        (goal) => GOAL_OPTIONS.find((option) => option.value === goal)?.label ?? goal
    );

    const pageLabels = values.pages.map(
        (page) => PAGE_OPTIONS.find((option) => option.value === page)?.label ?? page
    );

    const customPages = (values.customPages ?? []).filter(
        (page) => page.title.trim().length > 0 || page.description.trim().length > 0
    );

    const inspirations = (values.inspirations ?? [])
        .map((entry) => entry.value.trim())
        .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

    const competitors = (values.competitors ?? [])
        .map((entry) => entry.value.trim())
        .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

    const lastSavedLabel = lastSavedAt
        ? formatDate(lastSavedAt, { dateStyle: "medium", timeStyle: "short" })
        : "à venir";

    return (
        <div className="space-y-6">
            <Card className="border border-border/80 bg-white/90">
                <CardHeader className="flex flex-col gap-4 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <CardTitle className="text-xl font-semibold text-foreground">{projectName}</CardTitle>
                        <CardDescription className="flex items-center gap-3">
                            <Badge variant="secondary" className="capitalize">
                                {statusLabel}
                            </Badge>
                            <span className="text-sm text-muted-foreground">Progression {normalizedProgress}%</span>
                        </CardDescription>
                        <p className="text-xs text-muted-foreground/80">Dernier enregistrement : {lastSavedLabel}</p>
                    </div>
                    <div className="w-full max-w-xs">
                        <Progress value={normalizedProgress} />
                    </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <ProjectRequestDialog projectId={projectId} projectName={projectName} role={role} />
                    <ProjectFeedbackDialog projectId={projectId} projectName={projectName} role={role} />
                    <Button type="button" variant="outline" onClick={onEdit}>
                        {editLabel}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border border-border/70">
                    <CardHeader>
                        <CardTitle>Contact & entreprise</CardTitle>
                        <CardDescription>Identité du référent principal et informations générales.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Nom complet</p>
                            <p className="text-foreground">{values.fullName || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Entreprise</p>
                            <p className="text-foreground">{values.company || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Téléphone</p>
                            <p className="text-foreground">{values.phone || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Site actuel</p>
                            <p className="text-foreground">{values.website || "—"}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/70">
                    <CardHeader>
                        <CardTitle>Objectifs du projet</CardTitle>
                        <CardDescription>Ce que vous attendez de la collaboration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Objectifs</p>
                            {goalLabels.length > 0 ? (
                                <ul className="mt-1 space-y-1">
                                    {goalLabels.map((goal) => (
                                        <li key={goal} className="text-foreground">
                                            {goal}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-foreground">—</p>
                            )}
                        </div>
                        {values.description && (
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Notes</p>
                                <p className="text-foreground">{values.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-border/70 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Structure & contenus</CardTitle>
                        <CardDescription>Pages prévues et notes complémentaires.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 lg:grid-cols-2 text-sm text-muted-foreground">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Pages principales</p>
                            {pageLabels.length > 0 ? (
                                <ul className="mt-1 space-y-1">
                                    {pageLabels.map((page) => (
                                        <li key={page} className="text-foreground">
                                            {page}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-foreground">—</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Pages personnalisées</p>
                            {customPages.length > 0 ? (
                                <ul className="mt-1 space-y-2">
                                    {customPages.map((page, index) => (
                                        <li key={`${page.title}-${index}`} className="space-y-1 text-foreground">
                                            <p className="font-medium">{page.title || `Page ${index + 1}`}</p>
                                            {page.description ? (
                                                <p className="text-sm text-muted-foreground">{page.description}</p>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-foreground">—</p>
                            )}
                        </div>
                        {values.contentsNote && (
                            <div className="lg:col-span-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                    Notes complémentaires
                                </p>
                                <p className="text-foreground">{values.contentsNote}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-border/70">
                    <CardHeader>
                        <CardTitle>Inspirations</CardTitle>
                        <CardDescription>Références esthétiques ou concurrentielles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Sources</p>
                            {inspirations.length > 0 ? (
                                <ul className="mt-1 space-y-1">
                                    {inspirations.map((item) => (
                                        <li key={item} className="text-foreground">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-foreground">—</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Concurrents</p>
                            {competitors.length > 0 ? (
                                <ul className="mt-1 space-y-1">
                                    {competitors.map((item) => (
                                        <li key={item} className="text-foreground">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-foreground">—</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/70">
                    <CardHeader>
                        <CardTitle>Aspects techniques</CardTitle>
                        <CardDescription>Domaine, hébergement et notes spécifiques.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Nom de domaine</p>
                            <p className="text-foreground">
                                {values.domainOwned
                                    ? values.domainName
                                        ? `Oui · ${values.domainName}`
                                        : "Oui"
                                    : "À prévoir"}
                            </p>
                        </div>
                        {values.hostingNotes && (
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Notes</p>
                                <p className="text-foreground">{values.hostingNotes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
