import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TicketCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: "open" | "in_progress" | "done";
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
  title,
  description,
  status,
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

  const card = (
    <Card className={cn("h-full transition hover:shadow-lg", href && "cursor-pointer")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{projectName}</p>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
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
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
        {card}
      </Link>
    );
  }

  return card;
}
