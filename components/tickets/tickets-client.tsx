'use client';

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { TicketCard } from "@/components/ticket-card";
import { useProjectSelection } from "@/lib/project-selection";
import { isStaff } from "@/lib/utils";
import { CheckCircle2, Clock } from "lucide-react";

interface StatusOption {
  value: string;
  label: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface TicketItem {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "done";
  category: "request" | "feedback" | "issue" | "general";
  createdAt: string;
  updatedAt: string;
  projectId: string;
  projectName: string;
}

interface TicketsClientProps {
  statusOptions: ReadonlyArray<StatusOption>;
  statusFilter: StatusOption["value"];
  projects: ProjectOption[];
  tickets: TicketItem[];
  role: "client" | "staff";
}

export function TicketsClient({
  statusOptions,
  statusFilter,
  projects,
  tickets,
  role
}: TicketsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, setProjectId, ready } = useProjectSelection();
  const staff = isStaff(role);
  const hasProjects = projects.length > 0;

  React.useEffect(() => {
    if (!ready || staff || !hasProjects) {
      return;
    }
    if (!projectId) {
      setProjectId(projects[0].id);
    }
  }, [hasProjects, projectId, projects, ready, setProjectId, staff]);

  const selectValue = staff ? projectId ?? "__all__" : projectId ?? (projects[0]?.id ?? "");

  const handleStatusChange = (nextStatus: StatusOption["value"]) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }
    router.replace(`/tickets?${params.toString()}`);
  };

  const handleProjectChange = (value: string) => {
    if (value === "__all__") {
      setProjectId(null);
    } else {
      setProjectId(value);
    }
  };

  const filteredTickets = React.useMemo(() => {
    if (!ready) {
      return [];
    }
    if (staff && projectId === null) {
      return tickets;
    }
    if (!projectId) {
      return tickets;
    }
    return tickets.filter((ticket) => ticket.projectId === projectId);
  }, [projectId, ready, staff, tickets]);

  if (!ready) {
    return (
      <Card className="mt-6 border border-border/70">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Chargement des tickets…
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="border border-border/70 bg-white/90">
        <CardContent className="flex flex-col gap-3 py-4 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={statusFilter === option.value ? "default" : "ghost"}
                size="sm"
                className="min-h-[44px] text-xs sm:text-sm"
                onClick={() => handleStatusChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs text-muted-foreground sm:text-sm">Projet</span>
            <Select
              value={selectValue}
              onValueChange={handleProjectChange}
              disabled={!ready || !hasProjects}
            >
              <SelectTrigger className="h-[44px] w-full sm:w-56">
                <SelectValue placeholder="Sélectionnez un projet" />
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
        </CardContent>
      </Card>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Vos tickets</CardTitle>
          <CardDescription>
            Statut courant de vos demandes. Cliquez sur un ticket pour voir les détails ou mettre à jour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <EmptyState
              icon={statusFilter === "done" ? CheckCircle2 : Clock}
              title="Aucun ticket pour l’instant"
              description={
                statusFilter === "all"
                  ? "Soumettez votre première demande pour démarrer la collaboration."
                  : "Aucun ticket ne correspond à ce filtre."
              }
              actionLabel={statusFilter === "all" ? "Créer un ticket" : undefined}
              actionHref={statusFilter === "all" ? "/tickets/new" : undefined}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  id={ticket.id}
                  title={ticket.title}
                  description={ticket.description}
                  status={ticket.status}
                  category={ticket.category}
                  createdAt={ticket.createdAt}
                  updatedAt={ticket.updatedAt}
                  projectName={ticket.projectName}
                  onSelect={() => router.push(`/tickets/${ticket.id}` as Route)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Bouton FAB flottant */}
      <Button
        asChild
        size="lg"
        className="fixed bottom-4 right-4 z-50 h-[56px] w-[56px] rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 md:bottom-8 md:right-8"
        aria-label="Créer un nouveau ticket"
      >
        <Link href="/tickets/new">
          <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
      </Button>
    </>
  );
}


