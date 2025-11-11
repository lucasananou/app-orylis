import * as React from "react";
import {
  Root as SelectPrimitiveRoot,
  Group as SelectPrimitiveGroup,
  Value as SelectPrimitiveValue,
  Trigger as SelectPrimitiveTrigger,
  Content as SelectPrimitiveContent,
  Viewport as SelectPrimitiveViewport,
  Item as SelectPrimitiveItem,
  ItemText as SelectPrimitiveItemText,
  ItemIndicator as SelectPrimitiveItemIndicator,
  Label as SelectPrimitiveLabel,
  Separator as SelectPrimitiveSeparator,
  ScrollUpButton as SelectPrimitiveScrollUpButton,
  ScrollDownButton as SelectPrimitiveScrollDownButton,
  Portal as SelectPrimitivePortal,
  type SelectProps as SelectPrimitiveProps
} from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectProps = SelectPrimitiveProps;

export const Select = SelectPrimitiveRoot;

export const SelectGroup = SelectPrimitiveGroup;
export const SelectValue = SelectPrimitiveValue;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveTrigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveTrigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitiveTrigger
    ref={ref}
    className={cn(
      "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-4 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-70" />
  </SelectPrimitiveTrigger>
));
SelectTrigger.displayName = SelectPrimitiveTrigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveContent>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveContent>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitivePortal>
    <SelectPrimitiveContent
      ref={ref}
      className={cn(
        "z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg focus:outline-none",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitiveScrollUpButton className="flex items-center justify-center py-2">
        <ChevronUp className="h-4 w-4" />
      </SelectPrimitiveScrollUpButton>
      <SelectPrimitiveViewport>{children}</SelectPrimitiveViewport>
      <SelectPrimitiveScrollDownButton className="flex items-center justify-center py-2">
        <ChevronDown className="h-4 w-4" />
      </SelectPrimitiveScrollDownButton>
    </SelectPrimitiveContent>
  </SelectPrimitivePortal>
));
SelectContent.displayName = SelectPrimitiveContent.displayName;

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveLabel>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveLabel>
>(({ className, ...props }, ref) => (
  <SelectPrimitiveLabel
    ref={ref}
    className={cn("px-3 py-2 text-xs font-medium text-muted-foreground uppercase", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitiveLabel.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveItem>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveItem>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitiveItem
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitiveItemIndicator className="absolute left-2 inline-flex items-center">
      <Check className="h-4 w-4" />
    </SelectPrimitiveItemIndicator>
    <SelectPrimitiveItemText>{children}</SelectPrimitiveItemText>
  </SelectPrimitiveItem>
));
SelectItem.displayName = SelectPrimitiveItem.displayName;

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitiveSeparator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitiveSeparator>
>(({ className, ...props }, ref) => (
  <SelectPrimitiveSeparator
    ref={ref}
    className={cn("mx-2 my-1 h-px bg-border", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitiveSeparator.displayName;

