import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 pb-4 pt-1 sm:gap-4 sm:pb-6 sm:pt-2 md:flex-row md:items-center md:justify-between w-full min-w-0", className)}>
      <div className="space-y-1 min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl break-words">{title}</h1>
        {description && <p className="text-xs text-muted-foreground sm:text-sm md:text-base break-words">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

