"use client";

import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ClipboardList } from "lucide-react";
import {
    OnboardingFinalSchema,
    OnboardingStep1Schema,
    OnboardingStep2Schema,
    OnboardingStep3Schema,
    OnboardingStep4Schema,
    OnboardingStep5Schema,
    type OnboardingPayload
} from "@/lib/zod-schemas";
import { useProjectSelection } from "@/lib/project-selection";
import { cn, formatProgress, isStaff, type UserRole } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { OnboardingCompletedView } from "./onboarding-completed-view";

const AUTOSAVE_DEBOUNCE_MS = 600;

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

type CustomPageEntry = {
    title: string;
    description: string;
};

type OnboardingDraftPayload = Partial<OnboardingPayload>;

interface OnboardingProjectEntry {
    id: string;
    name: string;
    status: string;
    progress: number;
    payload: Record<string, unknown> | null;
    completed: boolean;
    updatedAt: string | null;
}

interface OnboardingWizardProps {
    projects: OnboardingProjectEntry[];
    role: UserRole;
}

const stepDefinitions = [
    {
        id: "welcome",
        label: "Bienvenue",
        description: "Commençons par le début.",
        schema: z.object({}), // No validation needed for welcome screen
        fields: []
    },
    {
        id: "identity",
        label: "Identité",
        description: "Contact principal et informations générales.",
        schema: OnboardingStep1Schema,
        fields: ["fullName", "company", "phone", "website"]
    },
    {
        id: "objectives",
        label: "Objectifs",
        description: "Vision stratégique et attentes prioritaires.",
        schema: OnboardingStep2Schema,
        fields: ["goals", "description"]
    },
    {
        id: "pages",
        label: "Structure",
        description: "Pages clés et contenu attendu.",
        schema: OnboardingStep3Schema,
        fields: ["pages", "customPages", "contentsNote"]
    },
    {
        id: "inspirations",
        label: "Inspirations",
        description: "Références esthétiques ou concurrentielles.",
        schema: OnboardingStep4Schema,
        fields: ["inspirations", "competitors"]
    },
    {
        id: "technical",
        label: "Technique",
        description: "Domaine, hébergement et aspects techniques.",
        schema: OnboardingStep5Schema,
        fields: ["domainOwned", "domainName", "hostingNotes"]
    },
    {
        id: "review",
        label: "Validation",
        description: "Vérification finale avant envoi.",
        schema: OnboardingFinalSchema,
        fields: ["confirm"]
    }
] as const;

const ensureString = (value: unknown, fallback = ""): string =>
    typeof value === "string" ? value : fallback;

const ensureBoolean = (value: unknown, fallback = false): boolean =>
    typeof value === "boolean" ? value : fallback;

const ensureStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const toUrlEntries = (values: string[], fallbackLength = 1): UrlEntry[] => {
    if (values.length === 0) {
        return Array.from({ length: fallbackLength }, () => ({ value: "" }));
    }
    return values.map((value) => ({ value }));
};

const buildDefaultValues = (
    initialValues: Record<string, unknown> | null,
    completed: boolean
): OnboardingFormState => {
    const payload = initialValues ?? {};
    const inspirations = ensureStringArray(payload.inspirations);
    const competitors = ensureStringArray(payload.competitors);
    const customPages = Array.isArray(payload.customPages)
        ? payload.customPages
            .filter(
                (entry): entry is { title?: unknown; description?: unknown } =>
                    typeof entry === "object" && entry !== null
            )
            .map((entry) => ({
                title: ensureString(entry.title),
                description: ensureString(entry.description)
            }))
        : [];

    return {
        fullName: ensureString(payload.fullName),
        company: ensureString(payload.company),
        phone: ensureString(payload.phone),
        website: ensureString(payload.website),
        goals: ensureStringArray(payload.goals),
        description: ensureString(payload.description),
        pages: ensureStringArray(payload.pages),
        customPages,
        contentsNote: ensureString(payload.contentsNote),
        inspirations: toUrlEntries(inspirations, 1),
        competitors: toUrlEntries(competitors, 0),
        domainOwned: ensureBoolean(payload.domainOwned),
        domainName: ensureString(payload.domainName),
        hostingNotes: ensureString(payload.hostingNotes),
        confirm: completed
    };
};

const normalizeDraftPayload = (values: OnboardingFormState): OnboardingDraftPayload => {
    const trimmed = (input: string) => input.trim();

    const normalizeUrls = (entries: UrlEntry[]) =>
        entries
            .map((entry) => trimmed(entry.value))
            .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

    const customPages = (values.customPages ?? [])
        .map((page) => ({
            title: trimmed(page.title),
            description: trimmed(page.description)
        }))
        .filter((page) => page.title.length > 0);

    const draft: OnboardingDraftPayload = {};

    if (values.goals.length > 0) draft.goals = [...values.goals];
    if (values.pages.length > 0) draft.pages = [...values.pages];
    if (values.domainOwned !== undefined) draft.domainOwned = values.domainOwned;
    if (customPages.length > 0) draft.customPages = customPages;
    if (values.fullName.trim().length > 0) draft.fullName = trimmed(values.fullName);
    if (values.company.trim().length > 0) draft.company = trimmed(values.company);
    if (values.phone.trim().length > 0) draft.phone = trimmed(values.phone);
    if (values.website.trim().length > 0) draft.website = trimmed(values.website);
    if (values.description.trim().length > 0) draft.description = trimmed(values.description);
    if (values.contentsNote.trim().length > 0) draft.contentsNote = trimmed(values.contentsNote);

    const inspirations = normalizeUrls(values.inspirations);
    if (inspirations.length > 0) draft.inspirations = inspirations;

    const competitors = normalizeUrls(values.competitors);
    if (competitors.length > 0) draft.competitors = competitors;

    if (values.domainOwned && values.domainName.trim().length > 0) {
        draft.domainName = trimmed(values.domainName);
    }

    if (values.hostingNotes.trim().length > 0) {
        draft.hostingNotes = trimmed(values.hostingNotes);
    }

    return draft;
};

const normalizeFinalPayload = (values: OnboardingFormState) => {
    const draft = normalizeDraftPayload(values);
    return {
        goals: draft.goals ?? [],
        pages: draft.pages ?? [],
        domainOwned: draft.domainOwned ?? false,
        customPages: draft.customPages ?? [],
        inspirations: draft.inspirations ?? [],
        ...draft,
        confirm: values.confirm
    };
};

export function OnboardingWizard({ projects, role }: OnboardingWizardProps) {
    const router = useRouter();
    const isStaffRole = isStaff(role);
    const { projectId: selectedProjectId, setProjectId: setGlobalProjectId, ready } = useProjectSelection();

    const fallbackProjectId = useMemo(() => projects[0]?.id ?? null, [projects]);

    useEffect(() => {
        if (!ready || !fallbackProjectId || isStaffRole) return;
        if (!selectedProjectId) setGlobalProjectId(fallbackProjectId);
    }, [fallbackProjectId, isStaffRole, ready, selectedProjectId, setGlobalProjectId]);

    const activeProject =
        projects.find((project) => project.id === (selectedProjectId ?? fallbackProjectId)) ??
        projects[0];

    const projectId = activeProject?.id ?? "";
    const projectName = activeProject?.name ?? "Projet";
    const projectStatus = activeProject?.status ?? "onboarding";
    const projectProgress = activeProject?.progress ?? 0;
    const normalizedProgress = formatProgress(projectProgress);
    const initialValues = activeProject?.payload ?? null;
    const completed = activeProject?.completed ?? false;
    const lastUpdatedAt = activeProject?.updatedAt ?? null;

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(completed);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [savingError, setSavingError] = useState<string | null>(null);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
        lastUpdatedAt ? new Date(lastUpdatedAt) : null
    );
    const [isHydrated, setIsHydrated] = useState(false);
    const [showEditor, setShowEditor] = useState(!completed);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { setIsHydrated(true); }, []);

    const defaultValues = useMemo(
        () => buildDefaultValues(initialValues, completed),
        [initialValues, completed]
    );

    const form = useForm<OnboardingFormState>({
        defaultValues,
        mode: "onChange",
        shouldUnregister: false
    });

    const { control } = form;

    const inspirationsArray = useFieldArray({ control, name: "inspirations" });
    const competitorsArray = useFieldArray({ control, name: "competitors" });
    const customPagesArray = useFieldArray({ control, name: "customPages" });

    const watchedValues = useWatch<OnboardingFormState>({ control });

    const summaryValues = useMemo<OnboardingFormState>(() => {
        const values = watchedValues ?? defaultValues;
        return {
            ...defaultValues,
            ...values,
            goals: Array.isArray(values.goals) ? [...values.goals] : [],
            pages: Array.isArray(values.pages) ? [...values.pages] : [],
            customPages: (values.customPages ?? []).map((page) => ({
                title: page.title ?? "",
                description: page.description ?? ""
            })),
            inspirations: (values.inspirations ?? []).map((entry) => ({ value: entry.value ?? "" })),
            competitors: (values.competitors ?? []).map((entry) => ({ value: entry.value ?? "" }))
        };
    }, [watchedValues, defaultValues]);

    const draftSignatureRef = useRef<string>(JSON.stringify(normalizeDraftPayload(defaultValues)));
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const skipNextAutoSaveRef = useRef(true);
    const isMountedRef = useRef(false);

    useEffect(() => {
        form.reset(defaultValues, { keepErrors: false, keepDirtyValues: false });
        draftSignatureRef.current = JSON.stringify(normalizeDraftPayload(defaultValues));
        skipNextAutoSaveRef.current = true;
        setCurrentStepIndex(0);
        setSavingError(null);
        setIsCompleted(completed);
        setLastSavedAt(lastUpdatedAt ? new Date(lastUpdatedAt) : null);
        setShowEditor(!completed);
    }, [projectId, defaultValues, form, completed, lastUpdatedAt]);

    useEffect(() => {
        if (!isMountedRef.current) {
            isMountedRef.current = true;
            return;
        }
        if (isCompleted && !isStaffRole) return;

        const payload = normalizeDraftPayload(watchedValues as OnboardingFormState);
        const signature = JSON.stringify(payload);
        const hasChanged = signature !== draftSignatureRef.current;

        if (skipNextAutoSaveRef.current && !hasChanged) {
            skipNextAutoSaveRef.current = false;
            return;
        }
        if (skipNextAutoSaveRef.current) skipNextAutoSaveRef.current = false;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            const currentPayload = normalizeDraftPayload(watchedValues as OnboardingFormState);
            const currentSignature = JSON.stringify(currentPayload);
            if (currentSignature === draftSignatureRef.current) return;

            try {
                setIsSavingDraft(true);
                setSavingError(null);
                const response = await fetch("/api/onboarding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectId, payload: currentPayload })
                });

                if (!response.ok) throw new Error("Impossible d'enregistrer le brouillon.");

                draftSignatureRef.current = currentSignature;
                setLastSavedAt(new Date());
            } catch (error) {
                setSavingError(error instanceof Error ? error.message : "Erreur lors de l'autosauvegarde.");
            } finally {
                setIsSavingDraft(false);
            }
        }, AUTOSAVE_DEBOUNCE_MS);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [watchedValues, projectId, isCompleted, isStaffRole]);

    if (!showEditor) {
        return (
            <OnboardingCompletedView
                values={summaryValues}
                projectName={projectName}
                projectStatus={projectStatus}
                normalizedProgress={normalizedProgress}
                lastSavedAt={lastSavedAt}
                projectId={projectId}
                isStaffRole={isStaffRole}
                role={role}
                onEdit={() => setShowEditor(true)}
            />
        );
    }

    const setSchemaErrors = (result: z.SafeParseReturnType<unknown, unknown>) => {
        if (result.success) return;
        const fieldErrors = result.error.flatten().fieldErrors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
            const items = Array.isArray(messages) ? messages : [];
            if (items.length === 0) return;
            form.setError(field as keyof OnboardingFormState, { type: "manual", message: items[0] });
        });
    };

    const validateStep = (index: number) => {
        const definition = stepDefinitions[index];
        if (definition.id === "welcome") return true;

        const payload = definition.id === "review"
            ? normalizeFinalPayload(form.getValues())
            : normalizeDraftPayload(form.getValues());

        const result = definition.schema.safeParse(payload);
        if (!result.success) {
            setSchemaErrors(result);
            toast.error("Merci de compléter les informations requises avant de continuer.");
            return false;
        }

        definition.fields.forEach((field) => form.clearErrors(field as keyof OnboardingFormState));
        return true;
    };

    const handleNextStep = () => {
        if (!validateStep(currentStepIndex)) return;
        setCurrentStepIndex((prev) => Math.min(prev + 1, stepDefinitions.length - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePreviousStep = () => {
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = () => {
        const lastIndex = stepDefinitions.length - 1;
        if (!validateStep(lastIndex)) return;

        const finalPayload = normalizeFinalPayload(form.getValues());

        setIsSubmitting(true);
        (async () => {
            try {
                const response = await fetch("/api/onboarding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        projectId,
                        payload: finalPayload,
                        completed: true,
                        confirm: true
                    })
                });

                if (!response.ok) throw new Error("Impossible de finaliser l’onboarding.");

                draftSignatureRef.current = JSON.stringify(normalizeDraftPayload(form.getValues()));
                setIsCompleted(true);
                setLastSavedAt(new Date());
                const successMessage = isStaffRole
                    ? "Onboarding validé. L'équipe démarre la phase design."
                    : "Onboarding complété ! L'équipe va démarrer la création de votre site.";
                toast.success(successMessage);
                setShowEditor(false);
                router.replace("/" as Route);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
            } finally {
                setIsSubmitting(false);
            }
        })();
    };

    const currentStep = stepDefinitions[currentStepIndex];
    const progressPercentage = ((currentStepIndex) / (stepDefinitions.length - 1)) * 100;

    return (
        <div className="flex min-h-[calc(100vh-200px)] flex-col">
            {/* Progress Bar */}
            <div className="fixed left-0 top-0 z-50 h-1 w-full bg-slate-100">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            <div className="mx-auto w-full max-w-2xl flex-1 py-8">
                <Form form={form} onSubmit={(event) => event.preventDefault()}>
                    <div className="space-y-8">

                        {/* Header */}
                        <div className="text-center space-y-2 mb-8">
                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Étape {currentStepIndex + 1} sur {stepDefinitions.length}
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                {currentStep.label}
                            </h2>
                            <p className="text-lg text-slate-500 max-w-lg mx-auto">
                                {currentStep.description}
                            </p>
                        </div>

                        {/* Steps Content */}
                        <div className="min-h-[400px]">
                            {currentStep.id === "welcome" && (
                                <div className="text-center space-y-6 py-8">
                                    <div className="mx-auto h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center">
                                        <ClipboardList className="h-12 w-12 text-blue-600" />
                                    </div>
                                    <div className="space-y-4 max-w-lg mx-auto">
                                        <p className="text-lg text-slate-700 leading-relaxed">
                                            Bienvenue dans l'assistant de démarrage de votre projet <strong>{projectName}</strong>.
                                        </p>
                                        <p className="text-slate-600">
                                            Nous allons définir ensemble l'identité, les objectifs et la structure de votre futur site.
                                            Cela ne prendra que quelques minutes.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep.id === "identity" && (
                                <div className="grid gap-6">
                                    <FormField
                                        control={control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg">Quel est votre nom complet ?</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-lg" placeholder="Prénom Nom" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="company"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg">Nom de votre entreprise</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-lg" placeholder="Orylis" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg">Numéro de téléphone</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-lg" placeholder="+33 6 00 00 00 00" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="website"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg" optional>Site web actuel (si existant)</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-lg" placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {currentStep.id === "objectives" && (
                                <div className="space-y-8">
                                    <FormField
                                        control={control}
                                        name="goals"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg mb-4 block">Quels sont vos objectifs principaux ?</FormLabel>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    {GOAL_OPTIONS.map((option) => (
                                                        <label
                                                            key={option.value}
                                                            className={cn(
                                                                "flex cursor-pointer items-center gap-4 rounded-xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50",
                                                                field.value.includes(option.value) && "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                value={option.value}
                                                                checked={field.value.includes(option.value)}
                                                                onChange={(event) => {
                                                                    if (event.target.checked) {
                                                                        field.onChange([...field.value, option.value]);
                                                                    } else {
                                                                        field.onChange(field.value.filter((value) => value !== option.value));
                                                                    }
                                                                }}
                                                            />
                                                            <span className="font-medium text-slate-900">{option.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg" optional>Dites-nous en plus sur votre vision</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Décrivez votre activité, votre cible, vos attentes..."
                                                        className="min-h-[160px] text-lg resize-none p-4"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {currentStep.id === "pages" && (
                                <div className="space-y-8">
                                    <FormField
                                        control={control}
                                        name="pages"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg mb-4 block">Quelles pages souhaitez-vous ?</FormLabel>
                                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                                    {PAGE_OPTIONS.map((option) => (
                                                        <label
                                                            key={option.value}
                                                            className={cn(
                                                                "flex cursor-pointer items-center justify-center text-center rounded-xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50",
                                                                field.value.includes(option.value) && "border-blue-500 bg-blue-50 font-medium text-blue-700"
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only"
                                                                value={option.value}
                                                                checked={field.value.includes(option.value)}
                                                                onChange={(event) => {
                                                                    if (event.target.checked) {
                                                                        field.onChange([...field.value, option.value]);
                                                                    } else {
                                                                        field.onChange(field.value.filter((value) => value !== option.value));
                                                                    }
                                                                }}
                                                            />
                                                            <span>{option.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-lg">Pages sur mesure</FormLabel>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => customPagesArray.append({ title: "", description: "" })}
                                            >
                                                + Ajouter une page
                                            </Button>
                                        </div>
                                        {customPagesArray.fields.map((field, index) => (
                                            <div key={field.id} className="grid gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <FormField
                                                    control={control}
                                                    name={`customPages.${index}.title`}
                                                    render={({ field }) => (
                                                        <Input placeholder="Titre de la page" {...field} />
                                                    )}
                                                />
                                                <FormField
                                                    control={control}
                                                    name={`customPages.${index}.description`}
                                                    render={({ field }) => (
                                                        <Textarea placeholder="Description du contenu..." className="min-h-[80px]" {...field} />
                                                    )}
                                                />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => customPagesArray.remove(index)} className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
                                                    Supprimer
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep.id === "inspirations" && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <FormLabel className="text-lg block">Sites qui vous inspirent</FormLabel>
                                        {inspirationsArray.fields.map((field, index) => (
                                            <FormField
                                                key={field.id}
                                                control={control}
                                                name={`inspirations.${index}.value`}
                                                render={({ field }) => (
                                                    <div className="flex gap-2">
                                                        <Input placeholder="https://..." className="h-12" {...field} />
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => inspirationsArray.remove(index)}>
                                                            &times;
                                                        </Button>
                                                    </div>
                                                )}
                                            />
                                        ))}
                                        <Button type="button" variant="outline" onClick={() => inspirationsArray.append({ value: "" })}>
                                            + Ajouter un lien
                                        </Button>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-slate-100">
                                        <FormLabel className="text-lg block">Vos concurrents</FormLabel>
                                        {competitorsArray.fields.map((field, index) => (
                                            <FormField
                                                key={field.id}
                                                control={control}
                                                name={`competitors.${index}.value`}
                                                render={({ field }) => (
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Nom ou lien du concurrent" className="h-12" {...field} />
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => competitorsArray.remove(index)}>
                                                            &times;
                                                        </Button>
                                                    </div>
                                                )}
                                            />
                                        ))}
                                        <Button type="button" variant="outline" onClick={() => competitorsArray.append({ value: "" })}>
                                            + Ajouter un concurrent
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {currentStep.id === "technical" && (
                                <div className="space-y-8">
                                    <FormField
                                        control={control}
                                        name="domainOwned"
                                        render={({ field }) => (
                                            <FormItem className="space-y-4">
                                                <FormLabel className="text-lg">Avez-vous déjà un nom de domaine ?</FormLabel>
                                                <div className="flex gap-4">
                                                    <label className={cn(
                                                        "flex-1 cursor-pointer rounded-xl border-2 border-slate-100 bg-white p-4 text-center transition-all hover:border-blue-200",
                                                        field.value === true && "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            className="sr-only"
                                                            checked={field.value === true}
                                                            onChange={() => field.onChange(true)}
                                                        />
                                                        <span className="font-medium">Oui, je l'ai</span>
                                                    </label>
                                                    <label className={cn(
                                                        "flex-1 cursor-pointer rounded-xl border-2 border-slate-100 bg-white p-4 text-center transition-all hover:border-blue-200",
                                                        field.value === false && "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            className="sr-only"
                                                            checked={field.value === false}
                                                            onChange={() => field.onChange(false)}
                                                        />
                                                        <span className="font-medium">Non, pas encore</span>
                                                    </label>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch("domainOwned") && (
                                        <FormField
                                            control={control}
                                            name="domainName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg">Quel est ce nom de domaine ?</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 text-lg" placeholder="exemple.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <FormField
                                        control={control}
                                        name="hostingNotes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg" optional>Notes techniques (hébergement, accès...)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Avez-vous déjà un hébergeur ? Des contraintes particulières ?"
                                                        className="min-h-[120px] p-4"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {currentStep.id === "review" && (
                                <div className="space-y-8 text-center">
                                    <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Tout est prêt !</h3>
                                    <p className="text-slate-600 max-w-md mx-auto">
                                        Merci d'avoir complété ces informations. Une fois validé, notre équipe recevra votre dossier et pourra démarrer la phase de design.
                                    </p>

                                    <FormField
                                        control={control}
                                        name="confirm"
                                        render={({ field }) => (
                                            <FormItem className="flex justify-center">
                                                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 transition hover:bg-slate-100">
                                                    <input
                                                        type="checkbox"
                                                        className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                                        checked={field.value}
                                                        onChange={(e) => field.onChange(e.target.checked)}
                                                    />
                                                    <span className="font-medium text-slate-700">Je valide ces informations</span>
                                                </label>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="ghost"
                                size="lg"
                                onClick={handlePreviousStep}
                                disabled={currentStepIndex === 0 || isSubmitting}
                                className="text-slate-500 hover:text-slate-900"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Retour
                            </Button>

                            <div className="flex items-center gap-4">
                                {isSavingDraft && (
                                    <span className="text-xs text-muted-foreground animate-pulse">
                                        Sauvegarde...
                                    </span>
                                )}

                                {currentStepIndex < stepDefinitions.length - 1 ? (
                                    <Button
                                        type="button"
                                        size="lg"
                                        onClick={handleNextStep}
                                        disabled={isSubmitting}
                                        className="min-w-[140px] text-lg h-12 rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
                                    >
                                        Continuer
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="lg"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !form.watch("confirm")}
                                        className="min-w-[140px] text-lg h-12 rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                        )}
                                        Valider
                                    </Button>
                                )}
                            </div>
                        </div>

                    </div>
                </Form>
            </div>
        </div>
    );
}
