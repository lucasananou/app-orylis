"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

interface StaffMessage {
  id: string;
  message: string;
  authorName: string | null;
  createdAt: string;
}

interface ProspectStaffMessagesProps {
  messages: StaffMessage[];
  projectName: string;
}

export function ProspectStaffMessages({
  messages,
  projectName
}: ProspectStaffMessagesProps) {
  if (messages.length === 0) {
    return (
      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages de l'équipe
          </CardTitle>
          <CardDescription>
            L'équipe vous tiendra informé de l'avancement de votre projet {projectName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun message pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages de l'équipe
        </CardTitle>
        <CardDescription>
          L'équipe vous tient informé de l'avancement de votre projet {projectName}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.map((msg) => {
          const initials = msg.authorName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) ?? "OR";

          return (
            <div key={msg.id} className="flex gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {msg.authorName ?? "Équipe Orylis"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(msg.createdAt, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {msg.message}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

