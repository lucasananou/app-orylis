"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "active", label: "En cours" },
  { value: "done", label: "Archivés" },
  { value: "all", label: "Tout l'historique" }
] as const;

const PRIORITY_OPTIONS = [
  { value: "all", label: "Toutes priorités" },
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgente" }
] as const;

type StatusOptionValue = (typeof STATUS_OPTIONS)[number]["value"];
type PriorityOptionValue = (typeof PRIORITY_OPTIONS)[number]["value"];

interface SelectProject {
  id: string;
  name: string;
}

interface TicketFiltersProps {
  status: StatusOptionValue;
  priority?: PriorityOptionValue;
  projectId?: string;
  projects: SelectProject[];
}

export function TicketFilters({ status, priority = "all", projectId, projects }: TicketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const isDefault = key === "status" ? value === "active" : value === "all";

    if (!value || isDefault) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `/tickets?${query}` : "/tickets");
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-white/90 px-4 py-4 shadow-subtle md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={status === option.value ? "default" : "ghost"}
            onClick={() => updateParam("status", option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Priorité</span>
          <Select
            value={priority}
            onValueChange={(value) => updateParam("priority", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Projet</span>
          <Select
            value={projectId ?? "all"}
            onValueChange={(value) => updateParam("projectId", value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Tous les projets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

