"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import {
  loginSchema,
  passwordLoginSchema,
  type LoginFormValues,
  type PasswordLoginFormValues
} from "@/lib/zod-schemas";
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

export function MagicLinkLoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: ""
    }
  });

  const [isSubmitting, startTransition] = React.useTransition();

  const handleSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      const result = await signIn("email", {
        email: values.email,
        redirect: false,
        callbackUrl: "/"
      });

      if (result?.error) {
        toast.error("Impossible d’envoyer le lien. Réessayez plus tard.");
        return;
      }

      toast.success("Lien magique envoyé ! Consulte ta boîte mail.");
      form.reset();
    });
  };

  return (
    <Form form={form} className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <FormField<LoginFormValues, "email">
        control={form.control}
        name="email"
        render={({ field }: { field: ControllerRenderProps<LoginFormValues, "email"> }) => (
          <FormItem>
            <FormLabel>Adresse email</FormLabel>
            <FormControl>
              <Input
                autoComplete="email"
                inputMode="email"
                placeholder="vous@entreprise.fr"
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
        className="w-full"
        disabled={isSubmitting || !form.formState.isValid}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Envoi en cours…
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Recevoir un lien de connexion
          </>
        )}
      </Button>
    </Form>
  );
}

export function PasswordLoginForm() {
  const router = useRouter();
  const form = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const [isSubmitting, startTransition] = React.useTransition();

  const handleSubmit = (values: PasswordLoginFormValues) => {
    startTransition(async () => {
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
        callbackUrl: "/"
      });

      if (result?.error) {
        toast.error("Email ou mot de passe invalide.");
        return;
      }

      toast.success("Connexion réussie. Bienvenue !");
      form.reset();
      router.replace("/");
      router.refresh();
    });
  };

  return (
    <Form form={form} className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <FormField<PasswordLoginFormValues, "email">
        control={form.control}
        name="email"
        render={({ field }: { field: ControllerRenderProps<PasswordLoginFormValues, "email"> }) => (
          <FormItem>
            <FormLabel>Adresse e-mail</FormLabel>
            <FormControl>
              <Input
                autoComplete="email"
                inputMode="email"
                placeholder="vous@entreprise.fr"
                disabled={isSubmitting}
                className="h-11 placeholder:text-slate-400"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<PasswordLoginFormValues, "password">
        control={form.control}
        name="password"
        render={({
          field
        }: {
          field: ControllerRenderProps<PasswordLoginFormValues, "password">;
        }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Mot de passe</FormLabel>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <FormControl>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isSubmitting}
                className="h-11 placeholder:text-slate-400"
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
        className="h-11 w-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
        disabled={isSubmitting || !form.formState.isValid}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connexion…
          </>
        ) : (
          <>
            <LockKeyhole className="mr-2 h-4 w-4" />
            Se connecter
          </>
        )}
      </Button>

      {/* Google Login Removed by user request */}
    </Form>
  );
}

