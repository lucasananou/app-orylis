"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { Loader2, LockKeyhole, Mail, UserPlus, Shield } from "lucide-react";
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
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
    .max(128, { message: "Le mot de passe est trop long." }),
  fullName: z.string().optional(),
  company: z.string().optional()
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupCard() {
  const router = useRouter();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      company: ""
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
            password: values.password,
            fullName: values.fullName || undefined,
            company: values.company || undefined
          })
        });

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          toast.error(signupData.error || "Une erreur est survenue lors de l'inscription.");
          return;
        }

        // Connecter automatiquement l'utilisateur
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
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
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg sm:p-10 md:shadow-xl lg:sticky lg:top-8">
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">Créer votre espace Orylis</h2>
        <p className="text-sm text-slate-600">
          Remplissez le formulaire ci-dessous pour commencer votre projet.
        </p>
      </div>

      <Form form={form} className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
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

        <FormField<SignupFormValues, "password">
          control={form.control}
          name="password"
          render={({
            field
          }: {
            field: ControllerRenderProps<SignupFormValues, "password">;
          }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-slate-500">Minimum 8 caractères</p>
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

        <FormField<SignupFormValues, "company">
          control={form.control}
          name="company"
          render={({
            field
          }: {
            field: ControllerRenderProps<SignupFormValues, "company">;
          }) => (
            <FormItem>
              <FormLabel>Entreprise (optionnel)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nom de votre entreprise"
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
          className="w-full bg-[#1F66FF] text-white transition-all duration-200 hover:bg-[#1553CC] hover:shadow-lg hover:shadow-blue-500/25"
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
              Créer mon espace
            </>
          )}
        </Button>

        {/* Rappel "Sans engagement" sous le CTA */}
        <p className="text-center text-xs font-medium text-slate-500">
          100% gratuit — aucun engagement
        </p>

        <p className="text-center text-sm text-slate-600">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Se connecter
          </Link>
        </p>

        {/* Réassurance */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>Données sécurisées — aucune carte bancaire demandée.</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5 shrink-0" />
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

