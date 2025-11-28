import * as React from "react";
import { cn } from "@/lib/utils";

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Breadcrumb = ({ children, className, ...props }: BreadcrumbProps) => (
  <nav
    aria-label="Fil d’Ariane"
    className={cn("flex items-center gap-3 text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </nav>
);

export const BreadcrumbList = ({ className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
  <ol className={cn("flex items-center gap-3", className)} {...props} />
);

export const BreadcrumbItem = ({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li className={cn("inline-flex items-center text-muted-foreground", className)} {...props} />
);

export const BreadcrumbLink = ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a
    className={cn(
      "transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
);

export const BreadcrumbSeparator = ({ className, children = "•", ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("text-xs text-muted-foreground/70", className)} role="presentation" {...props}>
    {children}
  </span>
);

export const BreadcrumbPage = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("font-medium text-foreground", className)} aria-current="page" {...props} />
);

