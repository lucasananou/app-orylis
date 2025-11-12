"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketCreateSchema, type TicketCreateFormValues } from "@/lib/zod-schemas";
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
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
}

interface NewTicketFormProps {
  projects: ProjectOption[];
}

export function NewTicketForm({ projects }: NewTicketFormProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = React.useTransition();

  const defaultProjectId = projects.at(0)?.id ?? "";

  const form = useForm<TicketCreateFormValues>({
    resolver: zodResolver(ticketCreateSchema),
    mode: "onChange",
    defaultValues: {
      projectId: defaultProjectId,
      title: "",
      description: "",
      category: "request"
    }
  });

  React.useEffect(() => {
    if (!form.getValues("projectId") && projects.length > 0) {
      form.setValue("projectId", projects[0].id, { shouldValidate: true });
    }
  }, [projects, form]);

  const handleSubmit = (values: TicketCreateFormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values)
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible de créer le ticket.");
        }

        const data = (await response.json()) as { id: string };
        toast.success("✅ Demande enregistrée ! Vous recevrez une notification dès qu'un membre de l'équipe y répondra.");
        form.reset({
          projectId: projects.at(0)?.id ?? "",
          title: "",
          description: "",
          category: "request"
        });
        router.replace(`/tickets/${data.id}` as const);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Une erreur est survenue lors de la création.";
        toast.error(message);
      }
    });
  };

  const isDisabled = isSubmitting || projects.length === 0;

  return (
    <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormField<TicketCreateFormValues, "projectId">
        control={form.control}
        name="projectId"
        render={({ field }: { field: ControllerRenderProps<TicketCreateFormValues, "projectId"> }) => (
          <FormItem>
            <FormLabel>Projet concerné</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={projects.length === 0 || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<TicketCreateFormValues, "category">
        control={form.control}
        name="category"
        render={({ field }: { field: ControllerRenderProps<TicketCreateFormValues, "category"> }) => (
          <FormItem>
            <FormLabel>Type de ticket</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="request">Demande</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="issue">Incident / Bug</SelectItem>
                  <SelectItem value="general">Autre</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<TicketCreateFormValues, "title">
        control={form.control}
        name="title"
        render={({ field }: { field: ControllerRenderProps<TicketCreateFormValues, "title"> }) => (
          <FormItem>
            <FormLabel>Titre</FormLabel>
            <FormControl>
              <Input
                placeholder="Décrivez votre demande en une phrase"
                disabled={isDisabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<TicketCreateFormValues, "description">
        control={form.control}
        name="description"
        render={({ field }: { field: ControllerRenderProps<TicketCreateFormValues, "description"> }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Précisez le contexte, l’objectif et le résultat attendu."
                className="min-h-[180px]"
                disabled={isDisabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          type="reset"
          disabled={isSubmitting}
          onClick={() =>
            form.reset({
              projectId: projects.at(0)?.id ?? "",
              title: "",
              description: ""
            })
          }
        >
          Réinitialiser
        </Button>
        <Button type="submit" size="lg" disabled={isDisabled || !form.formState.isValid}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Soumettre
            </>
          )}
        </Button>
      </div>
    </Form>
  );
}
