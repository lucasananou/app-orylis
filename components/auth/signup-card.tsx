"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { Loader2, Mail, UserPlus, Clock, Euro, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

const signupFormSchema = z.object({
  email: z.string().email({ message: "Merci d'entrer un email valide." }),
  // Mot de passe supprimé du formulaire (généré serveur)
  fullName: z.string().optional()
  // Téléphone supprimé - sera demandé à l'onboarding pour réduire la friction
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupCard() {
  const router = useRouter();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      fullName: ""
    }
  });

  const [isSubmitting, startTransition] = React.useTransition();
  const [loadingStep, setLoadingStep] = React.useState<string>("");

  // Point d'extension pour tracking (à utiliser plus tard)
  React.useEffect(() => {
    // TODO: Événement "signup_start" pour tracking
    // Exemple: trackEvent("signup_start");
  }, []);

  const handleSubmit = (values: SignupFormValues) => {
    startTransition(async () => {
      try {
        // Étape 1 : Création de l'espace sécurisé
        setLoadingStep("Création de votre espace sécurisé...");
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Créer le compte
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            // On ne transmet plus de mot de passe, il sera généré côté serveur
            fullName: values.fullName || undefined
            // Téléphone supprimé - sera demandé à l'onboarding
          })
        });

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          setLoadingStep("");
          toast.error(signupData.error || "Une erreur est survenue lors de l'inscription.");
          return;
        }

        // Étape 2 : Connexion
        setLoadingStep("Connexion aux serveurs Orylis...");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Connecter automatiquement l'utilisateur
        const effectivePassword: string | undefined = signupData.password;

        const result = await signIn("credentials", {
          email: values.email,
          password: effectivePassword,
          redirect: false,
          callbackUrl: "/onboarding"
        });

        if (result?.error) {
          setLoadingStep("");
          toast.error("Compte créé mais connexion échouée. Veuillez vous connecter manuellement.");
          router.push("/login");
          return;
        }

        // Étape 3 : Redirection
        setLoadingStep("En route vers votre futur site...");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // TODO: Événement "signup_submit_success" pour tracking
        // Exemple: trackEvent("signup_submit_success", { userId: signupData.userId });

        toast.success("Compte créé avec succès !");
        router.replace("/onboarding");
        router.refresh();
      } catch (error) {
        setLoadingStep("");
        console.error("[Signup] Error:", error);
        toast.error("Une erreur est survenue. Veuillez réessayer.");
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6 md:p-8 lg:p-10 md:shadow-xl lg:sticky lg:top-8 min-w-0 max-w-full">
      {/* Bloc mobile : promesse + puces rassurantes (visible uniquement sur mobile) */}
      <div className="mb-6 space-y-3 lg:hidden">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Votre futur site en 24h — gratuit</h2>
        </div>
        <div className="space-y-2 rounded-lg bg-slate-50/50 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Clock className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span>2 minutes pour remplir le formulaire</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Euro className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span>À partir de 1490 € le site complet</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Aucun appel commercial forcé</span>
          </div>
        </div>
      </div>

      {/* Titre desktop (visible uniquement sur desktop) */}
      <div className="mb-6 hidden space-y-1.5 lg:mb-8 lg:block lg:space-y-2">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Recevez votre démo en 24h</h2>
        <p className="text-xs text-slate-600 sm:text-sm">
          ⏱️ 2 minutes à remplir – 100% gratuit – aucun engagement
        </p>
      </div>

      <Form form={form} className="space-y-4 sm:space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField<SignupFormValues, "email">
          control={form.control}
          name="email"
          render={({ field }: { field: ControllerRenderProps<SignupFormValues, "email"> }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    autoComplete="email"
                    inputMode="email"
                    placeholder="vous@entreprise.fr"
                    disabled={isSubmitting}
                    className="pl-10 text-base sm:text-sm"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField<SignupFormValues, "fullName">
          control={form.control}
          name="fullName"
          render={({
            field
          }: {
            field: ControllerRenderProps<SignupFormValues, "fullName">;
          }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input
                  placeholder="Prénom Nom"
                  disabled={isSubmitting}
                  className="text-base sm:text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full bg-[#1b5bff] text-white transition-all duration-200 hover:bg-[#1553e6] hover:shadow-lg hover:shadow-[#1b5bff]/25"
          disabled={isSubmitting || !form.formState.isValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingStep || "Préparation..."}
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Voir mon futur site gratuitement
            </>
          )}
        </Button>

        {/* Message de réassurance sous le CTA - Desktop */}
        <p className="hidden text-center text-xs font-medium text-slate-600 lg:block">
          🔥 Votre démo est livrée directement dans votre espace client, prête à être mise en production si vous la validez.
        </p>

        {/* Message de réassurance sous le CTA - Mobile (version punchy) */}
        <p className="text-center text-xs font-medium text-slate-600 lg:hidden">
          Vous recevez un site WordPress complet, personnalisé pour votre activité — pas un template générique.
        </p>

      </Form>

      {/* Section "Comment ça marche" - Desktop : juste après le CTA */}
      <div className="mt-6 hidden space-y-3 rounded-lg border border-slate-200 bg-slate-50/30 p-4 lg:block lg:mt-4">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Comment ça marche ?</h3>
        <p className="text-xs text-slate-600 sm:text-sm">
          🎯 Process simple, rapide et pensé pour vous faire gagner du temps.
        </p>
        <ol className="space-y-2.5 text-xs text-slate-700 sm:text-sm">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              1
            </span>
            <span>Vous répondez aux questions essentielles pour personnaliser votre futur site</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              2
            </span>
            <span>On crée un site WordPress de démo adapté à votre activité</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              3
            </span>
            <span>Vous découvrez le résultat en ligne + on voit ensemble comment le mettre en production</span>
          </li>
        </ol>
      </div>

      {/* Section "Comment ça marche" - Mobile : à la fin */}
      <div className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50/30 p-4 sm:mt-8 sm:p-5 lg:hidden">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Comment ça marche ?</h3>
        <p className="text-xs text-slate-600 sm:text-sm">
          🎯 Process simple, rapide et pensé pour vous faire gagner du temps.
        </p>
        <ol className="space-y-2.5 text-xs text-slate-700 sm:text-sm">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              1
            </span>
            <span>Vous répondez aux questions essentielles pour personnaliser votre futur site</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              2
            </span>
            <span>On crée un site WordPress de démo adapté à votre activité</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              3
            </span>
            <span>Vous découvrez le résultat en ligne + on voit ensemble comment le mettre en production</span>
          </li>
        </ol>
      </div>

      {/* Réassurance */}
      <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 sm:space-y-2 sm:pt-5">
        <p className="text-xs text-slate-500">
          🔐 Données sécurisées — aucune carte bancaire demandée.
        </p>
        <p className="text-xs text-slate-500">
          Besoin d&apos;aide ?{" "}
          <a
            href="mailto:contact@orylis.fr"
            className="font-medium text-accent hover:underline"
          >
            contact@orylis.fr
          </a>
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        En créant un compte, vous acceptez nos{" "}
        <a
          href="https://orylis.fr/mentions-legales"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:underline"
        >
          conditions d&apos;utilisation
        </a>
      </p>
    </div>
  );
}

