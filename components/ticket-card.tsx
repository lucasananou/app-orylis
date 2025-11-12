"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TicketCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: "open" | "in_progress" | "done";
  category?: "request" | "feedback" | "issue" | "general";
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  projectName: string;
  onSelect?: () => void;
}

const statusMap: Record<
  TicketCardProps["status"],
  { label: string; variant: "default" | "secondary" | "success" | "warning"; icon: string; color: string }
> = {
  open: { label: "Ouvert", variant: "warning", icon: "🟢", color: "text-green-600" },
  in_progress: { label: "En cours", variant: "secondary", icon: "🟠", color: "text-orange-600" },
  done: { label: "Résolu", variant: "success", icon: "⚪", color: "text-muted-foreground" }
};

export function TicketCard({
  title,
  description,
  status,
  category = "request",
  createdAt,
  updatedAt,
  projectName,
  onSelect
}: TicketCardProps) {
  const statusConfig = statusMap[status];
  const createdLabel = createdAt ? formatDate(createdAt, { dateStyle: "medium", timeStyle: "short" }) : null;
  const updatedLabel =
    updatedAt && (!createdAt || String(updatedAt) !== String(createdAt))
      ? formatDate(updatedAt, { dateStyle: "medium", timeStyle: "short" })
      : null;

  const categoryLabels: Record<
    NonNullable<TicketCardProps["category"]>,
    { label: string; variant: "outline" | "secondary" | "default" }
  > = {
    request: { label: "Demande", variant: "outline" },
    feedback: { label: "Feedback", variant: "secondary" },
    issue: { label: "Incident", variant: "default" },
    general: { label: "Autre", variant: "outline" }
  };

  const categoryConfig = categoryLabels[category];

  const card = (
    <Card
      className={cn(
        "group h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
        onSelect && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      )}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : -1}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2 pb-3 sm:gap-3 sm:pb-4">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="text-sm font-semibold text-foreground sm:text-base line-clamp-2">{title}</CardTitle>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">{projectName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:gap-2">
          <Badge variant={statusConfig.variant} className="flex items-center gap-1 text-[10px] sm:gap-1.5 sm:text-xs">
            <span className="text-[10px] sm:text-xs">{statusConfig.icon}</span>
            {statusConfig.label}
          </Badge>
          {categoryConfig ? (
            <Badge variant={categoryConfig.variant} className="text-[9px] uppercase sm:text-[11px]">
              {categoryConfig.label}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground sm:space-y-4 sm:text-sm">
        {description ? (
          <p className="line-clamp-3 text-muted-foreground">{description}</p>
        ) : (
          <p className="italic text-muted-foreground/80">Aucune description</p>
        )}
        <div className="text-[10px] text-muted-foreground sm:text-xs">
          {createdLabel && <p>Créé le {createdLabel}</p>}
          {updatedLabel && <p>Mis à jour le {updatedLabel}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return card;
}
