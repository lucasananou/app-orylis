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
        <h1 className="text-balance break-words hyphens-auto leading-tight tracking-tight text-2xl sm:text-3xl md:text-4xl text-foreground text-center sm:text-left">{title}</h1>
        {description && <div className="text-balance break-words hyphens-auto text-sm sm:text-base md:text-lg text-muted-foreground text-center sm:text-left">{description}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

