import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className
}: EmptyStateProps) {
  const isLink = Boolean(actionHref);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/40 px-10 py-16 text-center shadow-subtle",
        className
      )}
    >
      <span className="rounded-full bg-accent/10 p-4 text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actionLabel ? (
        isLink ? (
          <Button asChild size="lg">
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button size="lg" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      ) : null}
    </div>
  );
}

