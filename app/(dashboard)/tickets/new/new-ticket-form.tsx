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
import { Loader2, Send, Bug, Palette, HelpCircle, ArrowLeft, Paperclip, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TicketFileUploader } from "@/components/tickets/ticket-file-uploader";

interface ProjectOption {
  id: string;
  name: string;
}

interface NewTicketFormProps {
  projects: ProjectOption[];
}

type TicketTemplate = "bug" | "feature" | "question";

const templates: Record<TicketTemplate, {
  label: string;
  description: string;
  icon: React.ElementType;
  category: "issue" | "request" | "general";
  placeholder: string;
  defaultDescription: string;
}> = {
  bug: {
    label: "Signaler un bug",
    description: "Un élément ne fonctionne pas comme prévu.",
    icon: Bug,
    category: "issue",
    placeholder: "Ex: Le formulaire de contact ne s'envoie pas...",
    defaultDescription: "**URL concernée :**\n\n**Comportement observé :**\n\n**Comportement attendu :**"
  },
  feature: {
    label: "Demande de modification",
    description: "Changement de design, de texte ou nouvelle fonctionnalité.",
    icon: Palette,
    category: "request",
    placeholder: "Ex: Ajouter une section témoignages sur la page d'accueil...",
    defaultDescription: "**Page concernée :**\n\n**Modification souhaitée :**"
  },
  question: {
    label: "Question générale",
    description: "Une question sur votre projet ou votre facturation.",
    icon: HelpCircle,
    category: "general",
    placeholder: "Ex: Comment mettre à jour mes coordonnées ?",
    defaultDescription: ""
  }
};

export function NewTicketForm({ projects }: NewTicketFormProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = React.useTransition();
  const [selectedTemplate, setSelectedTemplate] = React.useState<TicketTemplate | null>(null);

  const defaultProjectId = projects.at(0)?.id ?? "";

  const form = useForm<TicketCreateFormValues>({
    resolver: zodResolver(ticketCreateSchema),
    mode: "onChange",
    defaultValues: {
      projectId: defaultProjectId,
      title: "",
      description: "",
      category: "request",
      priority: "medium",
      files: []
    }
  });

  React.useEffect(() => {
    if (!form.getValues("projectId") && projects.length > 0) {
      form.setValue("projectId", projects[0].id, { shouldValidate: true });
    }
  }, [projects, form]);

  const handleTemplateSelect = (templateKey: TicketTemplate) => {
    const template = templates[templateKey];
    setSelectedTemplate(templateKey);
    form.setValue("category", template.category);
    form.setValue("description", template.defaultDescription);
    form.clearErrors();
  };

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
        setSelectedTemplate(null);
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

  if (!selectedTemplate) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(templates) as TicketTemplate[]).map((key) => {
          const template = templates[key];
          const Icon = template.icon;
          return (
            <Card
              key={key}
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => handleTemplateSelect(key)}
            >
              <CardHeader>
                <Icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">{template.label}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    );
  }

  const currentTemplate = templates[selectedTemplate];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelectedTemplate(null)}
        className="pl-0 hover:pl-2 transition-all"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Choisir un autre type de demande
      </Button>

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

        {/* Hidden category field since it's set by template */}
        <input type="hidden" {...form.register("category")} />

        <FormField<TicketCreateFormValues, "title">
          control={form.control}
          name="title"
          render={({ field }: { field: ControllerRenderProps<TicketCreateFormValues, "title"> }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input
                  placeholder={currentTemplate.placeholder}
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
                  className="min-h-[180px] font-mono text-sm"
                  disabled={isDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField<TicketCreateFormValues, "priority">
            control={form.control}
            name="priority"
            render={({ field }: { field: ControllerRenderProps<TicketCreateFormValues, "priority"> }) => (
              <FormItem>
                <FormLabel>Priorité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isDisabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une priorité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <FormLabel>Pièces jointes</FormLabel>
            <div className="flex flex-col gap-3">
              <TicketFileUploader
                projectId={form.watch("projectId")}
                disabled={isDisabled || !form.watch("projectId")}
                onUploadComplete={(file) => {
                  const currentFiles = form.getValues("files") ?? [];
                  form.setValue("files", [...currentFiles, file]);
                }}
              />
              <div className="flex flex-col gap-2">
                {form.watch("files")?.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        const currentFiles = form.getValues("files") ?? [];
                        form.setValue(
                          "files",
                          currentFiles.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" size="lg" disabled={isDisabled || !form.formState.isValid}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Soumettre la demande
              </>
            )}
          </Button>
        </div>
      </Form>
    </div >
  );
}
