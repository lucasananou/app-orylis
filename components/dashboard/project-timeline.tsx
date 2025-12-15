"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CircleDashed, Loader2, Hourglass } from "lucide-react";
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
    <Card className="border border-border/70 bg-white w-full overflow-hidden">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg">Timeline du projet</CardTitle>
        <CardDescription>{projectName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col md:flex-row justify-between w-full md:px-4">
          {/* Ligne de connexion horizontale (desktop) */}
          <div className="absolute top-4 left-8 right-8 h-[2px] bg-slate-300 hidden md:block" />

          {/* Progress Bar (colored for completed portions) */}
          {/* Note: Implementing a dynamic progress bar is complex with flex-between spacing. 
               For now, we stick to the background track but make it clearer. */}

          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;

            // Icon Selection
            let Icon = CircleDashed;
            if (step.status === "completed") Icon = CheckCircle2;
            else if (step.status === "current") Icon = Loader2; // Active working
            else Icon = Hourglass; // Upcoming/Waiting

            return (
              <div key={step.id} className="flex flex-row md:flex-col items-center gap-4 md:gap-2 relative z-10 bg-white md:bg-transparent p-2 md:p-0">
                {/* Ligne de connexion verticale (mobile) */}
                {!isLast && (
                  <div className="absolute left-[15px] top-8 bottom-[-8px] w-[2px] bg-slate-300 md:hidden -z-10" />
                )}

                {/* Icône */}
                <div
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white z-10 shrink-0 select-none transition-all duration-300",
                    step.status === "completed"
                      ? "border-green-600 text-green-600 shadow-sm"
                      : step.status === "current"
                        ? "border-blue-600 text-blue-600 shadow-md ring-2 ring-blue-100 ring-offset-2"
                        : "border-slate-200 text-slate-300"
                  )}
                >
                  <Icon className={cn("h-4 w-4", step.status === "current" && "animate-spin")} />
                </div>

                {/* Textes */}
                <div className="md:text-center pt-1 md:pt-2">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      step.status === "completed"
                        ? "text-slate-900"
                        : step.status === "current"
                          ? "text-blue-600"
                          : "text-slate-500"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.date && (
                    <span className="text-xs text-slate-500 block mt-0.5">{step.date}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

