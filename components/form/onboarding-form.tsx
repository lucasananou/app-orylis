"use client";

import type { Route } from "next";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
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
import { cn, formatDate, formatProgress, isStaff, type UserRole } from "@/lib/utils";
import { ProgressSteps } from "@/components/progress-steps";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ProjectRequestDialog } from "@/components/projects/project-request-dialog";
import { ProjectFeedbackDialog } from "@/components/projects/project-feedback-dialog";

const AUTOSAVE_DEBOUNCE_MS = 600;
const MAX_INSPIRATIONS = 8;
const MAX_COMPETITORS = 8;

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

type GoalOption = (typeof GOAL_OPTIONS)[number]["value"];

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

interface OnboardingFormProps {
  projects: OnboardingProjectEntry[];
  role: UserRole;
}

const stepDefinitions = [
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

  // Ajouter goals seulement s'il y en a
  if (values.goals.length > 0) {
    draft.goals = [...values.goals];
  }

  // Ajouter pages seulement s'il y en a
  if (values.pages.length > 0) {
    draft.pages = [...values.pages];
  }

  // Ajouter domainOwned seulement s'il est défini
  if (values.domainOwned !== undefined) {
    draft.domainOwned = values.domainOwned;
  }

  // Ajouter customPages seulement s'il y en a
  if (customPages.length > 0) {
    draft.customPages = customPages;
  }

  // Champs texte - seulement s'ils ne sont pas vides
  if (values.fullName.trim().length > 0) {
    draft.fullName = trimmed(values.fullName);
  }

  if (values.company.trim().length > 0) {
    draft.company = trimmed(values.company);
  }

  if (values.phone.trim().length > 0) {
    draft.phone = trimmed(values.phone);
  }

  if (values.website.trim().length > 0) {
    draft.website = trimmed(values.website);
  }

  if (values.description.trim().length > 0) {
    draft.description = trimmed(values.description);
  }

  if (values.contentsNote.trim().length > 0) {
    draft.contentsNote = trimmed(values.contentsNote);
  }

  // Inspirations - seulement s'il y en a (maintenant facultatif)
  const inspirations = normalizeUrls(values.inspirations);
  if (inspirations.length > 0) {
    draft.inspirations = inspirations;
  }

  // Competitors - seulement s'il y en a
  const competitors = normalizeUrls(values.competitors);
  if (competitors.length > 0) {
    draft.competitors = competitors;
  }

  // DomainName - seulement si domainOwned est true
  if (values.domainOwned && values.domainName.trim().length > 0) {
    draft.domainName = trimmed(values.domainName);
  }

  if (values.hostingNotes.trim().length > 0) {
    draft.hostingNotes = trimmed(values.hostingNotes);
  }

  return draft;
};

const normalizeFinalPayload = (values: OnboardingFormState) => {
  // Pour la validation finale, on doit inclure tous les champs requis, même s'ils sont vides
  const draft = normalizeDraftPayload(values);

  // S'assurer que les champs requis sont présents (même vides) pour la validation
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

export function OnboardingForm({ projects, role }: OnboardingFormProps) {
  const router = useRouter();
  const isStaffRole = isStaff(role);
  const { projectId: selectedProjectId, setProjectId: setGlobalProjectId, ready } = useProjectSelection();

  const fallbackProjectId = useMemo(() => projects[0]?.id ?? null, [projects]);

  useEffect(() => {
    if (!ready || !fallbackProjectId || isStaffRole) {
      return;
    }
    if (!selectedProjectId) {
      setGlobalProjectId(fallbackProjectId);
    }
  }, [fallbackProjectId, isStaffRole, ready, selectedProjectId, setGlobalProjectId]);

  const activeProject =
    projects.find((project) => project.id === (selectedProjectId ?? fallbackProjectId)) ??
    projects[0];

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        name: project.name,
        completed: project.completed
      })),
    [projects]
  );

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

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const [isSubmitting, startTransition] = useTransition();

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

  const inspirationsArray = useFieldArray({
    control,
    name: "inspirations"
  });

  const competitorsArray = useFieldArray({
    control,
    name: "competitors"
  });

  const customPagesArray = useFieldArray({
    control,
    name: "customPages"
  });

  const watchedValues = useWatch<OnboardingFormState>({
    control
  });

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
    setShowEditor(!completed);
  }, [projectId, defaultValues, form, completed, lastUpdatedAt]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (isCompleted && !isStaffRole) {
      return;
    }

    // Vérifier si les valeurs ont changé avant de décider de skip
    const payload = normalizeDraftPayload(watchedValues as OnboardingFormState);
    const signature = JSON.stringify(payload);
    const hasChanged = signature !== draftSignatureRef.current;

    // Si skipNextAutoSaveRef est true mais que les valeurs ont changé, on enregistre quand même
    if (skipNextAutoSaveRef.current && !hasChanged) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    // Réinitialiser le flag si on passe ici
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const currentPayload = normalizeDraftPayload(watchedValues as OnboardingFormState);
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

  const stepsProgress = stepDefinitions.map((step, index) => ({
    id: step.id,
    label: `${index + 1}. ${step.label}`,
    description: step.description,
    status:
      index < currentStepIndex ? ("done" as const) : index === currentStepIndex ? ("current" as const) : ("upcoming" as const)
  }));

  const handleProjectChange = (value: string) => {
    setGlobalProjectId(value);
    setCurrentStepIndex(0);
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
      form.setError(field as keyof OnboardingFormState, {
        type: "manual",
        message: items[0]
      });
    });
  };

  const validateStep = (index: number) => {
    const definition = stepDefinitions[index];
    const payload =
      definition.id === "review"
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
            completed: true,
            confirm: true
          })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible de finaliser l’onboarding.");
        }

        draftSignatureRef.current = JSON.stringify(normalizeDraftPayload(form.getValues()));
        setIsCompleted(true);
        setLastSavedAt(new Date());
        // Le message dépend du rôle : pour les prospects, on indique que la démo est en création
        const successMessage = isStaffRole
          ? "Onboarding validé. L'équipe démarre la phase design."
          : "Onboarding complété ! Votre démo est en cours de création.";
        toast.success(successMessage);
        setShowEditor(false);
        router.replace("/" as Route);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la validation.";
        toast.error(message);
      }
    });
  };

  const inspirationFields = inspirationsArray.fields;
  const competitorFields = competitorsArray.fields;

  // Permettre l'édition même si l'onboarding est complété
  // Le client peut vouloir corriger ou mettre à jour ses informations
  const isLocked = false;

  return (
    <div className="space-y-6">
      <Card className="border border-border/80 bg-white/90">
        <CardHeader className="gap-3 space-y-0 md:flex md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-foreground">
              {projectName}
            </CardTitle>
            <CardDescription>
              Statut actuel&nbsp;:{" "}
              <span className="capitalize text-foreground">{projectStatus}</span> · Progression{" "}
              <span className="font-medium text-foreground">{normalizedProgress}%</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {projectOptions.length > 1 && (
              <Select value={projectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name} {option.completed ? "• complété" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="text-sm text-muted-foreground">
              {isSavingDraft && (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sauvegarde du brouillon…
                </span>
              )}
              {!isSavingDraft && savingError && (
                <span className="inline-flex items-center gap-2 text-destructive">
                  {savingError}
                </span>
              )}
              {!isSavingDraft &&
                !savingError && (
                  <span suppressHydrationWarning>
                    Dernier enregistrement&nbsp;:{" "}
                    {lastSavedAt && isHydrated
                      ? formatDate(lastSavedAt, { dateStyle: "medium", timeStyle: "short" })
                      : "à venir"}
                  </span>
                )}
            </div>
          </div>
        </CardHeader>

      </Card>

      {isCompleted && !isStaffRole && (
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-900 shadow-lg">
          <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">✅ Onboarding terminé !</CardTitle>
              <p className="text-sm text-blue-800/90 mt-1">
                Vous pouvez toujours modifier vos informations si nécessaire.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-900/80">
              Les informations ont été transmises à l'équipe Orylis. Vous pouvez mettre à jour vos réponses à tout moment.
            </p>
          </CardContent>
        </Card>
      )}

      <Form form={form} onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-6">
          {/* Step 1 */}
          {currentStepIndex === 0 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🧾</span>
                  Identité & contact
                </CardTitle>
                <CardDescription>
                  Qui sera notre point de contact principal ? Ces éléments permettront de personnaliser
                  nos échanges.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom Nom" disabled={isLocked} {...field} />
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
                      <FormLabel>Entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Orylis" disabled={isLocked} {...field} />
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
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+33 6 00 00 00 00" disabled={isLocked} {...field} />
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
                      <FormLabel optional>Site actuel</FormLabel>
                      <FormControl>
                        <Input placeholder="https://votre-site.fr" disabled={isLocked} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2 */}
          {currentStepIndex === 1 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🎯</span>
                  Objectifs & vision
                </CardTitle>
                <CardDescription>
                  Partagez vos priorités pour que nous alignions design, contenu et stratégie.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quels sont vos objectifs ?</FormLabel>
                      <div className="grid gap-3 md:grid-cols-2">
                        {GOAL_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-accent",
                              field.value.includes(option.value) && "border-accent bg-accent/10"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border border-border"
                              value={option.value}
                              checked={field.value.includes(option.value)}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  field.onChange([...field.value, option.value]);
                                } else {
                                  field.onChange(field.value.filter((value) => value !== option.value));
                                }
                              }}
                              disabled={isLocked}
                            />
                            <span className="text-sm text-foreground">{option.label}</span>
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
                      <FormLabel optional>Précisions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Détaillez votre vision, vos KPIs, vos hypothèses..."
                          className="min-h-[140px]"
                          disabled={isLocked}
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

          {/* Step 3 */}
          {currentStepIndex === 2 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📄</span>
                  Structure de contenu
                </CardTitle>
                <CardDescription>
                  Identifiez les pages à prévoir et ajoutez vos sections personnalisées à produire.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={control}
                  name="pages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pages prévues</FormLabel>
                      <div className="grid gap-3 md:grid-cols-2">
                        {PAGE_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-accent",
                              field.value.includes(option.value) && "border-accent bg-accent/10"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border border-border"
                              value={option.value}
                              checked={field.value.includes(option.value)}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  field.onChange([...field.value, option.value]);
                                } else {
                                  field.onChange(field.value.filter((value) => value !== option.value));
                                }
                              }}
                              disabled={isLocked}
                            />
                            <span className="text-sm text-foreground">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <FormLabel>Pages personnalisées</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Ajoutez autant de pages spécifiques que nécessaire (ex&nbsp;: offres, cas clients,
                        landing).
                      </p>
                    </div>
                    {!isLocked && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => customPagesArray.append({ title: "", description: "" })}
                      >
                        Ajouter une page
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {customPagesArray.fields.length === 0 && (
                      <p className="text-sm text-muted-foreground/80">
                        Aucune page personnalisée pour le moment.
                      </p>
                    )}
                    {customPagesArray.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="space-y-4 rounded-2xl border border-border/70 bg-background/60 p-4"
                      >
                        <FormField
                          control={control}
                          name={`customPages.${index}.title`}
                          render={({ field: titleField }) => (
                            <FormItem>
                              <FormLabel>Titre</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex : Page Services marketing"
                                  disabled={isLocked}
                                  {...titleField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`customPages.${index}.description`}
                          render={({ field: descriptionField }) => (
                            <FormItem>
                              <FormLabel optional>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Notes sur le contenu, les sections, les CTA attendus…"
                                  className="min-h-[110px]"
                                  disabled={isLocked}
                                  {...descriptionField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {!isLocked && (
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => customPagesArray.remove(index)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Structure du site</p>
                  <div className="mt-1 space-y-1 text-sm text-foreground">
                    {form.getValues("pages").length === 0 &&
                      form.getValues("customPages").length === 0 ? (
                      <p>—</p>
                    ) : (
                      <>
                        {form.getValues("pages").map((page) => (
                          <p key={page}>
                            {PAGE_OPTIONS.find((option) => option.value === page)?.label ?? page}
                          </p>
                        ))}
                        {form.getValues("customPages").map((page, index) => (
                          <p key={`${page.title}-${index}`}>
                            {page.title || `Page personnalisée ${index + 1}`}
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                  {form.getValues("contentsNote") && (
                    <p className="mt-2 text-sm text-muted-foreground/80">
                      {form.getValues("contentsNote")}
                    </p>
                  )}
                </div>

                <FormField
                  control={control}
                  name="contentsNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Notes sur le contenu</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Contenus disponibles, points de vigilance, personnes impliquées..."
                          className="min-h-[140px]"
                          disabled={isLocked}
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

          {/* Step 4 */}
          {currentStepIndex === 3 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>💡</span>
                  Inspirations & concurrents
                </CardTitle>
                <CardDescription>
                  Partagez des références (design, fonctionnalités, positionnement) et concurrents à
                  surveiller.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <FormLabel>Inspirations (1 à {MAX_INSPIRATIONS})</FormLabel>
                  <div className="space-y-3">
                    {inspirationFields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={control}
                        name={`inspirations.${index}.value`}
                        render={({ field: inspirationField }) => (
                          <FormItem>
                            <div className="flex gap-3">
                              <FormControl>
                                <Input
                                  placeholder="Lien, référence ou note (ex : Dribbble, site, moodboard...)"
                                  disabled={isLocked}
                                  {...inspirationField}
                                />
                              </FormControl>
                              {inspirationFields.length > 1 && !isLocked && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => inspirationsArray.remove(index)}
                                >
                                  Supprimer
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  {!isLocked && inspirationFields.length < MAX_INSPIRATIONS && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => inspirationsArray.append({ value: "" })}
                    >
                      Ajouter une inspiration
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <FormLabel optional>Concurrents</FormLabel>
                  <div className="space-y-3">
                    {competitorFields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={control}
                        name={`competitors.${index}.value`}
                        render={({ field: competitorField }) => (
                          <FormItem>
                            <div className="flex gap-3">
                              <FormControl>
                                <Input
                                  placeholder="Nom, lien ou note (ex : Concurrent X, agence Y, etc.)"
                                  disabled={isLocked}
                                  {...competitorField}
                                />
                              </FormControl>
                              {!isLocked && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => competitorsArray.remove(index)}
                                >
                                  Supprimer
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  {!isLocked && competitorFields.length < MAX_COMPETITORS && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => competitorsArray.append({ value: "" })}
                    >
                      Ajouter un concurrent
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5 */}
          {currentStepIndex === 4 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⚙️</span>
                  Aspects techniques
                </CardTitle>
                <CardDescription>
                  Domaines, hébergement, contraintes techniques ou stack existante.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={control}
                  name="domainOwned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disposez-vous déjà du nom de domaine ?</FormLabel>
                      <div className="flex items-center gap-3">
                        <input
                          id="domain-owned"
                          type="checkbox"
                          className="h-4 w-4 rounded border border-border"
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                          disabled={isLocked}
                        />
                        <label htmlFor="domain-owned" className="text-sm text-foreground">
                          Oui, le domaine est déjà acheté et accessible.
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="domainName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de domaine (si disponible)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="exemple.com"
                          disabled={isLocked || !form.watch("domainOwned")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="hostingNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Notes d'hébergement & contraintes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Stack actuelle, accès serveurs, préférences techniques..."
                          className="min-h-[140px]"
                          disabled={isLocked}
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

          {/* Step 6 */}
          {currentStepIndex === 5 && (
            <Card className="border border-border/70 bg-white shadow-subtle">
              <CardHeader>
                <CardTitle>Validation finale</CardTitle>
                <CardDescription>
                  Vérifiez vos réponses puis validez l’onboarding pour lancer la phase Design.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Contact</p>
                    <p className="text-base text-foreground">{form.getValues("fullName") || "—"}</p>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues("company") || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues("phone") || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues("website") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Objectifs</p>
                    <ul className="mt-1 space-y-1 text-sm text-foreground">
                      {form.getValues("goals").length === 0 ? (
                        <li>—</li>
                      ) : (
                        form.getValues("goals").map((goal) => {
                          const option = GOAL_OPTIONS.find((item) => item.value === goal);
                          return <li key={goal}>{option?.label ?? goal}</li>;
                        })
                      )}
                    </ul>
                    {form.getValues("description") && (
                      <p className="mt-2 text-sm text-muted-foreground/80">
                        {form.getValues("description")}
                      </p>
                    )}
                  </div>
                </div>

                <FormField
                  control={control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label className="inline-flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border border-border"
                            checked={field.value}
                            onChange={(event) => field.onChange(event.target.checked)}
                            disabled={isLocked}
                          />
                          <span className="text-sm text-foreground">
                            Je confirme que les informations fournies sont exactes et j’autorise Orylis à
                            lancer la phase design.
                          </span>
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Étape {currentStepIndex + 1} sur {stepDefinitions.length}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePreviousStep}
                disabled={currentStepIndex === 0 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              {currentStepIndex < stepDefinitions.length - 1 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                >
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {currentStepIndex === stepDefinitions.length - 1 && (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !form.watch("confirm")}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isCompleted ? "Mise à jour…" : "Validation…"}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {isCompleted ? "Mettre à jour l'onboarding" : "Valider l'onboarding"}
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

function OnboardingCompletedView({
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

