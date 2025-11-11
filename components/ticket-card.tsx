import Link from "next/link";
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
  href?: string;
}

const statusMap: Record<
  TicketCardProps["status"],
  { label: string; variant: "default" | "secondary" | "success" | "warning" }
> = {
  open: { label: "Ouvert", variant: "warning" },
  in_progress: { label: "En cours", variant: "secondary" },
  done: { label: "Résolu", variant: "success" }
};

export function TicketCard({
  id,
  title,
  description,
  status,
  category = "request",
  createdAt,
  updatedAt,
  projectName,
  href
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
    <Card className={cn("h-full transition hover:shadow-lg", href && "cursor-pointer")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{projectName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          {categoryConfig ? (
            <Badge variant={categoryConfig.variant} className="text-[11px] uppercase">
              {categoryConfig.label}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        {description ? (
          <p className="line-clamp-3 text-muted-foreground">{description}</p>
        ) : (
          <p className="italic text-muted-foreground/80">Aucune description</p>
        )}
        <div className="text-xs text-muted-foreground/80">
          {createdLabel && <p>Créé le {createdLabel}</p>}
          {updatedLabel && <p>Mis à jour le {updatedLabel}</p>}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={`/tickets/${id}` as const}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {card}
      </Link>
    );
  }

  return card;
}
