"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoInProgressAnimated() {
  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24 overflow-hidden">
      {/* Cercle pulsant en arrière-plan */}
      <div className="absolute h-20 w-20 animate-ping rounded-full bg-accent/20 sm:h-24 sm:w-24" />
      <div className="absolute h-16 w-16 animate-pulse rounded-full bg-accent/30 sm:h-20 sm:w-20" />
      
      {/* Icône principale avec rotation */}
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-sm sm:h-20 sm:w-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent sm:h-10 sm:w-10" />
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
      <Sparkles className="absolute right-0 top-0 h-4 w-4 animate-pulse text-accent sm:h-5 sm:w-5" style={{ animationDelay: "0.5s" }} />
      <Sparkles className="absolute bottom-0 left-0 h-3 w-3 animate-pulse text-accent/60 sm:h-4 sm:w-4" style={{ animationDelay: "1s" }} />
    </div>
  );
}

