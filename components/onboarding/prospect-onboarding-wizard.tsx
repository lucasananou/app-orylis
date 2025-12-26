"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type FieldArrayPath } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Upload, X, ClipboardList } from "lucide-react";
import {
    ProspectOnboardingDraftSchema,
    ProspectOnboardingFinalSchema,
    ProspectContactSchema,
    ProspectGoalSchema,
    ProspectInspirationSchema,
    ProspectStyleSchema,
    ProspectIdentitySchema,
    ProspectBrandingSchema,
    ProspectMessageSchema,
    ProspectInfoSchema,
    type ProspectOnboardingDraftPayload,
    type ProspectOnboardingPayload
} from "@/lib/zod-schemas";
import { useProjectSelection } from "@/lib/project-selection";
import { cn, formatProgress } from "@/lib/utils";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

const AUTOSAVE_DEBOUNCE_MS = 600;

const SITE_GOAL_OPTIONS = [
    { value: "present_services", label: "Présenter vos services" },
    { value: "get_contacts", label: "Obtenir des contacts / devis" },
    { value: "sell_online", label: "Vendre en ligne" },
    { value: "optimize_image", label: "Optimiser votre image" },
    { value: "other", label: "Autre" }
] as const;

const STYLE_OPTIONS = [
    { value: "simple_minimalist", label: "Simple & minimaliste" },
    { value: "modern_dynamic", label: "Moderne & dynamique" },
    { value: "luxury_elegant", label: "Luxe & élégant" },
    { value: "colorful_creative", label: "Coloré & créatif" },
    { value: "professional_serious", label: "Professionnel & sérieux" },
    { value: "not_sure", label: "Je ne sais pas, proposez-moi" }
] as const;

type ProspectOnboardingFormState = {
    companyName: string;
    activity: string;

    siteGoal: string[];
    siteGoalOther: string;
    inspirationUrls: string[];
    preferredStyles: string[];
    primaryColor: string;
    logoUrl: string;
    hasVisualIdentity: "yes" | "no" | "not_yet" | "" | undefined;
    welcomePhrase: string;
    mainServices: string[];
    importantInfo: string;
};

interface ProspectOnboardingProjectEntry {
    id: string;
    name: string;
    status: string;
    progress: number;
    payload: Record<string, unknown> | null;
    completed: boolean;
    updatedAt: string | null;
}

interface ProspectOnboardingWizardProps {
    projects: ProspectOnboardingProjectEntry[];
    userEmail?: string | null;
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
        id: "contact",
        label: "Vos coordonnées",
        description: "Pour mieux vous connaître.",
        schema: ProspectContactSchema,
        fields: ["companyName", "activity"]
    },
    {
        id: "goals",
        label: "Vos objectifs",
        description: "Quel est le but principal de votre site ?",
        schema: ProspectGoalSchema,
        fields: ["siteGoal", "siteGoalOther"]
    },
    {
        id: "inspirations",
        label: "Vos inspirations",
        description: "Des exemples de sites que vous aimez ?",
        schema: ProspectInspirationSchema,
        fields: ["inspirationUrls"]
    },
    {
        id: "style",
        label: "Votre style",
        description: "Quelle ambiance souhaitez-vous ?",
        schema: ProspectStyleSchema,
        fields: ["preferredStyles"]
    },
    {
        id: "identity_check",
        label: "Identité visuelle",
        description: "Avez-vous déjà une charte graphique ?",
        schema: ProspectIdentitySchema,
        fields: ["hasVisualIdentity"]
    },
    {
        id: "branding",
        label: "Vos éléments",
        description: "Logo et couleurs (si vous en avez).",
        schema: ProspectBrandingSchema,
        fields: ["primaryColor", "logoUrl"]
    },
    {
        id: "message",
        label: "Votre message",
        description: "Que souhaitez-vous dire à vos visiteurs ?",
        schema: ProspectMessageSchema,
        fields: ["welcomePhrase", "mainServices"]
    },
    {
        id: "infos",
        label: "Infos complémentaires",
        description: "D'autres précisions utiles ?",
        schema: ProspectInfoSchema,
        fields: ["importantInfo"]
    }
] as const;

const ensureString = (value: unknown, fallback = ""): string =>
    typeof value === "string" ? value : fallback;

const ensureStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const buildDefaultValues = (
    initialValues: Record<string, unknown> | null,
    completed: boolean
): ProspectOnboardingFormState => {
    const payload = initialValues ?? {};
    const inspirationUrls = ensureStringArray(payload.inspirationUrls);
    const mainServices = ensureStringArray(payload.mainServices);

    return {
        companyName: ensureString(payload.companyName),
        activity: ensureString(payload.activity),

        siteGoal: ensureStringArray(payload.siteGoal),
        siteGoalOther: ensureString(payload.siteGoalOther),
        inspirationUrls: inspirationUrls.length > 0 ? inspirationUrls : ["", "", ""],
        preferredStyles: ensureStringArray(payload.preferredStyles),
        primaryColor: ensureString(payload.primaryColor, "#43b2b9"),
        logoUrl: ensureString(payload.logoUrl),
        hasVisualIdentity: (payload.hasVisualIdentity as ProspectOnboardingFormState["hasVisualIdentity"]) ?? "",
        welcomePhrase: ensureString(payload.welcomePhrase),
        mainServices: mainServices.length === 3 ? mainServices : ["", "", ""],
        importantInfo: ensureString(payload.importantInfo)
    };
};

const normalizeDraftPayload = (values: ProspectOnboardingFormState): ProspectOnboardingDraftPayload => {
    const trimmed = (input: string) => input.trim();

    const draft: ProspectOnboardingDraftPayload = {};

    if (values.companyName.trim().length > 0) draft.companyName = trimmed(values.companyName);
    if (values.activity.trim().length > 0) draft.activity = trimmed(values.activity);


    if (values.siteGoal && values.siteGoal.length > 0) {
        draft.siteGoal = values.siteGoal as ProspectOnboardingDraftPayload["siteGoal"];
        if (values.siteGoal.includes("other") && values.siteGoalOther.trim().length > 0) {
            draft.siteGoalOther = trimmed(values.siteGoalOther);
        }
    }

    const inspirationUrls = values.inspirationUrls
        .map((url) => trimmed(url))
        .filter((url) => url.length > 0);
    if (inspirationUrls.length > 0) draft.inspirationUrls = inspirationUrls;

    if (values.preferredStyles.length > 0) draft.preferredStyles = values.preferredStyles;

    if (values.primaryColor.trim().length > 0) draft.primaryColor = trimmed(values.primaryColor);
    if (values.logoUrl.trim().length > 0) draft.logoUrl = trimmed(values.logoUrl);

    if (values.hasVisualIdentity) {
        draft.hasVisualIdentity = values.hasVisualIdentity as ProspectOnboardingDraftPayload["hasVisualIdentity"];
    }

    if (values.welcomePhrase.trim().length > 0) draft.welcomePhrase = trimmed(values.welcomePhrase);

    const mainServices = values.mainServices
        .map((service) => trimmed(service))
        .filter((service) => service.length > 0);
    if (mainServices.length > 0) draft.mainServices = mainServices;

    if (values.importantInfo.trim().length > 0) draft.importantInfo = trimmed(values.importantInfo);

    return draft;
};

const normalizeFinalPayload = (values: ProspectOnboardingFormState): ProspectOnboardingPayload => {
    const trimmed = (input: string) => input.trim();

    if (!values.siteGoal || values.siteGoal.length === 0) throw new Error("siteGoal est requis");

    if (!values.hasVisualIdentity) throw new Error("hasVisualIdentity est requis");
    if (!values.companyName || values.companyName.trim().length === 0) throw new Error("Le nom de l'entreprise est requis");

    return {
        companyName: trimmed(values.companyName),
        activity: trimmed(values.activity),

        siteGoal: values.siteGoal as ProspectOnboardingPayload["siteGoal"],
        siteGoalOther: values.siteGoal.includes("other") ? trimmed(values.siteGoalOther) : undefined,
        inspirationUrls: values.inspirationUrls
            .map((url) => trimmed(url))
            .filter((url) => url.length > 0),
        preferredStyles: values.preferredStyles as ProspectOnboardingPayload["preferredStyles"],
        primaryColor: values.primaryColor.trim().length > 0 ? trimmed(values.primaryColor) : undefined,
        logoUrl: values.logoUrl.trim().length > 0 ? trimmed(values.logoUrl) : undefined,
        hasVisualIdentity: values.hasVisualIdentity as ProspectOnboardingPayload["hasVisualIdentity"],
        welcomePhrase: trimmed(values.welcomePhrase),
        mainServices: values.mainServices.map((service) => trimmed(service)),
        importantInfo: values.importantInfo.trim().length > 0 ? trimmed(values.importantInfo) : undefined
    };
};

export function ProspectOnboardingWizard({ projects, userEmail }: ProspectOnboardingWizardProps) {
    const router = useRouter();
    const { projectId: selectedProjectId, setProjectId: setGlobalProjectId, ready } = useProjectSelection();

    const fallbackProjectId = useMemo(() => projects[0]?.id ?? null, [projects]);

    useEffect(() => {
        if (!ready || !fallbackProjectId) return;
        if (!selectedProjectId) setGlobalProjectId(fallbackProjectId);
    }, [fallbackProjectId, ready, selectedProjectId, setGlobalProjectId]);

    const activeProject =
        projects.find((project) => project.id === (selectedProjectId ?? fallbackProjectId)) ??
        projects[0];

    const projectId = activeProject?.id ?? "";
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
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    useEffect(() => { setIsHydrated(true); }, []);

    const defaultValues = useMemo(
        () => buildDefaultValues(initialValues, completed),
        [initialValues, completed]
    );

    const form = useForm<ProspectOnboardingFormState>({
        defaultValues,
        mode: "onChange",
        shouldUnregister: false
    });

    const { control } = form;

    const inspirationUrlsArray = useFieldArray({
        control,
        name: "inspirationUrls" as FieldArrayPath<ProspectOnboardingFormState>
    });
    const mainServicesArray = useFieldArray({
        control,
        name: "mainServices" as FieldArrayPath<ProspectOnboardingFormState>
    });

    const watchedValues = useWatch<ProspectOnboardingFormState>({ control });

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
        if (isCompleted) return;

        const payload = normalizeDraftPayload(watchedValues as ProspectOnboardingFormState);
        const signature = JSON.stringify(payload);
        const hasChanged = signature !== draftSignatureRef.current;

        if (skipNextAutoSaveRef.current && !hasChanged) {
            skipNextAutoSaveRef.current = false;
            return;
        }
        if (skipNextAutoSaveRef.current) skipNextAutoSaveRef.current = false;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            const currentPayload = normalizeDraftPayload(watchedValues as ProspectOnboardingFormState);
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
    }, [watchedValues, projectId, isCompleted]);

    const handleLogoUpload = async (file: File) => {
        if (!projectId) {
            toast.error("Projet introuvable.");
            return;
        }

        setIsUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("projectId", projectId);

            const response = await fetch("/api/files/signed-url", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const data = (await response.json().catch(() => ({}))) as { error?: string };
                throw new Error(data.error ?? "Erreur lors de l'upload du logo.");
            }

            const result = (await response.json()) as { uploadUrl?: string; path?: string };
            const logoUrl = result.uploadUrl || result.path;

            if (logoUrl) {
                form.setValue("logoUrl", logoUrl);
                toast.success("Logo uploadé avec succès !");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors de l'upload.";
            toast.error(message);
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const setSchemaErrors = (result: z.SafeParseReturnType<unknown, unknown>) => {
        if (result.success) return;

        // Use issues directly to handle paths correctly (e.g. mainServices.0)
        result.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            form.setError(path as any, {
                type: "manual",
                message: issue.message
            });
        });
    };

    const validateStep = (index: number) => {
        const definition = stepDefinitions[index];
        if (definition.id === "welcome") return true;

        const values = form.getValues();
        let stepPayload: Record<string, unknown> = {};

        if (definition.id === "contact") {
            stepPayload = {
                companyName: values.companyName,
                activity: values.activity
            };
        } else if (definition.id === "goals") {
            stepPayload = {
                siteGoal: values.siteGoal.length > 0 ? values.siteGoal : undefined,
                siteGoalOther: values.siteGoalOther
            };
        } else if (definition.id === "inspirations") {
            const filteredUrls = values.inspirationUrls.filter((url) => url.trim().length > 0);
            stepPayload = {
                inspirationUrls: filteredUrls.length > 0 ? filteredUrls : undefined
            };
        } else if (definition.id === "style") {
            stepPayload = {
                preferredStyles: values.preferredStyles
            };
        } else if (definition.id === "identity_check") {
            stepPayload = {
                hasVisualIdentity: values.hasVisualIdentity ? values.hasVisualIdentity : undefined
            };
        } else if (definition.id === "branding") {
            stepPayload = {
                primaryColor: values.primaryColor,
                logoUrl: values.logoUrl
            };
        } else if (definition.id === "message") {
            stepPayload = {
                welcomePhrase: values.welcomePhrase,
                mainServices: values.mainServices
            };
        } else if (definition.id === "infos") {
            stepPayload = {
                importantInfo: values.importantInfo
            };
        }

        const result = definition.schema.safeParse(stepPayload);
        if (!result.success) {
            setSchemaErrors(result);
            toast.error("Merci de compléter les informations requises avant de continuer.");
            return false;
        }

        // Clear errors for current step fields
        definition.fields.forEach((field) => {
            form.clearErrors(field as keyof ProspectOnboardingFormState);
            // Also clear potential array errors
            if (field === "mainServices") {
                form.clearErrors("mainServices.0" as any);
                form.clearErrors("mainServices.1" as any);
                form.clearErrors("mainServices.2" as any);
            }
        });
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
                        completed: true
                    })
                });

                if (!response.ok) throw new Error("Impossible de finaliser l’onboarding.");

                // Webhooks
                try {
                    await fetch("https://orylis.app.n8n.cloud/webhook/3bc9c601-c3b6-422b-9f1e-90c2b576c761", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ projectId, ...finalPayload })
                    });
                } catch (e) { }

                try {
                    await fetch("https://hook.eu2.make.com/6inqljar2or4jxl74uprzx4s15nucgjj", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ projectId, userEmail, ...finalPayload })
                    });
                } catch (e) { }

                draftSignatureRef.current = JSON.stringify(normalizeDraftPayload(form.getValues()));
                setIsCompleted(true);
                setLastSavedAt(new Date());
                toast.success("Onboarding complété ! Votre démo est en cours de création.");
                setShowEditor(false);
                router.replace("/");
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
            } finally {
                setIsSubmitting(false);
            }
        })();
    };

    if (!showEditor) {
        return (
            <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-4 sm:p-8 bg-slate-50/50">
                <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Votre site est prêt à être généré 🚀</h2>
                <p className="text-lg text-slate-600 max-w-lg mx-auto mb-8">
                    Félicitations ! Nous avons toutes les infos.
                    <br />
                    <span className="font-semibold text-slate-900">Dernière étape :</span> Réservez votre démo de lancement ci-dessous pour activer votre espace et récupérer vos accès.
                </p>

                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div
                        className="calendly-inline-widget w-full"
                        data-url="https://calendly.com/lucas-orylis/30min?hide_event_type_details=1&hide_gdpr_banner=1"
                        style={{ minWidth: '320px', height: '700px' }}
                    />
                    <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
                </div>

                <div className="mt-8">
                    <Button onClick={() => router.push("/")} variant="outline" className="text-slate-400 hover:text-slate-600">
                        Passer cette étape (non recommandé)
                    </Button>
                </div>
            </div>
        );
    }

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
                                        <h1 className="text-2xl font-bold text-slate-900">
                                            Complétez ce formulaire pour recevoir votre démo personnalisée sous 24h 🚀
                                        </h1>
                                        <p className="text-lg text-slate-600">
                                            Cela ne prend que 3–4 minutes. Vos réponses nous permettent d'adapter votre démo à votre activité.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep.id === "contact" && (
                                <div className="grid gap-6">
                                    <FormField
                                        control={control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Nom de votre entreprise</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-base" placeholder="Nom de votre entreprise" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="activity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Votre activité principale</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-base" placeholder="Ex : traiteur, coach, artisan..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>
                            )}

                            {currentStep.id === "goals" && (
                                <div className="grid gap-6">
                                    <FormField
                                        control={control}
                                        name="siteGoal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base mb-4 block">But du site</FormLabel>
                                                <div className="grid gap-3">
                                                    {SITE_GOAL_OPTIONS.map((option) => (
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
                                    {form.watch("siteGoal")?.includes("other") && (
                                        <FormField
                                            control={control}
                                            name="siteGoalOther"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base">Précisez votre objectif</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 text-base" placeholder="Votre objectif..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            )}

                            {currentStep.id === "inspirations" && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <FormLabel className="text-base block">3 sites que vous aimez (optionnel)</FormLabel>
                                        <p className="text-slate-500">Partagez des liens vers des sites, Instagram, Facebook ou n'importe quel lien qui vous inspire.</p>
                                        {inspirationUrlsArray.fields.map((field, index) => (
                                            <FormField
                                                key={field.id}
                                                control={control}
                                                name={`inspirationUrls.${index}` as any}
                                                render={({ field }) => (
                                                    <Input placeholder={`Lien ${index + 1}`} className="h-12 text-base" {...field} />
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep.id === "style" && (
                                <div className="space-y-8">
                                    <FormField
                                        control={control}
                                        name="preferredStyles"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base mb-4 block">Style préféré</FormLabel>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {STYLE_OPTIONS.map((option) => (
                                                        <label
                                                            key={option.value}
                                                            className={cn(
                                                                "flex cursor-pointer items-center justify-center text-center rounded-xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50",
                                                                field.value.includes(option.value) && "border-blue-500 bg-blue-50 text-blue-700"
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
                                                            <span className="font-medium">{option.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {currentStep.id === "identity_check" && (
                                <div className="space-y-8">
                                    <FormField
                                        control={control}
                                        name="hasVisualIdentity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base block mb-4">Avez-vous déjà une identité visuelle ?</FormLabel>
                                                <div className="flex gap-4">
                                                    {[
                                                        { value: "yes", label: "Oui" },
                                                        { value: "no", label: "Non" },
                                                        { value: "not_yet", label: "Pas encore" }
                                                    ].map((option) => (
                                                        <label
                                                            key={option.value}
                                                            className={cn(
                                                                "flex-1 cursor-pointer rounded-xl border-2 border-slate-100 bg-white p-4 text-center transition-all hover:border-blue-200",
                                                                field.value === option.value && "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                                            )}
                                                        >
                                                            <input
                                                                type="radio"
                                                                className="sr-only"
                                                                checked={field.value === option.value}
                                                                onChange={() => field.onChange(option.value)}
                                                            />
                                                            <span className="font-medium">{option.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {currentStep.id === "branding" && (
                                <div className="space-y-8">
                                    <FormField
                                        control={control}
                                        name="primaryColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base" optional>Couleur principale souhaitée</FormLabel>
                                                <div className="flex items-center gap-4">
                                                    <FormControl>
                                                        <Input
                                                            type="color"
                                                            className="h-16 w-24 cursor-pointer p-1"
                                                            {...field}
                                                            value={field.value || "#43b2b9"}
                                                        />
                                                    </FormControl>
                                                    <FormControl>
                                                        <Input
                                                            type="text"
                                                            placeholder="#43b2b9"
                                                            className="h-16 text-base font-mono"
                                                            {...field}
                                                            value={field.value || "#43b2b9"}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="logoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base" optional>Logo (URL ou Upload)</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input className="h-12 text-base" placeholder="https://..." {...field} />
                                                    </FormControl>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            id="logo-upload"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleLogoUpload(file);
                                                            }}
                                                            disabled={isUploadingLogo}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-12 w-12"
                                                            onClick={() => document.getElementById("logo-upload")?.click()}
                                                            disabled={isUploadingLogo}
                                                        >
                                                            {isUploadingLogo ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Upload className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {currentStep.id === "message" && (
                                <div className="space-y-8">
                                    <FormField
                                        control={control}
                                        name="welcomePhrase"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Votre phrase d'accueil</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-base" placeholder="Ex : Bienvenue chez X..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4">
                                        <FormLabel className="text-base block">Vos 3 services principaux</FormLabel>
                                        {mainServicesArray.fields.map((field, index) => (
                                            <FormField
                                                key={field.id}
                                                control={control}
                                                name={`mainServices.${index}` as any}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder={`Service ${index + 1}`} className="h-12 text-base" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep.id === "infos" && (
                                <div className="space-y-8">
                                    <FormField
                                        control={control}
                                        name="importantInfo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base" optional>Informations importantes</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder='Ex : "Je veux un site simple", "J&apos;ai déjà un site", "Je veux un système de réservation"'
                                                        className="min-h-[120px] p-4 text-base"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )
                            }
                        </div >

                        {/* Navigation Footer */}
                        < div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white p-4 sm:static sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-8" >
                            <div className="mx-auto flex max-w-2xl items-center justify-between">
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
                                        <span className="hidden text-xs text-muted-foreground animate-pulse sm:inline-block">
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
                                            disabled={isSubmitting}
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
                        </div >

                    </div >
                </Form >
            </div >
        </div >
    );
}
