"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DashboardHighlightItem {
  id: string;
  label: string;
  value: string;
  helper?: string;
}

export interface DashboardHighlightsProps {
  items: DashboardHighlightItem[];
  className?: string;
}

export function DashboardHighlights({ items, className }: DashboardHighlightsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((item) => (
        <Card key={item.id} className="border border-border/70 bg-white/90 shadow-subtle">
          <CardContent className="space-y-2 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">{item.label}</p>
            <p className="text-3xl font-semibold text-foreground">{item.value}</p>
            {item.helper ? (
              <p className="text-sm text-muted-foreground">{item.helper}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
