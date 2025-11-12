"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { billingLinkSchema, type BillingLinkFormValues } from "@/lib/zod-schemas";
import { useProjectSelection } from "@/lib/project-selection";
import { formatDate, isStaff } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
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
import { CreditCard, Loader2, Plus, Trash2 } from "lucide-react";

interface BillingLink {
  id: string;
  label: string;
  url: string;
  projectId: string;
  projectName: string;
  createdAt: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface BillingLinksManagerProps {
  links: BillingLink[];
  projects: ProjectOption[];
  role: "prospect" | "client" | "staff";
  canManage: boolean;
}

export function BillingLinksManager({ links, projects, role, canManage }: BillingLinksManagerProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, startTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const { projectId, setProjectId, ready } = useProjectSelection();
  const staff = isStaff(role);
  const hasProjects = projects.length > 0;

  React.useEffect(() => {
    if (!ready) {
      return;
    }
    if (!staff && hasProjects && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [ready, staff, hasProjects, projectId, projects, setProjectId]);

  const selectValue = staff ? projectId ?? "__all__" : projectId ?? (projects[0]?.id ?? "");
  const activeProjectId = staff && selectValue === "__all__" ? null : selectValue || null;

  const filteredLinks = React.useMemo(() => {
    if (!ready) {
      return [];
    }
    if (staff && activeProjectId === null) {
      return links;
    }
    if (!activeProjectId) {
      return links;
    }
    return links.filter((link) => link.projectId === activeProjectId);
  }, [activeProjectId, links, ready, staff]);

  const initialProjectId =
    typeof activeProjectId === "string" ? activeProjectId : projects.at(0)?.id ?? "";
  const uploadDisabled = !canManage || !initialProjectId;

  const form = useForm<BillingLinkFormValues>({
    resolver: zodResolver(billingLinkSchema),
    mode: "onChange",
    defaultValues: {
      projectId: initialProjectId,
      label: "",
      url: ""
    }
  });

  React.useEffect(() => {
    if (initialProjectId) {
      form.setValue("projectId", initialProjectId, { shouldValidate: false });
    }
  }, [initialProjectId, form]);

  const handleSubmit = (values: BillingLinkFormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values)
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Impossible d’ajouter le lien.");
        }

        toast.success("Lien ajouté.");
        form.reset({
          projectId: initialProjectId,
          label: "",
          url: ""
        });
        setOpen(false);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Une erreur est survenue lors de l’ajout.";
        toast.error(message);
      }
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Supprimer ce lien de facturation ?");
    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/billing/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Impossible de supprimer le lien.");
      }

      toast.success("Lien supprimé.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Projet</span>
          <Select
            value={selectValue}
            onValueChange={(value) => {
              if (value === "__all__") {
                setProjectId(null);
              } else {
                setProjectId(value);
              }
            }}
            disabled={!ready || !hasProjects}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Tous les projets" />
            </SelectTrigger>
            <SelectContent>
              {staff && <SelectItem value="__all__">Tous les projets</SelectItem>}
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={uploadDisabled}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un lien
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un lien de facturation</DialogTitle>
              <DialogDescription>
                Associez le lien au projet concerné. Le lien sera immédiatement visible côté équipe.
              </DialogDescription>
            </DialogHeader>
            <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField<BillingLinkFormValues, "projectId">
                control={form.control}
                name="projectId"
                render={({
                  field
                }: {
                  field: ControllerRenderProps<BillingLinkFormValues, "projectId">;
                }) => (
                  <FormItem>
                    <FormLabel>Projet</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={projects.length === 0 || isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un projet" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<BillingLinkFormValues, "label">
                control={form.control}
                name="label"
                render={({
                  field
                }: { field: ControllerRenderProps<BillingLinkFormValues, "label"> }) => (
                  <FormItem>
                    <FormLabel>Libellé</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Exemple : Acompte design sprint"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<BillingLinkFormValues, "url">
                control={form.control}
                name="url"
                render={({
                  field
                }: { field: ControllerRenderProps<BillingLinkFormValues, "url"> }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://pay.stripe.com/..."
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ajout…
                    </>
                  ) : (
                    "Ajouter"
                  )}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!ready ? (
        <div className="rounded-2xl border border-border/70 bg-white/80 p-6 text-center text-sm text-muted-foreground">
          Chargement des liens…
        </div>
      ) : filteredLinks.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Aucun lien de facturation"
          description="Ajoutez votre premier lien pour partager un devis, un paiement Stripe ou un dossier Drive."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredLinks.map((link) => (
            <div
              key={link.id}
              className="flex flex-col justify-between rounded-2xl border border-border/70 bg-white/90 p-5 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{link.label}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{link.projectName}</p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                >
                  Ouvrir le lien
                </a>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground/80">
                <span>
                  Ajouté le {formatDate(link.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(link.id)}
                  disabled={deletingId === link.id}
                >
                  {deletingId === link.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

