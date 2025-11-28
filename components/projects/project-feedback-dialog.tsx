"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageSquarePlus, Star } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { canGiveFeedback, type UserRole } from "@/lib/utils";

const feedbackSchema = z.object({
  title: z
    .string()
    .min(4, { message: "Merci de donner un court résumé (4 caractères minimum)." })
    .max(120, { message: "Le titre dépasse 120 caractères." }),
  details: z
    .string()
    .min(20, { message: "Partagez un feedback détaillé (20 caractères minimum)." })
    .max(4000, { message: "Merci de rester synthétique (4000 caractères max)." })
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface ProjectFeedbackDialogProps {
  projectId: string;
  projectName: string;
  role?: UserRole;
}

export function ProjectFeedbackDialog({ projectId, projectName, role = "client" }: ProjectFeedbackDialogProps) {
  const canAccess = canGiveFeedback(role);
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      details: ""
    }
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset({ title: "", details: "" });
    }
    setIsOpen(next);
  };

  const handleSubmit = (values: FeedbackFormValues) => {
    startTransition(async () => {
      try {
        const ticketTitle = `[Feedback] ${values.title}`;
        const ticketDescription = `${values.details}\n\n---\nProjet : ${projectName}\nType : Feedback client`;

        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title: ticketTitle,
            description: ticketDescription,
            category: "feedback"
          })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible d’envoyer le feedback.");
        }

        const data = (await response.json()) as { id: string };
        toast.success("Merci pour votre retour, l’équipe revient vers vous rapidement !");
        handleOpenChange(false);
        router.replace(`/tickets/${data.id}`);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l’envoi du feedback.";
        toast.error(message);
      }
    });
  };

  if (!canAccess) {
    return (
      <Button type="button" size="sm" variant="outline" disabled title="Réservé aux clients">
        <MessageSquarePlus className="mr-2 h-4 w-4" />
        Partager un feedback
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Partager un feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Partager un feedback</DialogTitle>
          <DialogDescription>
            Vos retours nous aident à améliorer l’expérience. Ils sont traités comme un ticket et
            visibles par l’équipe.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField<FeedbackFormValues, "title">
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : Super design, mais j’aurais une suggestion" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<FeedbackFormValues, "details">
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Détaillez votre feedback</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Dites-nous ce qui fonctionne bien, ce qui serait à améliorer, ou toute idée à creuser."
                    className="min-h-[200px]"
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
                  <Star className="mr-2 h-4 w-4" />
                  Envoyer le feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

