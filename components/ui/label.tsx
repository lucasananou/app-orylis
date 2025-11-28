import * as React from "react";
import { Label as RadixLabel, type LabelProps as RadixLabelProps } from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export interface LabelProps extends RadixLabelProps {}

export const Label = React.forwardRef<
  React.ElementRef<typeof RadixLabel>,
  LabelProps
>(({ className, ...props }, ref) => (
  <RadixLabel
    ref={ref}
    className={cn("text-sm font-medium text-foreground", className)}
    {...props}
  />
));
Label.displayName = RadixLabel.displayName;

