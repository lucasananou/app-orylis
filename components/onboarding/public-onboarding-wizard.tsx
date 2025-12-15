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
    User,
    Star,
    Timer,
    ShieldCheck,
    Sparkles
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

// --- Components ---

const PROFESSIONS = [
    { label: "Couvreur", icon: "🏠" },
    { label: "Restaurateur", icon: "🍽️" },
    { label: "Plombier", icon: "💧" },
    { label: "Coach Sportif", icon: "💪" },
    { label: "Électricien", icon: "⚡" },
    { label: "Thérapeute", icon: "🧘" },
    { label: "Menuisier", icon: "🪚" },
    { label: "Avocat", icon: "⚖️" },
    { label: "Peintre", icon: "🎨" },
    { label: "Comptable", icon: "📊" },
    { label: "Paysagiste", icon: "🌿" },
    { label: "Architecte", icon: "📐" },
];

function ProfessionsMarquee() {
    return (
        <div className="w-full overflow-hidden bg-slate-50/50 py-3 border-y border-slate-100/50 mb-6">
            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-4 px-4">
                    {PROFESSIONS.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
                            <span>{p.icon}</span>
                            {p.label}
                        </span>
                    ))}
                    {/* Duplicated for smooth loop */}
                    {PROFESSIONS.map((p, i) => (
                        <span key={`dup-${i}`} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
                            <span>{p.icon}</span>
                            {p.label}
                        </span>
                    ))}
                    {PROFESSIONS.map((p, i) => (
                        <span key={`dup2-${i}`} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
                            <span>{p.icon}</span>
                            {p.label}
                        </span>
                    ))}
                </div>
            </div>
            <style jsx>{`
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
            `}</style>
        </div>
    );
}


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
        fields: ["firstName", "lastName", "email", "phone"],
        buttonLabel: "Valider mes coordonnées",
        badge: "🔒 Données sécurisées & confidentielles"
    },
    {
        id: "contact",
        label: "Vos coordonnées",
        description: "Parlez-nous de votre entreprise.",
        schema: ProspectContactSchema,
        fields: ["companyName", "activity"],
        buttonLabel: "Confirmer mon activité",
        badge: "✨ On avance bien !"
    },
    {
        id: "goals",
        label: "Vos objectifs",
        description: "Quel est le but de votre site ?",
        schema: ProspectGoalSchema,
        fields: ["siteGoal", "siteGoalOther"],
        buttonLabel: "Définir mes objectifs",
        badge: "🎯 Objectifs clairs = Réussite assurée"
    },

    {
        id: "style",
        label: "Vos préférences",
        description: "Quel style vous correspond ?",
        schema: ProspectStyleSchema,
        fields: ["preferredStyles"],
        buttonLabel: "Valider ce style",
        badge: "🎨 Le design commence ici"
    },

    {
        id: "branding",
        label: "Votre image",
        description: "Avez-vous déjà une identité visuelle ?",
        schema: ProspectBrandingSchema,
        fields: ["primaryColor", "logoUrl"],
        buttonLabel: "Enregistrer ma marque",
        badge: "💎 Une identité unique pour vous"
    },
    {
        id: "message",
        label: "Votre message",
        description: "Personnalisez l'accueil de votre site.",
        schema: ProspectMessageSchema,
        fields: ["welcomePhrase", "mainServices"],
        buttonLabel: "Sauvegarder mon contenu",
        badge: "✍️ Votre touche personnelle"
    },
    {
        id: "infos",
        label: "Derniers détails",
        description: "Avez-vous autre chose à nous dire ?",
        schema: ProspectInfoSchema,
        fields: ["importantInfo"],
        buttonLabel: "Finaliser ma demande",
        badge: "🚀 Dernière ligne droite !"
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

        // Clear errors for current step fields
        definition.fields.forEach((field) => {
            form.clearErrors(field as any);
            // Also clear potential array errors
            if (field === "mainServices") {
                form.clearErrors("mainServices.0" as any);
                form.clearErrors("mainServices.1" as any);
                form.clearErrors("mainServices.2" as any);
            }
        });
        return true;
    };

    const autoSave = async (stepIndex: number) => {
        const values = form.getValues();
        if (!values.email) return; // Need email to save draft

        try {
            await fetch("/api/public-onboarding/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    step: stepIndex
                })
            });
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    };

    const handleNextStep = () => {
        if (!validateStep(currentStepIndex)) return;

        // Show encouragement toast if badge exists for this step
        const stepBadge = (stepDefinitions[currentStepIndex] as any).badge;
        if (stepBadge) {
            toast.success(stepBadge, {
                icon: "👏",
                duration: 3000,
                className: "bg-white border-2 border-blue-100 text-blue-800 font-medium"
            });
        }

        // Auto-save before moving
        autoSave(currentStepIndex);

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
            try {
                const signInResult = await signIn("credentials", {
                    email: payload.email,
                    password: data.password,
                    redirect: false
                });

                if (signInResult?.error) {
                    console.warn("Auto-login error (logic):", signInResult.error);
                    toast.success("Compte créé ! Veuillez vous connecter.");
                    router.push("/login");
                } else {
                    toast.success("Compte créé avec succès !");
                    router.push("/");
                }
            } catch (signInError) {
                console.error("Auto-login error (exception):", signInError);
                // Even if auto-login crashes, the account IS created.
                // Redirect to login with a success message.
                toast.success("Compte créé ! Connectez-vous maintenant.");
                router.push(("/login?email=" + encodeURIComponent(payload.email)) as any);
            }
        } catch (error) {
            console.error("Registration error:", error);
            // This catches errors from step 1 (API call), not step 2 (signIn) which is now handled.
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
                    className="h-full bg-[#0166ff] transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            <div className="mx-auto w-full max-w-2xl flex-1 py-12 px-4">
                <Form form={form} onSubmit={(event) => event.preventDefault()}>
                    <div className="space-y-8">

                        {/* Header - Hidden for welcome step as it has its own hero */}
                        {currentStep.id !== "welcome" && (
                            <div className="text-center space-y-3 mb-8">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
                                        Étape {currentStepIndex} / {stepDefinitions.length - 1}
                                    </div>
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                    {currentStep.label}
                                </h2>
                                <p className="text-lg text-slate-500 max-w-lg mx-auto">
                                    {currentStep.description}
                                </p>
                            </div>
                        )}

                        {/* Steps Content */}
                        <div className="min-h-[300px]">
                            {currentStep.id === "welcome" && (
                                <div className="space-y-8 py-4">
                                    {/* Hero Section */}
                                    <div className="text-center space-y-6">
                                        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-2">
                                            <Sparkles className="h-8 w-8 text-blue-600" />
                                        </div>

                                        <div className="space-y-4 max-w-lg mx-auto">
                                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                                Votre Démo Personnalisée <br />
                                                <span className="text-blue-600">en 4 étapes simples</span>
                                            </h1>
                                            <p className="text-lg text-slate-600 leading-relaxed">
                                                Obtenez une analyse experte et découvrez comment Orylis peut transformer votre activité, sans aucun engagement.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Professions Marquee */}
                                    <ProfessionsMarquee />

                                    {/* Value Props Grid */}
                                    <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-2 transition-all hover:bg-white hover:shadow-md hover:border-blue-100">
                                            <div className="bg-white p-2 rounded-full shadow-sm">
                                                <Timer className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <h3 className="font-bold text-slate-900">Rapide</h3>
                                            <p className="text-sm text-slate-500">Moins de 2 minutes chrono</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-2 transition-all hover:bg-white hover:shadow-md hover:border-blue-100">
                                            <div className="bg-white p-2 rounded-full shadow-sm">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            </div>
                                            <h3 className="font-bold text-slate-900">Gratuit</h3>
                                            <p className="text-sm text-slate-500">Aucun engagement requis</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-2 transition-all hover:bg-white hover:shadow-md hover:border-blue-100">
                                            <div className="bg-white p-2 rounded-full shadow-sm">
                                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <h3 className="font-bold text-slate-900">Privé</h3>
                                            <p className="text-sm text-slate-500">Vos données sont sécurisées</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 flex flex-col items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {[
                                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64",
                                                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64",
                                                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64",
                                                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64"
                                            ].map((url, i) => (
                                                <div key={i} className="h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center overflow-hidden">
                                                    <img src={url} alt="User" className="h-full w-full object-cover" />
                                                </div>
                                            ))}
                                            <div className="h-8 w-8 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                                +500
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                                            <div className="flex text-amber-400">
                                                <Star className="h-4 w-4 fill-current" />
                                                <Star className="h-4 w-4 fill-current" />
                                                <Star className="h-4 w-4 fill-current" />
                                                <Star className="h-4 w-4 fill-current" />
                                                <Star className="h-4 w-4 fill-current" />
                                            </div>
                                            <span className="ml-1">Plébiscité par les professionnels</span>
                                        </div>
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
                        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white p-4 sm:static sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-10">
                            <div className="mx-auto max-w-2xl">
                                {currentStep.id === "welcome" ? (
                                    /* Welcome Step - Centered CTA */
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Button
                                            type="button"
                                            size="lg"
                                            onClick={handleNextStep}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto min-w-[280px] h-14 rounded-full text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all bg-[#0166ff] hover:bg-[#0055d4]"
                                        >
                                            Demander ma démo gratuitement
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Aucune carte bancaire nécessaire
                                        </p>
                                    </div>
                                ) : (
                                    /* Form Steps - Structured Split Layout */
                                    <div className="flex items-center justify-between w-full">
                                        {/* Left: Back Button */}
                                        <div className="w-1/3 flex justify-start">
                                            {currentStepIndex > 0 ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={handlePreviousStep}
                                                    disabled={isSubmitting}
                                                    className="pl-0 hover:bg-transparent text-slate-500 hover:text-slate-900 font-medium text-base"
                                                >
                                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                                    Retour
                                                </Button>
                                            ) : (
                                                <div />
                                            )}
                                        </div>

                                        {/* Right: Next Button */}
                                        <div className="w-2/3 flex justify-end">
                                            {currentStepIndex < stepDefinitions.length - 1 ? (
                                                <Button
                                                    type="button"
                                                    size="lg"
                                                    onClick={handleNextStep}
                                                    disabled={isSubmitting}
                                                    className="rounded-full px-8 h-12 text-base shadow-lg shadow-blue-500/20 bg-[#0166ff] hover:bg-[#0055d4]"
                                                >
                                                    {(currentStep as any).buttonLabel || "Continuer"}
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="lg"
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting}
                                                    className="rounded-full px-8 h-12 text-base shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700"
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
                                )}
                            </div>
                        </div>

                    </div>
                </Form>
            </div >
        </div >
    );
}
