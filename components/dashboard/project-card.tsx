"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressBadge } from "@/components/ui/progress-badge";
import { formatDate, formatProgress } from "@/lib/utils";
import { useProjectSelection } from "@/lib/project-selection";
import type { Route } from "next";

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
  const router = useRouter();
  const { setProjectId } = useProjectSelection();

  const handleViewDetails = React.useCallback(() => {
    setProjectId(id);
    router.push("/onboarding" as Route);
  }, [id, router, setProjectId]);

  const statusColor =
    status === "delivered"
      ? "bg-muted text-muted-foreground"
      : status === "onboarding"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        : status === "build" || status === "review"
          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";

  return (
    <Card className="group h-full border border-border/70 bg-white shadow-subtle transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="line-clamp-1 text-lg font-semibold text-foreground">{name}</CardTitle>
            {roleLabel ? (
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">{roleLabel}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`capitalize ${statusColor}`}>
              {statusLabels[status] ?? status}
            </Badge>
            {editTrigger}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <ProgressBadge value={safeProgress} showLabel={safeProgress < 100} />
          {safeProgress < 100 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {dueDate ? `Échéance ${formatDate(dueDate)}` : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleViewDetails}
          className="group/btn flex items-center gap-2 text-left text-sm font-medium text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Voir les détails
          <span className="opacity-0 transition-all group-hover/btn:translate-x-1 group-hover/btn:opacity-100">
            →
          </span>
        </button>
      </CardContent>
    </Card>
  );
}

