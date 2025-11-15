"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { Loader2, LockKeyhole, Mail, UserPlus } from "lucide-react";
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

export function SignupForm() {
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
    <Form form={form} className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <FormField<SignupFormValues, "email">
        control={form.control}
        name="email"
        render={({ field }: { field: ControllerRenderProps<SignupFormValues, "email"> }) => (
          <FormItem>
            <FormLabel>Adresse e-mail</FormLabel>
            <FormControl>
              <Input
                autoComplete="email"
                inputMode="email"
                placeholder="vous@entreprise.fr"
                disabled={isSubmitting}
                className="placeholder:text-[#9CA3AF]"
                {...field}
              />
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
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={isSubmitting}
                className="placeholder:text-[#9CA3AF]"
                {...field}
              />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              Minimum 8 caractères
            </p>
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
                className="placeholder:text-[#9CA3AF]"
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
                className="placeholder:text-[#9CA3AF]"
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
        className="w-full bg-[#1F66FF] text-white transition-all duration-200 hover:bg-[#1553CC] hover:shadow-md"
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
      <p className="text-center text-xs text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </Form>
  );
}

