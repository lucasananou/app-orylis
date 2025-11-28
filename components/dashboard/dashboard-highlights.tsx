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
    <div className={cn('grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((item, index) => (
        <Card
          key={item.id}
          className="group relative border border-border/70 bg-white/90 shadow-subtle transition-all duration-200 hover:shadow-md hover:-translate-y-1"
          style={{
            animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
          }}
        >
          <CardContent className="space-y-1.5 p-4 sm:space-y-2 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 sm:text-xs sm:tracking-[0.28em] sm:text-muted-foreground/70">{item.label}</p>
              <span className="opacity-0 transition-opacity group-hover:opacity-100 text-sm sm:text-base">→</span>
            </div>
            <p className="text-2xl font-semibold text-foreground sm:text-3xl">{item.value}</p>
            {item.helper ? (
              <p className="text-xs text-muted-foreground sm:text-sm">{item.helper}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
