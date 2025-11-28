"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketUpdateSchema, type TicketUpdatePayload } from "@/lib/zod-schemas";
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
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "open", label: "Ouvert" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Résolu" }
] as const;

interface TicketDetailFormProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    status: "open" | "in_progress" | "done";
    category: "request" | "feedback" | "issue" | "general";
    projectName: string;
  };
  allowStatusChange: boolean;
  allowContentEdit: boolean;
}

export function TicketDetailForm({
  ticket,
  allowStatusChange,
  allowContentEdit
}: TicketDetailFormProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = React.useTransition();
  const initialRef = React.useRef({
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    category: ticket.category
  });

  const form = useForm<TicketUpdatePayload>({
    resolver: zodResolver(ticketUpdateSchema),
    mode: "onChange",
    defaultValues: {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      category: ticket.category
    }
  });

  React.useEffect(() => {
    form.reset({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      category: ticket.category
    });
    initialRef.current = {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      category: ticket.category
    };
  }, [ticket, form]);

  const handleSubmit = (values: TicketUpdatePayload) => {
    startTransition(async () => {
      try {
        const updates: TicketUpdatePayload = {};

        if (allowContentEdit && values.title && values.title !== initialRef.current.title) {
          updates.title = values.title;
        }

        if (
          allowContentEdit &&
          values.description &&
          values.description !== initialRef.current.description
        ) {
          updates.description = values.description;
        }

        if (allowStatusChange && values.status && values.status !== initialRef.current.status) {
          updates.status = values.status;
        }

        if (allowStatusChange && values.category && values.category !== initialRef.current.category) {
          updates.category = values.category;
        }

        if (Object.keys(updates).length === 0) {
          toast.info("Aucun changement détecté.");
          return;
        }

        const response = await fetch(`/api/tickets/${ticket.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible de mettre à jour le ticket.");
        }

        toast.success("Ticket mis à jour.");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour.";
        toast.error(message);
      }
    });
  };

  return (
    <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormField<TicketUpdatePayload, "title">
        control={form.control}
        name="title"
        render={({ field }: { field: ControllerRenderProps<TicketUpdatePayload, "title"> }) => (
          <FormItem>
            <FormLabel>Titre</FormLabel>
            <FormControl>
              <Input
                placeholder="Titre du ticket"
                disabled={!allowContentEdit || isSubmitting}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<TicketUpdatePayload, "description">
        control={form.control}
        name="description"
        render={({ field }: { field: ControllerRenderProps<TicketUpdatePayload, "description"> }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Précisez le contexte, l’objectif et le résultat attendu."
                className="min-h-[180px]"
                disabled={!allowContentEdit || isSubmitting}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {allowStatusChange && (
        <FormField<TicketUpdatePayload, "status">
          control={form.control}
          name="status"
          render={({ field }: { field: ControllerRenderProps<TicketUpdatePayload, "status"> }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {allowStatusChange && (
        <FormField<TicketUpdatePayload, "category">
          control={form.control}
          name="category"
          render={({ field }: { field: ControllerRenderProps<TicketUpdatePayload, "category"> }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
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
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || (!allowContentEdit && !allowStatusChange)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement…
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
  );
}

