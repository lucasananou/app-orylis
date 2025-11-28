"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowUpCircle, CheckCircle2, Circle, Clock } from "lucide-react";

export interface TicketCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: "open" | "in_progress" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  category?: "request" | "feedback" | "issue" | "general";
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  projectName: string;
  clientName?: string | null;
  onSelect?: () => void;
}

const statusMap: Record<
  TicketCardProps["status"],
  { label: string; variant: "default" | "secondary" | "success" | "warning"; icon: React.ReactNode; color: string }
> = {
  open: { label: "Ouvert", variant: "warning", icon: <Circle className="h-3 w-3" />, color: "text-green-600" },
  in_progress: { label: "En cours", variant: "secondary", icon: <Clock className="h-3 w-3" />, color: "text-orange-600" },
  done: { label: "Résolu", variant: "success", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-muted-foreground" }
};

const priorityMap: Record<
  NonNullable<TicketCardProps["priority"]>,
  { label: string; color: string; icon: React.ReactNode }
> = {
  low: { label: "Basse", color: "text-slate-500 bg-slate-100 border-slate-200", icon: <ArrowUpCircle className="h-3 w-3 rotate-180" /> },
  medium: { label: "Moyenne", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <ArrowUpCircle className="h-3 w-3 rotate-90" /> },
  high: { label: "Haute", color: "text-orange-600 bg-orange-50 border-orange-200", icon: <ArrowUpCircle className="h-3 w-3" /> },
  urgent: { label: "Urgente", color: "text-red-600 bg-red-50 border-red-200", icon: <AlertCircle className="h-3 w-3" /> }
};

export function TicketCard({
  title,
  description,
  status,
  priority = "medium",
  category = "request",
  createdAt,
  updatedAt,
  projectName,
  clientName,
  onSelect
}: TicketCardProps) {
  const statusConfig = statusMap[status];
  const priorityConfig = priorityMap[priority] || priorityMap["medium"];
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
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("gap-1 px-1.5 py-0.5 text-[10px] font-medium border", priorityConfig.color)}>
              {priorityConfig.icon}
              {priorityConfig.label}
            </Badge>
            {categoryConfig ? (
              <Badge variant={categoryConfig.variant} className="text-[9px] uppercase sm:text-[10px] px-1.5 py-0.5">
                {categoryConfig.label}
              </Badge>
            ) : null}
          </div>
          <CardTitle className="text-sm font-semibold text-foreground sm:text-base line-clamp-2">{title}</CardTitle>
          <div className="flex flex-col gap-0.5 mt-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">{projectName}</p>
            {clientName && (
              <p className="text-[10px] text-muted-foreground/80 sm:text-xs">👤 {clientName}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:gap-2">
          <Badge variant={statusConfig.variant} className="flex items-center gap-1 text-[10px] sm:gap-1.5 sm:text-xs">
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground sm:space-y-4 sm:text-sm">
        {description ? (
          <p className="line-clamp-3 text-muted-foreground">{description}</p>
        ) : (
          <p className="italic text-muted-foreground/80">Aucune description</p>
        )}
        <div className="text-[10px] text-muted-foreground sm:text-xs pt-2 border-t border-border/50">
          {createdLabel && <p>Créé le {createdLabel}</p>}
          {updatedLabel && <p>Mis à jour le {updatedLabel}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return card;
}
