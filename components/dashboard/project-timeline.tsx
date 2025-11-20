"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  label: string;
  status: "completed" | "current" | "upcoming";
  date?: string;
}

interface ProjectTimelineProps {
  steps: TimelineStep[];
  projectName: string;
}

export function ProjectTimeline({ steps, projectName }: ProjectTimelineProps) {
  return (
    <Card className="border border-border/70 bg-white w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Timeline du projet</CardTitle>
        <CardDescription>{projectName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const Icon =
              step.status === "completed"
                ? CheckCircle2
                : step.status === "current"
                  ? Clock
                  : Circle;

            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2",
                      step.status === "completed"
                        ? "border-green-600 bg-green-50 text-green-600"
                        : step.status === "current"
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-muted bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "mt-1 h-12 w-0.5",
                        step.status === "completed" ? "bg-green-600" : "bg-muted"
                      )}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "font-medium",
                        step.status === "completed"
                          ? "text-foreground"
                          : step.status === "current"
                            ? "text-blue-600"
                            : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                    {step.date && (
                      <span className="text-xs text-muted-foreground">{step.date}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

