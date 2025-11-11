"use client";

import * as React from "react";
import type { TicketMessageWithAuthor } from "@/lib/ticket-messages";
import { formatDate } from "@/lib/utils";
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
        toast.success("Message envoyé.");
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
        <div className="space-y-4">
          {localMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune réponse pour le moment.</p>
          ) : (
            localMessages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">
                    {message.author.fullName ?? message.author.email ?? "Utilisateur"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(message.createdAt, {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">{message.body}</p>
              </div>
            ))
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
