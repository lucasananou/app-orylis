"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoInProgressAnimated() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Cercle pulsant en arrière-plan */}
      <div className="absolute h-20 w-20 animate-ping rounded-full bg-accent/20" />
      <div className="absolute h-16 w-16 animate-pulse rounded-full bg-accent/30" />
      
      {/* Icône principale avec rotation */}
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
      
      {/* Particules animées autour */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute h-2 w-2 rounded-full bg-accent/40",
              "animate-pulse"
            )}
            style={{
              top: `${20 + (i * 15)}%`,
              left: `${15 + (i % 3) * 35}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: "2s"
            }}
          />
        ))}
      </div>
      
      {/* Icônes sparkles animées */}
      <Sparkles className="absolute -right-2 -top-2 h-5 w-5 animate-pulse text-accent" style={{ animationDelay: "0.5s" }} />
      <Sparkles className="absolute -bottom-2 -left-2 h-4 w-4 animate-pulse text-accent/60" style={{ animationDelay: "1s" }} />
    </div>
  );
}

