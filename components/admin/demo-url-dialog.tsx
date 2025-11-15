"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

const demoUrlSchema = z.object({
  demoUrl: z.string().url({ message: "URL invalide." }).or(z.literal("")).optional()
});

type DemoUrlFormValues = z.infer<typeof demoUrlSchema>;

interface DemoUrlDialogProps {
  projectId: string;
  projectName: string;
  currentDemoUrl: string | null;
  trigger: React.ReactNode;
}

export function DemoUrlDialog({ projectId, projectName, currentDemoUrl, trigger }: DemoUrlDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<DemoUrlFormValues>({
    resolver: zodResolver(demoUrlSchema),
    defaultValues: {
      demoUrl: currentDemoUrl ?? ""
    }
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        demoUrl: currentDemoUrl ?? ""
      });
    }
  }, [open, currentDemoUrl, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const normalizedDemoUrl = values.demoUrl && values.demoUrl !== "" ? values.demoUrl : null;

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoUrl: normalizedDemoUrl
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Impossible de mettre à jour l'URL de la démo.");
      }

      toast.success(normalizedDemoUrl ? "URL de la démo mise à jour." : "URL de la démo supprimée.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gérer l&apos;URL de la démo</DialogTitle>
          <DialogDescription>
            Ajoutez ou modifiez l&apos;URL de la démo pour le projet &quot;{projectName}&quot;. Une fois l&apos;URL
            renseignée, le prospect pourra accéder à l&apos;étape 4 du funnel.
          </DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="demoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la démo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://demo.example.com"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Laissez vide pour supprimer l&apos;URL de la démo.
                  </p>
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

