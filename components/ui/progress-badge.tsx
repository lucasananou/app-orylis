"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "./progress";

interface ProgressBadgeProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBadge({ value, className, showLabel = true }: ProgressBadgeProps) {
  const isComplete = value >= 100;

  if (isComplete) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 transition-all duration-300 hover:scale-105">
          <CheckCircle2 className="h-6 w-6 text-accent animate-in zoom-in duration-300" />
          {showLabel && (
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-accent">
              100%
            </span>
          )}
        </div>
        {showLabel && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Projet terminé</span>
            <span className="text-xs text-muted-foreground">Toutes les étapes sont complétées</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Progress value={value} />
      {showLabel && (
        <p className="text-xs text-muted-foreground">Progression {value}%</p>
      )}
    </div>
  );
}

