"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormValues } from "@/lib/zod-schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

export function ProfileForm({
  defaultValues
}: {
  defaultValues?: Partial<ProfileFormValues>;
}) {
  const initialValues = React.useMemo(
    () => ({
      fullName: defaultValues?.fullName ?? "",
      company: defaultValues?.company ?? "",
      phone: defaultValues?.phone ?? ""
    }),
    [defaultValues?.company, defaultValues?.fullName, defaultValues?.phone]
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: initialValues
  });

  React.useEffect(() => {
    form.reset(initialValues);
  }, [form, initialValues]);

  const [isSaving, startTransition] = React.useTransition();

  const handleSubmit = (values: ProfileFormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            full_name: values.fullName,
            company: values.company,
            phone: values.phone
          })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Impossible de mettre à jour le profil.");
        }

        toast.success("Profil mis à jour.");
        form.reset(values);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour.";
        toast.error(message);
      }
    });
  };

  return (
    <div id="profile-form">
      <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormField<ProfileFormValues, "fullName">
        control={form.control}
        name="fullName"
        render={({ field }: { field: ControllerRenderProps<ProfileFormValues, "fullName"> }) => (
          <FormItem>
            <FormLabel>Nom complet</FormLabel>
            <FormControl>
              <Input placeholder="Prénom Nom" disabled={isSaving} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<ProfileFormValues, "company">
        control={form.control}
        name="company"
        render={({ field }: { field: ControllerRenderProps<ProfileFormValues, "company"> }) => (
          <FormItem>
            <FormLabel>Entreprise</FormLabel>
            <FormControl>
              <Input placeholder="Orylis" disabled={isSaving} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<ProfileFormValues, "phone">
        control={form.control}
        name="phone"
        render={({ field }: { field: ControllerRenderProps<ProfileFormValues, "phone"> }) => (
          <FormItem>
            <FormLabel>Téléphone</FormLabel>
            <FormControl>
              <Input placeholder="+33 6 12 34 56 78" disabled={isSaving} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => form.reset(initialValues)}
          disabled={isSaving}
        >
          Réinitialiser
        </Button>
        <Button type="submit" size="lg" disabled={isSaving || !form.formState.isValid}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </Form>
    </div>
  );
}

