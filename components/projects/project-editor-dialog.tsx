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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Save } from "lucide-react";

const PROJECT_STATUSES = [
  { value: "onboarding", label: "Onboarding" },
  { value: "demo_in_progress", label: "Démo en création" },
  { value: "design", label: "Design" },
  { value: "build", label: "Build" },
  { value: "review", label: "Review" },
  { value: "delivered", label: "Livré" }
] as const;

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format de date invalide (AAAA-MM-JJ)." })
  .or(z.literal(""))
  .optional();

const createProjectSchema = z.object({
  ownerId: z.string().uuid({ message: "Client invalide." }),
  name: z.string().min(3, { message: "Le nom doit contenir au moins 3 caractères." }).max(120),
  status: z.enum(["onboarding", "demo_in_progress", "design", "build", "review", "delivered"]).default("onboarding"),
  progress: z.coerce
    .number()
    .int()
    .min(0, { message: "Progression minimale 0%." })
    .max(100, { message: "Progression maximale 100%." })
    .default(10)
  // dueDate retiré de la création (peut être ajouté plus tard via l'édition)
});

const editProjectSchema = z.object({
  name: z.string().min(3, { message: "Le nom doit contenir au moins 3 caractères." }).max(120),
  status: z.enum(["onboarding", "demo_in_progress", "design", "build", "review", "delivered"]),
  progress: z.coerce
    .number()
    .int()
    .min(0, { message: "Progression minimale 0%." })
    .max(100, { message: "Progression maximale 100%." }),
  dueDate: dueDateSchema,
  demoUrl: z.string().url({ message: "URL invalide." }).or(z.literal("")).optional(),
  hostingExpiresAt: z.string().optional(),
  maintenanceActive: z.boolean().default(false)
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
type EditProjectFormValues = z.infer<typeof editProjectSchema>;

type ProjectOwnerOption = {
  id: string;
  name: string;
};

type ExistingProject = {
  id: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string | null;
  ownerId: string;
  demoUrl?: string | null;
  hostingExpiresAt?: string | null;
  maintenanceActive?: boolean;
};

interface ProjectEditorDialogProps {
  mode: "create" | "edit";
  owners: ProjectOwnerOption[];
  trigger: React.ReactNode;
  project?: ExistingProject;
}

export function ProjectEditorDialog({ mode, owners, trigger, project }: ProjectEditorDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, startTransition] = React.useTransition();

  const isCreateMode = mode === "create";

  const form = useForm<CreateProjectFormValues | EditProjectFormValues>({
    resolver: zodResolver(isCreateMode ? createProjectSchema : editProjectSchema),
    mode: "onChange",
    defaultValues: isCreateMode
      ? {
        ownerId: owners.at(0)?.id ?? "",
        name: "",
        status: "onboarding",
        progress: 10
        // dueDate n'est pas inclus dans les valeurs par défaut pour la création
      }
      : {
        name: project?.name ?? "",
        status: (project?.status as EditProjectFormValues["status"]) ?? "onboarding",
        progress: project?.progress ?? 0,
        dueDate: project?.dueDate ? project.dueDate.slice(0, 10) : "",
        demoUrl: project?.demoUrl ?? "",
        hostingExpiresAt: project?.hostingExpiresAt ? project.hostingExpiresAt.slice(0, 10) : "",
        maintenanceActive: project?.maintenanceActive ?? false
      }
  });

  React.useEffect(() => {
    if (isCreateMode && owners.length > 0) {
      form.setValue("ownerId", owners[0].id, { shouldValidate: false });
    }
  }, [form, isCreateMode, owners]);

  const handleSubmit = (values: CreateProjectFormValues | EditProjectFormValues) => {
    startTransition(async () => {
      try {
        if (isCreateMode) {
          const createValues = values as CreateProjectFormValues;
          const payload = {
            ownerId: createValues.ownerId,
            name: createValues.name,
            status: createValues.status,
            progress: createValues.progress
            // dueDate est omis lors de la création (peut être ajouté plus tard)
          };

          const response = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(data.error ?? "Impossible de créer le projet.");
          }

          toast.success("Projet créé.");
        } else if (project) {
          const editValues = values as EditProjectFormValues;
          const updates: Record<string, unknown> = {};

          if (editValues.name !== project.name) {
            updates.name = editValues.name;
          }
          if (editValues.status !== project.status) {
            updates.status = editValues.status;
          }
          if (editValues.progress !== project.progress) {
            updates.progress = editValues.progress;
          }

          const normalizedDueDate = editValues.dueDate && editValues.dueDate !== "" ? editValues.dueDate : "";
          const currentDueDate = project.dueDate ? project.dueDate.slice(0, 10) : "";

          if (normalizedDueDate !== "" && normalizedDueDate !== currentDueDate) {
            updates.dueDate = normalizedDueDate;
          } else if (normalizedDueDate === "" && currentDueDate) {
            // suppression non supportée
          }

          // Toujours envoyer demoUrl pour garantir le déclenchement côté API
          const normalizedDemoUrl = editValues.demoUrl && editValues.demoUrl !== "" ? editValues.demoUrl : null;
          updates.demoUrl = normalizedDemoUrl;

          // Hosting & Maintenance
          const normalizedHostingExpiresAt = editValues.hostingExpiresAt && editValues.hostingExpiresAt !== "" ? new Date(editValues.hostingExpiresAt).toISOString() : null;
          updates.hostingExpiresAt = normalizedHostingExpiresAt;
          updates.maintenanceActive = editValues.maintenanceActive;

          // On envoie toujours: la route PATCH gérera No-op pour les autres champs

          const response = await fetch(`/api/projects/${project.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
          });

          if (!response.ok) {
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(data.error ?? "Impossible de mettre à jour le projet.");
          }

          toast.success("Projet mis à jour.");
        }

        setOpen(false);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Une erreur est survenue.";
        toast.error(message);
      } finally {
        // Déclencher l'email "Démo prête" systématiquement après le clic sur Enregistrer,
        // même si le PATCH a échoué (pour forcer la notification au prospect)
        if (project?.id) {
          fetch(`/api/projects/${project.id}/demo-notify`, { method: "POST" }).catch(() => { });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>{isCreateMode ? <><Plus className="mr-2 h-4 w-4" />Nouveau projet</> : "Modifier"}</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "Créer un projet" : "Éditer le projet"}</DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? "Définissez le client concerné, le nom du projet et ses premières métadonnées."
              : "Ajustez les informations du projet. Les modifications sont visibles immédiatement côté équipe."}
          </DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-4">
            {isCreateMode && (
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {owners.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du projet</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom interne / client" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progression (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isCreateMode && (
              <>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'échéance (optionnel)</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="demoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la démo (optionnel)</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://demo.example.com"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Renseignez l'URL de la démo pour permettre au prospect de la consulter.
                      </p>
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-4">Hébergement & Maintenance</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="maintenanceActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Pack Maintenance</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Active le badge "Premium" et masque les alertes de renouvellement.
                            </p>
                          </div>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={isSubmitting}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hostingExpiresAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'expiration hébergement</FormLabel>
                          <FormControl>
                            <Input type="date" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Utilisé pour le compte à rebours si la maintenance n'est pas active.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isCreateMode ? "Créer" : "Enregistrer"}
                </>
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

