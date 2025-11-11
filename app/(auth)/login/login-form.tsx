"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Loader2, Mail } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/lib/zod-schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function LoginForm() {
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

      toast.success("Lien envoyé ! Vérifie ta boîte mail.");
      form.reset();
    });
  };

  return (
    <Form form={form} className="w-full space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email professionnel</FormLabel>
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
            Envoyer le lien de connexion
          </>
        )}
      </Button>
    </Form>
  );
}

