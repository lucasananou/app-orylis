"use client";

import { Calendar, CreditCard, FileText, Megaphone, Sparkles, TicketIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export type DashboardActivityType = "ticket" | "file" | "billing" | "onboarding" | "system";

export interface DashboardActivityItem {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  date: string;
  meta?: string;
}

export interface DashboardActivityProps {
  items: DashboardActivityItem[];
}

const typeIconMap: Record<DashboardActivityType, React.ComponentType<{ className?: string }>> = {
  ticket: TicketIcon,
  file: FileText,
  billing: CreditCard,
  onboarding: Sparkles,
  system: Megaphone
};

const typeLabelMap: Record<DashboardActivityType, string> = {
  ticket: "Ticket",
  file: "Fichier",
  billing: "Facturation",
  onboarding: "Onboarding",
  system: "Système"
};

export function DashboardActivity({ items }: DashboardActivityProps) {
  return (
    <Card className="border border-border/70">
      <CardHeader className="pb-3">
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <p>Aucune activité récente. Vous serez alerté dès qu’un élément évolue.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const Icon = typeIconMap[item.type];
              return (
                <li key={item.id} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {typeLabelMap[item.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.date, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    {item.meta ? (
                      <p className="text-xs text-muted-foreground/80">{item.meta}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
