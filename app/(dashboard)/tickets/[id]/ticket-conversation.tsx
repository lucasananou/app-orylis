"use client";

import * as React from "react";
import type { TicketMessageWithAuthor } from "@/lib/ticket-messages";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Paperclip, CheckCircle2, RefreshCw, Lock, X, Shield } from "lucide-react";
import { TicketFileUploader } from "@/components/tickets/ticket-file-uploader";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface TicketConversationProps {
  ticketId: string;
  currentUserId: string;
  messages: TicketMessageWithAuthor[];
  projectName: string;
  projectId: string;
  ticketStatus: "open" | "in_progress" | "done";
  onStatusChange?: (status: "open" | "in_progress" | "done") => void;
  isStaff?: boolean;
}

interface TicketTemplate {
  id: string;
  title: string;
  content: string;
}

interface FileMeta {
  name: string;
  url: string;
  type: string;
  size: number;
}

export function TicketConversation({
  ticketId,
  currentUserId,
  messages,
  projectName,
  projectId,
  ticketStatus,
  onStatusChange,
  isStaff = false
}: TicketConversationProps) {
  const [answer, setAnswer] = React.useState("");
  const [files, setFiles] = React.useState<FileMeta[]>([]);
  const [isInternal, setIsInternal] = React.useState(false);
  const [templates, setTemplates] = React.useState<TicketTemplate[]>([]);
  const [isSubmitting, startTransition] = React.useTransition();
  const [localMessages, setLocalMessages] = React.useState(messages);
  const [currentStatus, setCurrentStatus] = React.useState(ticketStatus);

  React.useEffect(() => {
    if (isStaff) {
      fetch("/api/tickets/templates")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setTemplates(data.data);
        })
        .catch(() => { });
    }
  }, [isStaff]);

  const handleStatusChange = async (newStatus: "open" | "in_progress" | "done") => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error("Impossible de mettre à jour le statut.");

        setCurrentStatus(newStatus);
        onStatusChange?.(newStatus);
        toast.success(`Ticket ${newStatus === "done" ? "résolu" : "réouvert"}.`);
      } catch (error) {
        toast.error("Erreur lors de la mise à jour du statut.");
      }
    });
  };

  const handleSubmit = () => {
    if (!answer.trim() && files.length === 0) {
      toast.error("Rédigez un message ou ajoutez une pièce jointe.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            body: answer,
            files: files,
            isInternal: isInternal
          })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible d’envoyer la réponse.");
        }

        const data = (await response.json()) as {
          message: { id: string; body: string; createdAt: string; authorId: string; isInternal: boolean };
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
            },
            files: files,
            isInternal: data.message.isInternal
          }
        ]);

        setAnswer("");
        setFiles([]);
        setIsInternal(false);

        // If ticket was done, reopen it automatically on reply (unless internal note)
        if (currentStatus === "done" && !isInternal) {
          setCurrentStatus("open");
          onStatusChange?.("open");
        }

        toast.success("✅ Réponse envoyée !");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card className="mt-6 border border-border/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Conversation</CardTitle>
        <div className="flex items-center gap-2">
          {isStaff ? (
            <Select
              value={currentStatus}
              onValueChange={(val) => handleStatusChange(val as "open" | "in_progress" | "done")}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="done">Résolu</SelectItem>
              </SelectContent>
            </Select>
          ) : currentStatus !== "done" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("done")}
              disabled={isSubmitting}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marquer comme résolu
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("open")}
              disabled={isSubmitting}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réouvrir le ticket
            </Button>
          )}
        </div>
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
                  {message.isInternal && (
                    <Badge variant="secondary" className="mb-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Lock className="mr-1 h-3 w-3" /> Note interne
                    </Badge>
                  )}
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{message.body}</p>
                  {message.files && message.files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.files.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-md border border-border/50 bg-background/50 px-3 py-2 text-xs transition-colors hover:bg-background hover:border-border"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          {isStaff && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internal-mode"
                  checked={isInternal}
                  onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                />
                <Label htmlFor="internal-mode" className="flex items-center gap-2 cursor-pointer">
                  {isInternal ? <Lock className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  Note interne
                </Label>
              </div>
              {templates.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                      Réponses rapides
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {templates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => setAnswer(template.content)}
                      >
                        {template.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          <Textarea
            placeholder={
              isInternal
                ? "Ajouter une note visible uniquement par l'équipe..."
                : `Répondre au ticket pour ${projectName}`
            }
            className={cn("min-h-[140px]", isInternal && "bg-yellow-50/50 border-yellow-200")}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={isSubmitting}
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs">
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <TicketFileUploader
              projectId={projectId}
              onUploadComplete={(file) => setFiles([...files, file])}
              disabled={isSubmitting}
            />
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting || (!answer.trim() && files.length === 0)}>
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
