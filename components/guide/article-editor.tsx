"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  knowledgeArticleCreateSchema,
  knowledgeArticleUpdateSchema,
  type KnowledgeArticleCreatePayload
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArticleEditorProps {
  mode: "create" | "edit";
  article?: {
    id: string;
    title: string;
    content: string;
    category: string | null;
    published: boolean;
  };
}

export function ArticleEditor({ mode, article }: ArticleEditorProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = React.useTransition();

  const schema = mode === "create" ? knowledgeArticleCreateSchema : knowledgeArticleUpdateSchema;
  type FormValues = KnowledgeArticleCreatePayload;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      title: article?.title ?? "",
      content: article?.content ?? "",
      category: article?.category ?? undefined,
      published: article?.published ?? true
    }
  });

  const handleSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const url = mode === "create" ? "/api/guide" : `/api/guide/${article!.id}`;
        const method = mode === "create" ? "POST" : "PATCH";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values)
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `Impossible de ${mode === "create" ? "créer" : "modifier"} l'article.`);
        }

        const data = (await response.json()) as { data: { id: string } };
        toast.success(`Article ${mode === "create" ? "créé" : "modifié"} avec succès.`);
        router.push(`/guide/${data.data.id}`);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Une erreur est survenue lors de la ${mode === "create" ? "création" : "modification"}.`;
        toast.error(message);
      }
    });
  };

  return (
    <Card className="border border-border/70">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Nouvel article" : "Modifier l'article"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField<FormValues, "title">
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex : Comment accéder à mon espace client"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<FormValues, "category">
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex : Démarrage, Fonctionnalités, FAQ"
                    disabled={isSubmitting}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<FormValues, "content">
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contenu</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Rédigez le contenu de l'article ici. Vous pouvez utiliser des retours à la ligne pour structurer le texte."
                    className="min-h-[400px] font-mono text-sm"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<FormValues, "published">
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Publier immédiatement</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Si désactivé, l'article sera enregistré comme brouillon.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Création..." : "Modification..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === "create" ? "Créer l'article" : "Enregistrer"}
                </>
              )}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

