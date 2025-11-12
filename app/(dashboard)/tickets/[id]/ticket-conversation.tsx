"use client";

import * as React from "react";
import type { TicketMessageWithAuthor } from "@/lib/ticket-messages";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface TicketConversationProps {
  ticketId: string;
  currentUserId: string;
  messages: TicketMessageWithAuthor[];
  projectName: string;
}

export function TicketConversation({
  ticketId,
  currentUserId,
  messages,
  projectName
}: TicketConversationProps) {
  const [answer, setAnswer] = React.useState("");
  const [isSubmitting, startTransition] = React.useTransition();
  const [localMessages, setLocalMessages] = React.useState(messages);

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast.error("Rédigez un message avant d’envoyer.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ body: answer })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible d’envoyer la réponse.");
        }

        const data = (await response.json()) as {
          message: { id: string; body: string; createdAt: string; authorId: string };
        };

        setLocalMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            body: data.message.body,
            createdAt: new Date(data.message.createdAt),
            author: {
              id: currentUserId,
              fullName: "Vous",
              email: null,
              role: "client"
            }
          }
        ]);

        setAnswer("");
        toast.success("✅ Demande enregistrée ! Vous recevrez une notification dès qu'un membre de l'équipe y répondra.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card className="mt-6 border border-border/70">
      <CardHeader>
        <CardTitle>Conversations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 flex flex-col">
          {localMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune réponse pour le moment.</p>
          ) : (
            localMessages.map((message) => {
              const isCurrentUser = message.author.id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-3xl p-5 text-sm shadow-sm transition-all duration-200",
                    isCurrentUser
                      ? "ml-auto max-w-[85%] border border-accent/20 bg-accent/10"
                      : "mr-auto max-w-[85%] border border-border/60 bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-semibold text-foreground">
                      {message.author.fullName ?? message.author.email ?? "Utilisateur"}
                    </span>
                    <span className="text-xs text-muted-foreground/80">
                      {formatDate(message.createdAt, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </span>
                  </div>
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{message.body}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          <Textarea
            placeholder={`Répondre au ticket pour ${projectName}`}
            className="min-h-[140px]"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !answer.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                "Envoyer"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
