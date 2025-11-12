"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import {
  clientCreateFormSchema,
  type ClientCreateFormValues
} from "@/lib/zod-schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
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

interface ClientCreateDialogProps {
  trigger?: React.ReactNode;
}

function generatePassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$&";
  const array = new Uint32Array(length);
  if (typeof window !== "undefined" && "crypto" in window && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i += 1) {
      array[i] = Math.floor(Math.random() * alphabet.length);
    }
  }
  return Array.from(array, (value) => alphabet[value % alphabet.length]).join("");
}

export function ClientCreateDialog({ trigger }: ClientCreateDialogProps): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<ClientCreateFormValues>({
    resolver: zodResolver(clientCreateFormSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      passwordConfirm: ""
    }
  });

  const handleGeneratePassword = React.useCallback(() => {
    const value = generatePassword();
    form.setValue("password", value, { shouldValidate: true });
    form.setValue("passwordConfirm", value, { shouldValidate: true });
  }, [form]);

  const handleSubmit = (values: ClientCreateFormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName: values.fullName || undefined,
            email: values.email,
            password: values.password
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Création du client impossible.");
        }

        const payload = await response.json().catch(() => null);
        const projectMessage = payload?.projectName
          ? `Projet "${payload.projectName}" créé automatiquement.`
          : "";
        toast.success("Client créé avec succès.", {
          description: projectMessage || undefined
        });
        if (payload?.emailSent === false && payload?.emailMessage) {
          toast("Email non envoyé automatiquement", {
            description: payload.emailMessage
          });
        }

        form.reset();
        setOpen(false);
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error ? error.message : "Impossible de créer le client.";
        toast.error(message);
      }
    });
  };

  const isPending = isSubmitting || form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="lg" className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un compte client</DialogTitle>
          <DialogDescription>
            Génère l’accès d’un nouveau client. Ses identifiants lui seront envoyés par email
            si la configuration SMTP/Resend est active.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField<ClientCreateFormValues, "fullName">
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet (optionnel)</FormLabel>
                <FormControl>
                  <Input placeholder="Nom et prénom du client" disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<ClientCreateFormValues, "email">
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="client@entreprise.com"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField<ClientCreateFormValues, "password">
              control={form.control}
              name="password"
              render={({ field }: { field: ControllerRenderProps<ClientCreateFormValues, "password"> }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mot de passe"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={isPending}
                      onClick={handleGeneratePassword}
                      title="Générer un mot de passe sécurisé"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<ClientCreateFormValues, "passwordConfirm">
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirmer"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer le client
                </>
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

