"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { Loader2, Mail, UserPlus, Shield } from "lucide-react";
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
  fullName: z.string().optional(),
  phone: z
    .string()
    .min(1, { message: "Le numéro de téléphone est obligatoire." })
    .regex(/^[0-9 +().-]*$/, { message: "Format de téléphone invalide." })
    .max(30, { message: "Numéro trop long (30 caractères max)." })
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupCard() {
  const router = useRouter();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      fullName: "",
      phone: ""
    }
  });

  const [isSubmitting, startTransition] = React.useTransition();

  // Point d'extension pour tracking (à utiliser plus tard)
  React.useEffect(() => {
    // TODO: Événement "signup_start" pour tracking
    // Exemple: trackEvent("signup_start");
  }, []);

  const handleSubmit = (values: SignupFormValues) => {
    startTransition(async () => {
      try {
        // Créer le compte
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            // On ne transmet plus de mot de passe, il sera généré côté serveur
            fullName: values.fullName || undefined,
            phone: values.phone
          })
        });

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          toast.error(signupData.error || "Une erreur est survenue lors de l'inscription.");
          return;
        }

        // Connecter automatiquement l'utilisateur
        const effectivePassword: string | undefined = signupData.password;

        const result = await signIn("credentials", {
          email: values.email,
          password: effectivePassword,
          redirect: false,
          callbackUrl: "/onboarding"
        });

        if (result?.error) {
          toast.error("Compte créé mais connexion échouée. Veuillez vous connecter manuellement.");
          router.push("/login");
          return;
        }

        // TODO: Événement "signup_submit_success" pour tracking
        // Exemple: trackEvent("signup_submit_success", { userId: signupData.userId });

        toast.success("Compte créé avec succès ! Redirection vers l'onboarding...");
        router.replace("/onboarding");
        router.refresh();
      } catch (error) {
        console.error("[Signup] Error:", error);
        toast.error("Une erreur est survenue. Veuillez réessayer.");
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6 md:p-8 lg:p-10 md:shadow-xl lg:sticky lg:top-8 min-w-0 max-w-full">
      <div className="mb-6 space-y-1.5 sm:mb-8 sm:space-y-2">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Débloquez votre démo personnalisée</h2>
        <p className="text-xs text-slate-600 sm:text-sm">
          Cet accès nous permet de vous créer une démo adaptée à votre activité.
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
                    className="pl-10"
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
              <FormLabel>Nom complet (optionnel)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Prénom Nom"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField<SignupFormValues, "phone">
          control={form.control}
          name="phone"
          render={({
            field
          }: {
            field: ControllerRenderProps<SignupFormValues, "phone">;
          }) => (
            <FormItem>
              <FormLabel>Numéro de téléphone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder="+33 6 12 34 56 78"
                  disabled={isSubmitting}
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
              Création du compte…
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Je demande ma démo gratuitement
            </>
          )}
        </Button>

        {/* Rappel "Sans engagement" sous le CTA */}
        <p className="text-center text-xs font-medium text-slate-500">
          100% gratuit — aucun engagement
        </p>

        <p className="text-center text-xs text-slate-600 sm:text-sm">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Se connecter
          </Link>
        </p>

        {/* Réassurance */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 sm:space-y-2">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span>Données sécurisées — aucune carte bancaire demandée.</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span>
              Besoin d&apos;aide ?{" "}
              <a
                href="mailto:hello@orylis.fr"
                className="font-medium text-accent hover:underline"
              >
                Contactez-nous à hello@orylis.fr
              </a>
            </span>
          </p>
        </div>

        <p className="text-center text-xs text-slate-500">
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
      </Form>
    </div>
  );
}

