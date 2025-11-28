import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, tickets } from "@/lib/schema";
import { formatDate, isStaff } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { listTicketMessages } from "@/lib/ticket-messages";
import { TicketDetailForm } from "./ticket-detail-form";
import { TicketConversation } from "./ticket-conversation";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<"open" | "in_progress" | "done", string> = {
  open: "Ouvert",
  in_progress: "En cours",
  done: "Résolu"
};

const CATEGORY_LABELS: Record<"request" | "feedback" | "issue" | "general", string> = {
  request: "Demande",
  feedback: "Feedback",
  issue: "Incident",
  general: "Autre"
};

interface TicketPageProps {
  params: Promise<{
    id: string;
  }> | {
    id: string;
  };
}

export default function TicketDetailPage(props: TicketPageProps): JSX.Element {
  return <TicketDetailPageContent {...props} />;
}

async function TicketDetailPageContent({ params }: TicketPageProps): Promise<JSX.Element> {
  console.log("[TicketDetail] params", params);
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;

  const routeParams = "then" in params ? await params : params;

  const ticket = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      category: tickets.category,
      projectId: tickets.projectId,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      ownerId: projects.ownerId,
      projectName: projects.name,
      authorId: tickets.authorId
    })
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .where(eq(tickets.id, routeParams.id))
    .then((rows) => rows.at(0));

  if (!ticket) {
    notFound();
  }

  const staff = isStaff(user.role);
  const isOwner = ticket.ownerId === user.id;
  const canAccess = staff || isOwner;

  if (!canAccess) {
    redirect("/tickets");
  }

  const allowStatusChange = staff;
  const allowContentEdit = staff;
  const messages = await listTicketMessages(ticket.id);

  return (
    <>
      <PageHeader
        title={ticket.title}
        description={`Projet : ${ticket.projectName}`}
        actions={
          <Button asChild variant="ghost">
            <Link href="/tickets">Retour aux tickets</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Mettre à jour le ticket</CardTitle>
            <CardDescription>
              Modifiez le détail de la demande ou son statut. Les changements sont enregistrés
              instantanément.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TicketDetailForm
              ticket={{
                id: ticket.id,
                title: ticket.title,
                description: ticket.description ?? "",
                status: ticket.status,
                category: ticket.category,
                projectName: ticket.projectName
              }}
              allowStatusChange={allowStatusChange}
              allowContentEdit={allowContentEdit}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white/90">
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
            <CardDescription>Historique et informations associées.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Statut</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Catégorie</p>
              <Badge variant="outline" className="mt-1 uppercase tracking-wide">
                {CATEGORY_LABELS[ticket.category]}
              </Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Projet</p>
              <p className="mt-1 text-foreground">{ticket.projectName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Créé le</p>
              <p className="mt-1 text-foreground">
                {formatDate(ticket.createdAt, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Dernière mise à jour</p>
              <p className="mt-1 text-foreground">
                {formatDate(ticket.updatedAt, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <TicketConversation
        ticketId={ticket.id}
        currentUserId={user.id}
        messages={messages}
        projectName={ticket.projectName}
        projectId={ticket.projectId}
        ticketStatus={ticket.status}
        isStaff={staff}
      />
    </>
  );
}

