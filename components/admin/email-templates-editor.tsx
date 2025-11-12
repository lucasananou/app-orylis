"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, Mail } from "lucide-react";
import type { EmailTemplateType } from "@/lib/emails";

const templateTypeLabels: Record<EmailTemplateType, string> = {
  welcome: "Email de bienvenue",
  project_created: "Projet créé",
  prospect_promoted: "Prospect promu en client",
  ticket_created: "Nouveau ticket créé",
  ticket_reply: "Réponse sur un ticket",
  ticket_updated: "Ticket mis à jour",
  file_uploaded: "Fichier uploadé",
  onboarding_completed: "Onboarding complété",
  project_updated: "Projet mis à jour"
};

const templateVariables: Record<EmailTemplateType, string[]> = {
  welcome: ["userName", "projectName", "userEmail", "userPassword", "loginUrl"],
  project_created: ["userName", "projectName", "onboardingUrl"],
  prospect_promoted: ["userName", "loginUrl"],
  ticket_created: ["authorName", "ticketTitle", "projectName", "ticketUrl"],
  ticket_reply: ["authorName", "ticketTitle", "projectName", "ticketUrl"],
  ticket_updated: ["ticketTitle", "projectName", "status", "ticketUrl"],
  file_uploaded: ["uploaderName", "fileName", "projectName", "filesUrl"],
  onboarding_completed: ["projectName", "projectUrl"],
  project_updated: ["projectName", "updateMessage", "projectUrl"]
};

const templateSchema = z.object({
  type: z.enum([
    "welcome",
    "project_created",
    "prospect_promoted",
    "ticket_created",
    "ticket_reply",
    "ticket_updated",
    "file_uploaded",
    "onboarding_completed",
    "project_updated"
  ]),
  subject: z.string().min(1, "Le sujet est requis"),
  htmlContent: z.string().min(1, "Le contenu HTML est requis")
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export function EmailTemplatesEditor() {
  const router = useRouter();
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [selectedType, setSelectedType] = React.useState<EmailTemplateType | "">("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      type: "welcome",
      subject: "",
      htmlContent: ""
    }
  });

  // Charger les templates
  React.useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch("/api/admin/emails");
        if (!response.ok) throw new Error("Failed to load templates");
        const { data } = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to load templates:", error);
        toast.error("Impossible de charger les templates");
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplates();
  }, []);

  // Charger le template sélectionné dans le formulaire
  React.useEffect(() => {
    if (selectedType) {
      const template = templates.find((t) => t.type === selectedType);
      if (template) {
        form.reset({
          type: template.type,
          subject: template.subject,
          htmlContent: template.htmlContent
        });
      } else {
        form.reset({
          type: selectedType as EmailTemplateType,
          subject: "",
          htmlContent: ""
        });
      }
    }
  }, [selectedType, templates, form]);

  const handleSave = async (values: TemplateFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: values.type,
          subject: values.subject,
          htmlContent: values.htmlContent,
          textContent: null,
          variables: templateVariables[values.type]
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to save template");
      }

      const { data } = await response.json();
      setTemplates((prev) => {
        const existing = prev.findIndex((t) => t.type === data.type);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });

      toast.success("Template sauvegardé avec succès");
      router.refresh();
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error(
        error instanceof Error ? error.message : "Impossible de sauvegarder le template"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.type === selectedType);
  const variables = selectedType ? templateVariables[selectedType] : [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement des templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Liste des templates */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Sélectionnez un template à modifier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.keys(templateTypeLabels) as EmailTemplateType[]).map((type) => {
            const template = templates.find((t) => t.type === type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedType === type
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">{templateTypeLabels[type]}</span>
                </div>
                {template && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Modifié le {new Date(template.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {!template && (
                  <p className="mt-1 text-xs text-muted-foreground italic">Non configuré</p>
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Éditeur */}
      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>{templateTypeLabels[selectedType]}</CardTitle>
            <CardDescription>
              Variables disponibles : {variables.map((v) => `{{${v}}}`).join(", ")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Type de template</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as EmailTemplateType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(templateTypeLabels) as EmailTemplateType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {templateTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet de l'email</Label>
                <Input
                  id="subject"
                  {...form.register("subject")}
                  placeholder="Ex: Nouveau ticket : {{ticketTitle}}"
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.subject.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="htmlContent">Contenu HTML</Label>
                <Textarea
                  id="htmlContent"
                  {...form.register("htmlContent")}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder='<h2>Bonjour {{userName}}</h2><p>...</p>'
                />
                {form.formState.errors.htmlContent && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.htmlContent.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Utilisez les variables entre doubles accolades : {`{{variableName}}`}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

