"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { Plus, CheckCircle2, Clock } from "lucide-react";
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
import { TicketFilters } from "./ticket-filters";

interface StatusOption {
  value: "active" | "done" | "all";
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
  priority: "low" | "medium" | "high" | "urgent";
  category: "request" | "feedback" | "issue" | "general";
  createdAt: string;
  updatedAt: string;
  projectId: string;
  projectName: string;
  clientName?: string | null;
}

interface TicketsClientProps {
  statusOptions: ReadonlyArray<StatusOption>;
  statusFilter: StatusOption["value"];
  priorityFilter: "low" | "medium" | "high" | "urgent" | "all";
  projects: ProjectOption[];
  tickets: TicketItem[];
  role: "prospect" | "client" | "staff" | "sales";
}

export function TicketsClient({
  statusOptions,
  statusFilter,
  priorityFilter,
  projects,
  tickets,
  role
}: TicketsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId: storedProjectId, setProjectId, ready } = useProjectSelection();
  const staff = isStaff(role) || role === "sales";
  const hasProjects = projects.length > 0;

  // Use URL param as primary source of truth, fallback to stored project ID
  const urlProjectId = searchParams.get("projectId");
  const activeProjectId = urlProjectId ?? storedProjectId;

  React.useEffect(() => {
    if (!ready || staff || !hasProjects) {
      return;
    }
    // Only auto-select if no project is active (neither in URL nor storage)
    if (!activeProjectId) {
      setProjectId(projects[0].id);
    }
  }, [hasProjects, activeProjectId, projects, ready, setProjectId, staff]);

  // Sync URL change to storage if needed (optional, but good for persistence)
  React.useEffect(() => {
    if (urlProjectId && urlProjectId !== storedProjectId) {
      setProjectId(urlProjectId);
    }
  }, [urlProjectId, storedProjectId, setProjectId]);

  const selectValue = staff ? activeProjectId ?? "__all__" : activeProjectId ?? (projects[0]?.id ?? "");

  const handleStatusChange = (nextStatus: StatusOption["value"]) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }
    router.replace(`/tickets?${params.toString()}`);
  };

  const filteredTickets = React.useMemo(() => {
    if (!ready) {
      return [];
    }

    // If staff and "all" (null or empty), show all
    if (staff && !activeProjectId) {
      return tickets;
    }

    // If activeProjectId is set, filter by it
    if (activeProjectId) {
      return tickets.filter((ticket) => ticket.projectId === activeProjectId);
    }

    // Fallback for client: show all (they only see their own anyway)
    return tickets;
  }, [activeProjectId, ready, staff, tickets]);

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
          <TicketFilters
            status={statusFilter}
            priority={priorityFilter}
            projectId={selectValue === "__all__" ? undefined : selectValue}
            projects={projects}
          />
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
                  statusFilter === "all" || statusFilter === "active"
                    ? "Soumettez votre première demande pour démarrer la collaboration."
                    : "Aucun ticket ne correspond à ce filtre."
                }
                actionLabel={statusFilter === "all" || statusFilter === "active" ? "Créer un ticket" : undefined}
                actionHref={statusFilter === "all" || statusFilter === "active" ? "/tickets/new" : undefined}
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
                    priority={ticket.priority}
                    category={ticket.category}
                    createdAt={ticket.createdAt}
                    updatedAt={ticket.updatedAt}
                    projectName={ticket.projectName}
                    clientName={ticket.clientName}
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
