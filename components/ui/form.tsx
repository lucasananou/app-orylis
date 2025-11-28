import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  type UseFormReturn
} from "react-hook-form";
import { cn } from "@/lib/utils";

const FormContext = React.createContext<UseFormReturn<FieldValues> | null>(null);

type FormProps<TFieldValues extends FieldValues> = React.FormHTMLAttributes<HTMLFormElement> & {
  form: UseFormReturn<TFieldValues>;
  children: React.ReactNode;
};

export function Form<TFieldValues extends FieldValues>({
  form,
  children,
  ...props
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <FormContext.Provider value={form as unknown as UseFormReturn<FieldValues>}>
        <form {...props}>{children}</form>
      </FormContext.Provider>
    </FormProvider>
  );
}

type FormFieldContextValue = {
  name: string;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const form = React.useContext(FormContext);
  const fieldState = form?.getFieldState(fieldContext.name);
  const isInvalid = !!fieldState?.error;

  return {
    id: itemContext.id,
    name: fieldContext.name,
    formItemId: itemContext.id,
    formMessageId: `${itemContext.id}-message`,
    formDescriptionId: `${itemContext.id}-description`,
    error: fieldState?.error,
    isInvalid
  };
}

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

export const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = "FormItem";

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  optional?: boolean;
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, optional, required, children, ...props }, ref) => {
    const { formItemId, isInvalid } = useFormField();

    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium text-foreground flex items-center gap-2",
          isInvalid && "text-destructive",
          className
        )}
        htmlFor={formItemId}
        {...props}
      >
        {children}
        {required && (
          <span className="text-destructive text-xs font-normal" aria-label="Champ obligatoire">
            *
          </span>
        )}
        {optional && (
          <span className="text-muted-foreground text-xs font-normal" aria-label="Champ optionnel">
            (optionnel)
          </span>
        )}
      </label>
    );
  }
);
FormLabel.displayName = "FormLabel";

export const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      aria-describedby={[formDescriptionId, formMessageId].join(" ")}
      id={formItemId}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
});
FormDescription.displayName = "FormDescription";

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? "") : children;

  if (!body) {
    return null;
  }

  return (
    <p ref={ref} id={formMessageId} className={cn("text-sm text-destructive", className)} {...props}>
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

