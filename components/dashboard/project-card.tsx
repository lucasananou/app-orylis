'use client';

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatProgress } from "@/lib/utils";

interface ProjectCardProps {
  id: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string | null;
  roleLabel?: string | null;
  editTrigger?: React.ReactNode;
}

const statusLabels: Record<string, string> = {
  onboarding: "Onboarding",
  design: "Design",
  build: "Build",
  review: "Review",
  delivered: "Livré"
};

export function ProjectCard({
  id,
  name,
  status,
  progress,
  dueDate,
  roleLabel,
  editTrigger
}: ProjectCardProps) {
  const safeProgress = formatProgress(progress);
  return (
    <Card className="h-full border border-border/70 bg-white shadow-subtle">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="line-clamp-1 text-lg font-semibold text-foreground">{name}</CardTitle>
            {roleLabel ? (
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">{roleLabel}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {statusLabels[status] ?? status}
            </Badge>
            {editTrigger}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Progress value={safeProgress} />
          <p className="mt-2 text-xs text-muted-foreground">
            Progression {safeProgress}%{dueDate ? ` · Échéance ${formatDate(dueDate)}` : ""}
          </p>
        </div>
        <a
          href={`/projects/${id}`}
          className="text-sm font-medium text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Voir les détails
        </a>
      </CardContent>
    </Card>
  );
}

