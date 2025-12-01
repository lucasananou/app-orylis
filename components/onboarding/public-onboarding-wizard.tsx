"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Upload,
    X,
    ClipboardList,
    User
} from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ProspectContactSchema,
    ProspectGoalSchema,
    ProspectInspirationSchema,
    ProspectStyleSchema,
    ProspectIdentitySchema,
    ProspectBrandingSchema,
    ProspectMessageSchema,
    ProspectInfoSchema,
    PublicIdentitySchema,
    PublicOnboardingSchema
} from "@/lib/zod-schemas";

// --- Types & Schemas ---

type PublicOnboardingFormState = z.infer<typeof PublicOnboardingSchema>;

const SITE_GOAL_OPTIONS = [
    { value: "present_services", label: "Présenter mes services" },
    { value: "get_contacts", label: "Obtenir des contacts / devis" },
    { value: "sell_online", label: "Vendre en ligne" },
    { value: "optimize_image", label: "Optimiser mon image de marque" },
    { value: "other", label: "Autre" }
];

const STYLE_OPTIONS = [
    { value: "simple_minimalist", label: "Simple & Minimaliste" },
    { value: "modern_dynamic", label: "Moderne & Dynamique" },
    { value: "luxury_elegant", label: "Luxe & Élégant" },
    { value: "colorful_creative", label: "Coloré & Créatif" },
    { value: "professional_serious", label: "Professionnel & Sérieux" },
    { value: "not_sure", label: "Je ne sais pas encore" }
];

// --- Step Definitions ---

const stepDefinitions = [
    {
        id: "welcome",
        label: "Bienvenue",
        description: "Commençons par faire connaissance.",
        schema: z.object({}), // No validation needed for welcome
        fields: []
    },
    {
        id: "identity",
        label: "Votre identité",
        description: "Dites-nous qui vous êtes.",
        schema: PublicIdentitySchema,
        fields: ["firstName", "lastName", "email"]
    },
    {
        id: "contact",
        label: "Vos coordonnées",
        description: "Parlez-nous de votre entreprise.",
        schema: ProspectContactSchema,
        fields: ["companyName", "activity", "phone"]
    },
    {
        id: "goals",
        label: "Vos objectifs",
        description: "Quel est le but principal de votre futur site ?",
        schema: ProspectGoalSchema,
        fields: ["siteGoal", "siteGoalOther"]
    },

    {
        id: "style",
        label: "Votre style",
        description: "Quelle ambiance souhaitez-vous donner à votre site ?",
        schema: ProspectStyleSchema,
        fields: ["preferredStyles"]
    },

    {
        id: "branding",
        label: "Vos éléments",
        description: "Partagez votre logo et vos couleurs si vous en avez.",
        schema: ProspectBrandingSchema,
        fields: ["primaryColor", "logoUrl"]
    },
    {
        id: "message",
        label: "Votre site arrive bientôt !",
        description: "Comment souhaitez-vous accueillir vos visiteurs ?",
        schema: ProspectMessageSchema,
        fields: ["welcomePhrase", "mainServices"]
    },
    {
        id: "infos",
        label: "Infos complémentaires",
        description: "D'autres précisions utiles pour notre équipe ?",
        schema: ProspectInfoSchema,
        fields: ["importantInfo"]
    }
];

export function PublicOnboardingWizard() {
    const router = useRouter();
    const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
    const [isCompleted, setIsCompleted] = React.useState(false);

    const form = useForm<PublicOnboardingFormState>({
        resolver: zodResolver(PublicOnboardingSchema),
        mode: "onChange",
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            companyName: "",
            activity: "",
            phone: "",
            siteGoal: [],
            siteGoalOther: "",
            inspirationUrls: ["", "", ""],
            preferredStyles: [],
            primaryColor: "#43b2b9",
            logoUrl: "",
            hasVisualIdentity: "not_yet", // Default
            welcomePhrase: "",
            mainServices: ["", "", ""],
            importantInfo: ""
        }
    });

    const { control, formState: { errors } } = form;

    const mainServicesArray = { fields: [0, 1, 2].map(i => ({ id: i })) }; // Mock field array

    // --- Handlers ---

    const handleLogoUpload = async (file: File) => {
        setIsUploadingLogo(true);
        try {
            // 1. Get Signed URL (Public endpoint needed? Or reuse existing if public allowed? 
            // Actually, existing endpoint requires auth. 
            // For now, let's assume we can't upload without auth or we need a public upload endpoint.
            // To keep it simple for this MVP, we might skip logo upload or use a public placeholder logic.
            // BUT, the user wants "frictionless".
            // Let's try to use the existing endpoint, but it will fail if not logged in.
            // WORKAROUND: For public onboarding, maybe skip logo upload or use a public bucket?
            // Or just let them paste a URL.
            // I will disable file upload for now and only allow URL, or warn them.
            // Actually, I'll just show a toast saying "Upload unavailable in quick mode" if it fails.

            // Better: Just let them paste URL for now.
            toast.info("L'upload de fichier n'est pas disponible dans ce mode rapide. Vous pourrez l'ajouter plus tard.");

        } catch (error) {
            toast.error("Erreur lors de l'upload.");
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const setSchemaErrors = (result: z.SafeParseReturnType<unknown, unknown>) => {
        if (result.success) return;
        const fieldErrors = result.error.flatten().fieldErrors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
            const items = Array.isArray(messages) ? messages : [];
            if (items.length === 0) return;
            form.setError(field as any, { type: "manual", message: items[0] });
        });
    };

    const validateStep = (index: number) => {
        const definition = stepDefinitions[index];
        if (definition.id === "welcome") return true;

        const values = form.getValues();
        let stepPayload: Record<string, unknown> = {};

        // Map fields to payload for validation
        definition.fields.forEach(field => {
            // @ts-ignore
            stepPayload[field] = values[field as keyof PublicOnboardingFormState];
        });

        // Special handling for arrays/objects if needed (similar to ProspectWizard)


        const result = definition.schema.safeParse(stepPayload);
        if (!result.success) {
            setSchemaErrors(result);
            toast.error("Merci de compléter les informations requises avant de continuer.");
            return false;
        }

        definition.fields.forEach((field) => form.clearErrors(field as any));
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

    const handleSubmit = async () => {
        const lastIndex = stepDefinitions.length - 1;
        if (!validateStep(lastIndex)) return;

        setIsSubmitting(true);
        try {
            const payload = form.getValues();

            // 1. Call Public API
            const response = await fetch("/api/public-onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Une erreur est survenue.");
            }

            // 2. Auto Login
            const signInResult = await signIn("credentials", {
                email: payload.email,
                password: data.password, // Use the password returned by API (generated)
                redirect: false
            });

            if (signInResult?.error) {
                toast.error("Compte créé, mais échec de la connexion automatique. Veuillez vous connecter.");
                router.push("/auth/login" as any);
            } else {
                toast.success("Compte créé avec succès ! Redirection...");
                router.push("/");
            }

            setIsCompleted(true);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
            setIsSubmitting(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-bold">Redirection en cours...</h2>
            </div>
        );
    }

    const currentStep = stepDefinitions[currentStepIndex];
    const progressPercentage = ((currentStepIndex) / (stepDefinitions.length - 1)) * 100;

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* Progress Bar */}
            <div className="fixed left-0 top-0 z-50 h-2 w-full bg-slate-100">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            <div className="mx-auto w-full max-w-2xl flex-1 py-12 px-4">
                <Form form={form} onSubmit={(event) => event.preventDefault()}>
                    <div className="space-y-8">

                        {/* Header */}
                        <div className="text-center space-y-2 mb-8">

                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                {currentStep.label}
                            </h2>
                            <p className="text-lg text-slate-500 max-w-lg mx-auto">
                                {currentStep.description}
                            </p>
                        </div>

                        {/* Steps Content */}
                        <div className="min-h-[300px]">
                            {currentStep.id === "welcome" && (
                                <div className="text-center space-y-6 py-8">
                                    <div className="mx-auto h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center">
                                        <ClipboardList className="h-12 w-12 text-blue-600" />
                                    </div>
                                    <div className="space-y-4 max-w-lg mx-auto">
                                        <h1 className="text-2xl font-bold text-slate-900">
                                            Lancez votre projet dès maintenant 🚀
                                        </h1>
                                        <p className="text-lg text-slate-600">
                                            Complétez ce formulaire pour créer votre compte et recevoir votre démo personnalisée sous 24h.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep.id === "identity" && (
                                <div className="grid gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base">Prénom</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 text-base" placeholder="Jean" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base">Nom</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 text-base" placeholder="Dupont" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Email professionnel</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-base" type="email" placeholder="jean@entreprise.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                                    <Input className="h-12 text-base" placeholder="Ma Société" {...field} />
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
                                                    <Input className="h-12 text-base" placeholder="Ex : traiteur, coach..." {...field} />
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
                                                <FormLabel className="text-base">Numéro de téléphone</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-base" type="tel" placeholder="+33 6..." {...field} />
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
                                                                field.value.includes(option.value as any) && "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                value={option.value}
                                                                checked={field.value.includes(option.value as any)}
                                                                onChange={(event) => {
                                                                    if (event.target.checked) {
                                                                        field.onChange([...field.value, option.value]);
                                                                    } else {
                                                                        field.onChange(field.value.filter((value: string) => value !== option.value));
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
                                                                field.value.includes(option.value as any) && "border-blue-500 bg-blue-50 text-blue-700"
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only"
                                                                value={option.value}
                                                                checked={field.value.includes(option.value as any)}
                                                                onChange={(event) => {
                                                                    if (event.target.checked) {
                                                                        field.onChange([...field.value, option.value]);
                                                                    } else {
                                                                        field.onChange(field.value.filter((value: string) => value !== option.value));
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
                                                <FormLabel className="text-base" optional>Logo (URL)</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-base" placeholder="https://..." {...field} />
                                                </FormControl>
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
                                                    <Input placeholder={`Service ${index + 1}`} className="h-12 text-base" {...field} />
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
                                                        placeholder='Ex : "Je veux un site simple"...'
                                                        className="min-h-[120px] p-4 text-base"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white p-4 sm:static sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-8">
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
                                            Valider & Créer
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </Form>
            </div>
        </div>
    );
}
