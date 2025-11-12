"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { canRequestModifications, type UserRole } from "@/lib/utils";

const REQUEST_KINDS = [
  {
    value: "new_page" as const,
    label: "Ajouter une nouvelle page",
    prefix: "Nouvelle page",
    category: "request" as const
  },
  {
    value: "update_page" as const,
    label: "Modifier une page existante",
    prefix: "Modification",
    category: "request" as const
  },
  {
    value: "bug_fix" as const,
    label: "Corriger un problème",
    prefix: "Correction",
    category: "issue" as const
  },
  {
    value: "other" as const,
    label: "Autre demande",
    prefix: "Demande",
    category: "general" as const
  }
] as const;

const projectRequestSchema = z.object({
  kind: z.enum(REQUEST_KINDS.map((kind) => kind.value) as [typeof REQUEST_KINDS[number]["value"], ...string[]]),
  title: z
    .string()
    .min(4, { message: "Merci de donner un titre descriptif (4 caractères minimum)." })
    .max(120, { message: "Titre trop long (120 caractères max)." }),
  description: z
    .string()
    .min(20, { message: "Précisez le contexte en quelques phrases (20 caractères minimum)." })
    .max(4000, { message: "Merci de rester synthétique (4000 caractères max)." })
});

type ProjectRequestFormValues = z.infer<typeof projectRequestSchema>;

interface ProjectRequestDialogProps {
  projectId: string;
  projectName: string;
  role?: UserRole;
}

export function ProjectRequestDialog({ projectId, projectName, role = "client" }: ProjectRequestDialogProps) {
  const canAccess = canRequestModifications(role);
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<ProjectRequestFormValues>({
    resolver: zodResolver(projectRequestSchema),
    mode: "onChange",
    defaultValues: {
      kind: REQUEST_KINDS[0].value,
      title: "",
      description: ""
    }
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset({
        kind: REQUEST_KINDS[0].value,
        title: "",
        description: ""
      });
    }
    setIsOpen(next);
  };

  const handleSubmit = (values: ProjectRequestFormValues) => {
    startTransition(async () => {
      try {
        const kindMeta = REQUEST_KINDS.find((item) => item.value === values.kind) ?? REQUEST_KINDS[0];
        const ticketTitle = `[${kindMeta.prefix}] ${values.title}`;
        const ticketDescription = `${values.description}\n\n---\nProjet : ${projectName}\nType : ${
          kindMeta.label
        }`;

        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title: ticketTitle,
            description: ticketDescription,
            category: kindMeta.category
          })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible d’envoyer la demande.");
        }

        const data = (await response.json()) as { id: string };
        toast.success("Demande envoyée. Nous revenons vers vous rapidement !");
        handleOpenChange(false);
        router.replace(`/tickets/${data.id}`);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l’envoi de la demande.";
        toast.error(message);
      }
    });
  };

  if (!canAccess) {
    return (
      <Button type="button" size="sm" disabled title="Réservé aux clients">
        <Plus className="mr-2 h-4 w-4" />
        Demander une modification
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Demander une modification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Demander une évolution</DialogTitle>
          <DialogDescription>
            Créez une demande détaillée. Elle sera suivie depuis l’espace Tickets du projet.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField<ProjectRequestFormValues, "kind">
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de demande</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type de demande" />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_KINDS.map((kind) => (
                        <SelectItem key={kind.value} value={kind.value}>
                          {kind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<ProjectRequestFormValues, "title">
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex : Landing page Black Friday"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<ProjectRequestFormValues, "description">
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Détails de la demande</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Expliquez le contexte, les objectifs, les sections souhaitées, les ressources disponibles…"
                    className="min-h-[180px]"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="sm:min-w-[180px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Envoyer la demande
                </>
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

