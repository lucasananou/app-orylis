import Link from "next/link";
import { cache } from "react";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, tickets, profiles } from "@/lib/schema";
import { isStaff, isProspect } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { TicketsClient } from "@/components/tickets/tickets-client";
import { Card, CardContent } from "@/components/ui/card";
import { ProspectBanner } from "@/components/prospect/prospect-banner";

const STATUS_OPTIONS = [
  { value: "active", label: "En cours" },
  { value: "done", label: "Archivés" },
  { value: "all", label: "Tout l'historique" }
] as const;

type TicketFilterValue = (typeof STATUS_OPTIONS)[number]["value"];

interface TicketsPageProps {
  searchParams: {
    status?: string;
    priority?: string;
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
  priority: "low" | "medium" | "high" | "urgent";
  category: "request" | "feedback" | "issue" | "general";
  createdAt: string;
  updatedAt: string;
  projectId: string;
  projectName: string;
  clientName?: string | null;
}

const reduceConditions = (conditions: Array<SQL<unknown>>) =>
  conditions.reduce<SQL<unknown> | undefined>(
    (acc, condition) => (acc ? and(acc, condition) : condition),
    undefined
  );

// Cache les tickets pendant 10 secondes (données qui changent souvent mais pas besoin d'être 100% à jour)
export const revalidate = 10;

export default function TicketsPage(props: TicketsPageProps): JSX.Element {
  return <TicketsPageContent {...props} />;
}

// Cache la session pour éviter les appels multiples
const getCachedSession = cache(async () => {
  return await auth();
});

async function TicketsPageContent({
  searchParams
}: TicketsPageProps): Promise<JSX.Element> {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;
  const staff = isStaff(user.role);
  const isProspectUser = isProspect(user.role);
  const requestedStatus = searchParams.status;

  // Default to "active" if no status specified or invalid
  const statusFilter = STATUS_OPTIONS.some((option) => option.value === requestedStatus)
    ? (requestedStatus as TicketFilterValue)
    : "active";

  const requestedPriority = searchParams.priority;
  const priorityFilter = ["low", "medium", "high", "urgent"].includes(requestedPriority ?? "")
    ? (requestedPriority as "low" | "medium" | "high" | "urgent")
    : "all";

  // Charger les projets et les tickets en parallèle
  const [accessibleProjects, ticketRows] = await Promise.all([
    staff
      ? db
        .select({
          id: projects.id,
          name: projects.name
        })
        .from(projects)
        .orderBy(projects.name)
      : db.query.projects.findMany({
        where: (project, { eq: eqFn }) => eqFn(project.ownerId, user.id),
        columns: {
          id: true,
          name: true
        },
        orderBy: (project, { asc }) => asc(project.name)
      }),
    (async () => {
      const conditions: Array<SQL<unknown>> = [];

      if (!staff) {
        conditions.push(eq(projects.ownerId, user.id));
      }

      if (statusFilter === "active") {
        conditions.push(inArray(tickets.status, ["open", "in_progress"]));
      } else if (statusFilter === "done") {
        conditions.push(eq(tickets.status, "done"));
      }
      // If "all", we push no condition

      if (priorityFilter !== "all") {
        conditions.push(eq(tickets.priority, priorityFilter));
      }

      const baseQuery = db

        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          status: tickets.status,
          priority: tickets.priority,
          category: tickets.category,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
          projectId: tickets.projectId,
          projectName: projects.name,
          clientName: profiles.fullName
        })
        .from(tickets)
        .innerJoin(projects, eq(tickets.projectId, projects.id))
        .leftJoin(profiles, eq(projects.ownerId, profiles.id));

      const whereClause = reduceConditions(conditions);
      const ticketQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

      return ticketQuery.orderBy(desc(tickets.createdAt));
    })()
  ]);

  const ticketsData: TicketItem[] = ticketRows.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    projectId: ticket.projectId,
    projectName: ticket.projectName,
    clientName: ticket.clientName
  }));

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Créez des demandes pour suivre vos besoins produit & design avec l'équipe Orylis."
      />
      {isProspectUser && <ProspectBanner />}

      <TicketsClient
        statusOptions={STATUS_OPTIONS}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        projects={accessibleProjects}
        tickets={ticketsData}
        role={user.role}
      />
    </>
  );
}
