"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Control, type FieldArrayPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import {
  ProspectOnboardingDraftSchema,
  ProspectOnboardingFinalSchema,
  ProspectOnboardingStep1Schema,
  ProspectOnboardingStep2Schema,
  ProspectOnboardingStep3Schema,
  ProspectOnboardingStep4Schema,
  type ProspectOnboardingDraftPayload,
  type ProspectOnboardingPayload
} from "@/lib/zod-schemas";
import { useProjectSelection } from "@/lib/project-selection";
import { cn, formatDate } from "@/lib/utils";
import { ProgressSteps } from "@/components/progress-steps";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

interface ProspectOnboardingFormProps {
  projects: ProspectOnboardingProjectEntry[];
}

const stepDefinitions = [
  {
    id: "activity",
    label: "Votre activité",
    description: "Juste l'essentiel pour que nous adaptions votre démo.",
    schema: ProspectOnboardingStep1Schema,
    progress: 25
  },
  {
    id: "style",
    label: "Style & inspirations",
    description: "Pour que la démo ressemble vraiment à ce que vous aimez.",
    schema: ProspectOnboardingStep2Schema,
    progress: 50
  },
  {
    id: "identity",
    label: "Identité visuelle",
    description: "Ces éléments nous permettent d'adapter le design.",
    schema: ProspectOnboardingStep3Schema,
    progress: 75
  },
  {
    id: "content",
    label: "Contenu / message",
    description: "Quelques lignes suffisent pour personnaliser la démo.",
    schema: ProspectOnboardingStep4Schema,
    progress: 100
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

  if (values.companyName.trim().length > 0) {
    draft.companyName = trimmed(values.companyName);
  }

  if (values.activity.trim().length > 0) {
    draft.activity = trimmed(values.activity);
  }

  if (values.siteGoal && values.siteGoal.length > 0) {
    draft.siteGoal = values.siteGoal as ProspectOnboardingDraftPayload["siteGoal"];
    if (values.siteGoal.includes("other") && values.siteGoalOther.trim().length > 0) {
      draft.siteGoalOther = trimmed(values.siteGoalOther);
    }
  }

  const inspirationUrls = values.inspirationUrls
    .map((url) => trimmed(url))
    .filter((url) => url.length > 0);
  if (inspirationUrls.length > 0) {
    draft.inspirationUrls = inspirationUrls;
  }

  if (values.preferredStyles.length > 0) {
    draft.preferredStyles = values.preferredStyles;
  }

  if (values.primaryColor.trim().length > 0) {
    draft.primaryColor = trimmed(values.primaryColor);
  }

  if (values.logoUrl.trim().length > 0) {
    draft.logoUrl = trimmed(values.logoUrl);
  }

  if (values.hasVisualIdentity) {
    draft.hasVisualIdentity = values.hasVisualIdentity as ProspectOnboardingDraftPayload["hasVisualIdentity"];
  }

  if (values.welcomePhrase.trim().length > 0) {
    draft.welcomePhrase = trimmed(values.welcomePhrase);
  }

  const mainServices = values.mainServices
    .map((service) => trimmed(service))
    .filter((service) => service.length > 0);
  if (mainServices.length > 0) {
    draft.mainServices = mainServices;
  }

  if (values.importantInfo.trim().length > 0) {
    draft.importantInfo = trimmed(values.importantInfo);
  }

  return draft;
};

const normalizeFinalPayload = (values: ProspectOnboardingFormState): ProspectOnboardingPayload => {
  const trimmed = (input: string) => input.trim();

  if (!values.siteGoal || values.siteGoal.length === 0) {
    throw new Error("siteGoal est requis");
  }

  if (!values.hasVisualIdentity) {
    throw new Error("hasVisualIdentity est requis");
  }

  return {
    companyName: values.companyName.trim().length > 0 ? trimmed(values.companyName) : undefined,
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

export function ProspectOnboardingForm({ projects }: ProspectOnboardingFormProps) {
  const router = useRouter();
  const { projectId: selectedProjectId, setProjectId: setGlobalProjectId, ready } = useProjectSelection();

  const fallbackProjectId = useMemo(() => projects[0]?.id ?? null, [projects]);

  useEffect(() => {
    if (!ready || !fallbackProjectId) {
      return;
    }
    if (!selectedProjectId) {
      setGlobalProjectId(fallbackProjectId);
    }
  }, [fallbackProjectId, ready, selectedProjectId, setGlobalProjectId]);

  const activeProject =
    projects.find((project) => project.id === (selectedProjectId ?? fallbackProjectId)) ??
    projects[0];

  const projectId = activeProject?.id ?? "";
  const projectName = activeProject?.name ?? "Projet";
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const [isSubmitting, startTransition] = useTransition();

  const defaultValues = useMemo(
    () => buildDefaultValues(initialValues, completed),
    [initialValues, completed]
  );

  const form = useForm<ProspectOnboardingFormState>({
    defaultValues,
    mode: "onChange",
    shouldUnregister: false
  });

  const { control, watch } = form;

  const inspirationUrlsArray = useFieldArray<ProspectOnboardingFormState>({
    control,
    name: "inspirationUrls" as FieldArrayPath<ProspectOnboardingFormState>
  });

  const mainServicesArray = useFieldArray<ProspectOnboardingFormState>({
    control,
    name: "mainServices" as FieldArrayPath<ProspectOnboardingFormState>
  });

  const watchedValues = watch();

  const draftSignatureRef = useRef<string>(
    JSON.stringify(normalizeDraftPayload(defaultValues))
  );
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
  }, [projectId, defaultValues, form, completed, lastUpdatedAt]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (isCompleted) {
      return;
    }

    const payload = normalizeDraftPayload(watchedValues as ProspectOnboardingFormState);
    const signature = JSON.stringify(payload);
    const hasChanged = signature !== draftSignatureRef.current;

    if (skipNextAutoSaveRef.current && !hasChanged) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const currentPayload = normalizeDraftPayload(watchedValues as ProspectOnboardingFormState);
      const currentSignature = JSON.stringify(currentPayload);

      if (currentSignature === draftSignatureRef.current) {
        return;
      }

      try {
        setIsSavingDraft(true);
        setSavingError(null);
        const response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            payload: currentPayload
          })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible d'enregistrer le brouillon.");
        }

        draftSignatureRef.current = currentSignature;
        setLastSavedAt(new Date());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur lors de l'autosauvegarde.";
        setSavingError(message);
      } finally {
        setIsSavingDraft(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
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
    if (result.success) {
      return;
    }
    const fieldErrors = result.error.flatten().fieldErrors;
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      const items = Array.isArray(messages) ? messages : [];
      if (items.length === 0) {
        return;
      }
      form.setError(field as keyof ProspectOnboardingFormState, {
        type: "manual",
        message: items[0]
      });
    });
  };

  const validateStep = (index: number) => {
    const definition = stepDefinitions[index];
    const values = form.getValues();

    // Pour la validation, on prend les valeurs brutes du formulaire
    // et on les adapte au schéma de l'étape
    let stepPayload: Record<string, unknown> = {};

    if (index === 0) {
      // Étape 1 : activité
      stepPayload = {
        companyName: values.companyName,
        activity: values.activity,
        siteGoal: values.siteGoal.length > 0 ? values.siteGoal : undefined,
        siteGoalOther: values.siteGoalOther
      };
    } else if (index === 1) {
      // Étape 2 : style
      const filteredUrls = values.inspirationUrls.filter((url) => url.trim().length > 0);
      stepPayload = {
        ...(filteredUrls.length > 0 ? { inspirationUrls: filteredUrls } : {}),
        preferredStyles: values.preferredStyles
      };
    } else if (index === 2) {
      // Étape 3 : identité
      stepPayload = {
        primaryColor: values.primaryColor,
        logoUrl: values.logoUrl,
        hasVisualIdentity: values.hasVisualIdentity ? values.hasVisualIdentity : undefined
      };
    } else if (index === 3) {
      // Étape 4 : contenu
      stepPayload = {
        welcomePhrase: values.welcomePhrase,
        // Ne pas filtrer ici pour laisser le schéma contrôler:
        // - service #1 obligatoire (>= 2 chars)
        // - services #2 et #3 optionnels
        mainServices: values.mainServices,
        importantInfo: values.importantInfo
      };
    }

    const result = definition.schema.safeParse(stepPayload);
    if (!result.success) {
      setSchemaErrors(result);
      toast.error("Merci de compléter les informations requises avant de continuer.");
      return false;
    }

    // Clear errors for fields in this step
    Object.keys(stepPayload).forEach((field) =>
      form.clearErrors(field as keyof ProspectOnboardingFormState)
    );
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStepIndex)) {
      return;
    }
    setCurrentStepIndex((prev) => Math.min(prev + 1, stepDefinitions.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    const lastIndex = stepDefinitions.length - 1;
    if (!validateStep(lastIndex)) {
      return;
    }

    const finalPayload = normalizeFinalPayload(form.getValues());

    startTransition(async () => {
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

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible de finaliser l'onboarding.");
        }

        draftSignatureRef.current = JSON.stringify(normalizeDraftPayload(form.getValues()));
        setIsCompleted(true);
        setLastSavedAt(new Date());
        toast.success("Onboarding complété ! Votre démo est en cours de création.");
        router.replace("/");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la validation.";
        toast.error(message);
      }
    });
  };

  const currentProgress = stepDefinitions[currentStepIndex]?.progress ?? 0;

  const stepsProgress = stepDefinitions.map((step, index) => ({
    id: step.id,
    label: `${index + 1}. ${step.label}`,
    description: step.description,
    status:
      index < currentStepIndex
        ? ("done" as const)
        : index === currentStepIndex
          ? ("current" as const)
          : ("upcoming" as const)
  }));

  return (
    <div className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
      {/* Titre optimisé pour la conversion */}
      <div className="space-y-1.5 sm:space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl break-words">
          Complétez ce formulaire pour recevoir votre démo personnalisée sous 24h 🚀
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm md:text-base break-words">
          3–4 minutes. Vos réponses nous permettent d&apos;adapter votre démo à votre activité.
        </p>
      </div>

      {/* Barre de progression */}
      <Card className="border border-border/80 bg-white/90">
        <CardHeader className="gap-2 space-y-0 pb-2 sm:pb-3 md:flex md:flex-row md:items-center md:justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-foreground sm:text-base">{projectName}</CardTitle>
            <CardDescription className="text-xs">
              Progression <span className="font-medium text-foreground">{currentProgress}%</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              {isSavingDraft && (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Sauvegarde…
                </span>
              )}
              {!isSavingDraft && savingError && (
                <span className="inline-flex items-center gap-2 text-destructive text-xs">{savingError}</span>
              )}
              {!isSavingDraft && !savingError && (
                <span suppressHydrationWarning className="text-xs">
                  {lastSavedAt && isHydrated
                    ? formatDate(lastSavedAt, { dateStyle: "medium", timeStyle: "short" })
                    : "À venir"}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ProgressSteps steps={stepsProgress} className="grid gap-1.5 sm:gap-2 md:grid-cols-4" />
          <Progress value={currentProgress} className="mt-2 sm:mt-3" />
        </CardContent>
      </Card>

      <Form form={form} onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-3 sm:space-y-4">
          {/* Étape 1 : Votre activité */}
          {currentStepIndex === 0 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <span>📋</span>
                  Parlez-nous de votre activité
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Juste l'essentiel pour que nous adaptions votre démo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <FormField
                  control={control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de votre entreprise (optionnel)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Si vous n'en avez pas encore, laissez vide"
                          {...field}
                        />
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
                      <FormLabel>Votre activité principale</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex : traiteur, coach, artisan, immobilier…"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="siteGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>But du site</FormLabel>
                      <FormControl>
                        <div className="space-y-2.5 sm:space-y-3">
                          {SITE_GOAL_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2.5 sm:space-x-3">
                              <Checkbox
                                id={option.value}
                                checked={field.value?.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, option.value]);
                                  } else {
                                    field.onChange(current.filter((v) => v !== option.value));
                                  }
                                }}
                              />
                              <label
                                htmlFor={option.value}
                                className="text-xs font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer sm:text-sm sm:leading-none"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watch("siteGoal")?.includes("other") && (
                  <FormField
                    control={control}
                    name="siteGoalOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Précisez votre objectif</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre objectif..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Étape 2 : Style & inspirations */}
          {currentStepIndex === 1 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <span>🎨</span>
                  Votre style
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Pour que la démo ressemble vraiment à ce que vous aimez.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-4">
                  <FormLabel>3 sites que vous aimez (optionnel)</FormLabel>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    Partagez des liens vers des sites, Instagram, Facebook ou n&apos;importe quel lien qui
                    vous inspire.
                  </p>
                  {inspirationUrlsArray.fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={control}
                      name={`inspirationUrls.${index}`}
                      render={({ field: urlField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder={`Lien ${index + 1} (optionnel)`}
                              {...urlField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <FormField
                  control={control}
                  name="preferredStyles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style préféré</FormLabel>
                      <div className="space-y-2.5 sm:space-y-3">
                        {STYLE_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2.5 sm:space-x-3">
                            <Checkbox
                              id={option.value}
                              checked={field.value?.includes(option.value)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, option.value]);
                                } else {
                                  field.onChange(current.filter((v) => v !== option.value));
                                }
                              }}
                            />
                            <label
                              htmlFor={option.value}
                              className="text-xs font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer sm:text-sm sm:leading-none"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Étape 3 : Identité visuelle */}
          {currentStepIndex === 2 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <span>🎨</span>
                  Votre identité visuelle
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Ces éléments nous permettent d'adapter le design.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <FormField
                  control={control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couleur principale souhaitée (optionnel)</FormLabel>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <FormControl>
                          <Input
                            type="color"
                            className="h-10 w-16 sm:h-12 sm:w-24 cursor-pointer shrink-0"
                            {...field}
                            value={field.value || "#43b2b9"}
                          />
                        </FormControl>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="#43b2b9"
                            pattern="^#[0-9A-Fa-f]{6}$"
                            className="min-w-0 flex-1"
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
                      <FormLabel>Logo (optionnel)</FormLabel>
                      <div className="space-y-3">
                        {field.value && (
                          <div className="relative inline-block">
                            <img
                              src={field.value}
                              alt="Logo"
                              className="h-24 w-24 rounded-lg border border-border object-contain"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => field.onChange("")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="logo-upload"
                            disabled={isUploadingLogo}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleLogoUpload(file);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isUploadingLogo}
                            className="shrink-0"
                            onClick={() => document.getElementById("logo-upload")?.click()}
                          >
                            {isUploadingLogo ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Upload...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">{field.value ? "Remplacer le logo" : "Uploader un logo"}</span>
                                <span className="sm:hidden">{field.value ? "Remplacer" : "Uploader"}</span>
                              </>
                            )}
                          </Button>
                          {!field.value && (
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                              Ou collez une URL d&apos;image
                            </p>
                          )}
                        </div>
                        {!field.value && (
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/logo.png"
                              {...field}
                            />
                          </FormControl>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="hasVisualIdentity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avez-vous déjà une identité visuelle ?</FormLabel>
                      <FormControl>
                        <div className="space-y-2.5 sm:space-y-3">
                          <div className="flex items-center space-x-2.5 sm:space-x-3">
                            <input
                              type="radio"
                              id="identity-yes"
                              value="yes"
                              checked={field.value === "yes"}
                              onChange={() => field.onChange("yes")}
                              className="h-4 w-4 border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            />
                            <label
                              htmlFor="identity-yes"
                              className="text-xs font-medium leading-tight cursor-pointer sm:text-sm sm:leading-none"
                            >
                              Oui
                            </label>
                          </div>
                          <div className="flex items-center space-x-2.5 sm:space-x-3">
                            <input
                              type="radio"
                              id="identity-no"
                              value="no"
                              checked={field.value === "no"}
                              onChange={() => field.onChange("no")}
                              className="h-4 w-4 border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            />
                            <label
                              htmlFor="identity-no"
                              className="text-xs font-medium leading-tight cursor-pointer sm:text-sm sm:leading-none"
                            >
                              Non
                            </label>
                          </div>
                          <div className="flex items-center space-x-2.5 sm:space-x-3">
                            <input
                              type="radio"
                              id="identity-not-yet"
                              value="not_yet"
                              checked={field.value === "not_yet"}
                              onChange={() => field.onChange("not_yet")}
                              className="h-4 w-4 border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            />
                            <label
                              htmlFor="identity-not-yet"
                              className="text-xs font-medium leading-tight cursor-pointer sm:text-sm sm:leading-none"
                            >
                              Pas encore
                            </label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Étape 4 : Contenu / message */}
          {currentStepIndex === 3 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <span>✍️</span>
                  Votre message principal
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Quelques lignes suffisent pour personnaliser la démo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <FormField
                  control={control}
                  name="welcomePhrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Votre phrase d'accueil</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ex : Bienvenue chez X, votre expert en …'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Vos 3 services principaux</FormLabel>
                  {mainServicesArray.fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={control}
                      name={`mainServices.${index}`}
                      render={({ field: serviceField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder={`Service ${index + 1}`}
                              {...serviceField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <FormField
                  control={control}
                  name="importantInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Informations importantes (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Ex : "Je veux un site simple", "J&apos;ai déjà un site", "Je veux un système de réservation"'
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2.5 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="text-xs text-muted-foreground sm:text-sm shrink-0">
              Étape {currentStepIndex + 1} sur {stepDefinitions.length}
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePreviousStep}
                disabled={currentStepIndex === 0 || isSubmitting}
                className="text-sm sm:text-base"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              {currentStepIndex < stepDefinitions.length - 1 && (
                <Button type="button" onClick={handleNextStep} disabled={isSubmitting} className="text-sm sm:text-base">
                  Étape suivante
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {currentStepIndex === stepDefinitions.length - 1 && (
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="text-sm sm:text-base">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validation…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Valider l'onboarding
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}

