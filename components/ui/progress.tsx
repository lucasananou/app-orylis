"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<"div"> {
  indicatorClassName?: string;
  value?: number | null;
}

export const Progress = React.forwardRef<
  HTMLDivElement,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => {
  const Root = ProgressPrimitive.Root as any;
  const Indicator = ProgressPrimitive.Indicator as any;

  return (
    <Root
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <Indicator
        className={cn("h-full w-full flex-1 bg-accent transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

