import * as React from "react";
import Link from "next/link";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { SVGProps } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, tickets } from "@/lib/schema";
import { useProjectSelection } from "@/lib/project-selection";
import { isStaff } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TicketCard } from "@/components/ticket-card";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "open", label: "Ouverts" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Résolus" }
] as const;

type TicketStatusValue = Exclude<(typeof STATUS_OPTIONS)[number]["value"], "all">;

interface TicketsPageProps {
  searchParams: {
    status?: string;
  };
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
  createdAt: string;
  updatedAt: string;
  projectId: string;
  projectName: string;
}

const reduceConditions = (conditions: Array<SQL<unknown>>) =>
  conditions.reduce<SQL<unknown> | undefined>(
    (acc, condition) => (acc ? and(acc, condition) : condition),
    undefined
  );

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const staff = isStaff(session.user.role);
  const requestedStatus = searchParams.status;
  const statusFilter = STATUS_OPTIONS.some((option) => option.value === requestedStatus)
    ? (requestedStatus as TicketStatusValue | "all")
    : "all";

  const accessibleProjects: ProjectOption[] = staff
    ? await db
        .select({
          id: projects.id,
          name: projects.name
        })
        .from(projects)
        .orderBy(projects.name)
    : await db.query.projects.findMany({
        where: (project, { eq: eqFn }) => eqFn(project.ownerId, session.user.id),
        columns: {
          id: true,
          name: true
        },
        orderBy: (project, { asc }) => asc(project.name)
      });

  const conditions: Array<SQL<unknown>> = [];

  if (!staff) {
    conditions.push(eq(projects.ownerId, session.user.id));
  }

  if (statusFilter !== "all") {
    conditions.push(eq(tickets.status, statusFilter));
  }

  const baseQuery = db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      projectId: tickets.projectId,
      projectName: projects.name
    })
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id));

  const whereClause = reduceConditions(conditions);
  const ticketQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

  const ticketRows = await ticketQuery.orderBy(desc(tickets.createdAt));

  const ticketsData: TicketItem[] = ticketRows.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    projectId: ticket.projectId,
    projectName: ticket.projectName
  }));

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Créez des demandes pour suivre vos besoins produit & design avec l’équipe Orylis."
        actions={
          <Button size="lg" asChild>
            <Link href="/tickets/new">Nouveau ticket</Link>
          </Button>
        }
      />

      <TicketFilters status={statusFilter} role={session.user.role} projects={accessibleProjects} />
      <TicketsBoard
        tickets={ticketsData}
        statusFilter={statusFilter}
        role={session.user.role}
      />
    </>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function InProgressIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>;
}

interface TicketFiltersProps {
  status: TicketStatusValue | "all";
  projects: ProjectOption[];
  role: "client" | "staff";
}

function TicketFilters({ status, projects, role }: TicketFiltersProps) {
  "use client";

  const router = useRouter();
  const searchParams = useSearchParams();
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

  const handleStatusChange = (nextStatus: (typeof STATUS_OPTIONS)[number]["value"]) => {
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

  return (
    <Card className="border border-border/70 bg-white/90">
      <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={status === option.value ? "default" : "ghost"}
              onClick={() => handleStatusChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Projet</span>
          <Select
            value={selectValue}
            onValueChange={handleProjectChange}
            disabled={!ready || !hasProjects}
          >
            <SelectTrigger className="w-56">
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
  );
}

interface TicketsBoardProps {
  tickets: TicketItem[];
  statusFilter: TicketStatusValue | "all";
  role: "client" | "staff";
}

function TicketsBoard({ tickets, statusFilter, role }: TicketsBoardProps) {
  "use client";

  const { projectId, ready } = useProjectSelection();
  const staff = isStaff(role);

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
      <Card className="border border-border/70">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Chargement des tickets…
        </CardContent>
      </Card>
    );
  }

  return (
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
            icon={statusFilter === "done" ? CheckCircleIcon : InProgressIcon}
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
                createdAt={ticket.createdAt}
                updatedAt={ticket.updatedAt}
                projectName={ticket.projectName}
                href={`/tickets/${ticket.id}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
