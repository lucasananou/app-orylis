import Link from "next/link";
import { cache } from "react";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, tickets } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { TicketsClient } from "@/components/tickets/tickets-client";

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
  category: "request" | "feedback" | "issue" | "general";
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
  const requestedStatus = searchParams.status;
  const statusFilter = STATUS_OPTIONS.some((option) => option.value === requestedStatus)
    ? (requestedStatus as TicketStatusValue | "all")
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

      if (statusFilter !== "all") {
        conditions.push(eq(tickets.status, statusFilter));
      }

      const baseQuery = db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          status: tickets.status,
          category: tickets.category,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
          projectId: tickets.projectId,
          projectName: projects.name
        })
        .from(tickets)
        .innerJoin(projects, eq(tickets.projectId, projects.id));

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
    category: ticket.category,
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

      <TicketsClient
        statusOptions={STATUS_OPTIONS}
        statusFilter={statusFilter}
        projects={accessibleProjects}
        tickets={ticketsData}
        role={user.role}
      />
    </>
  );
}
