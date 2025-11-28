import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, tickets, profiles, files } from "@/lib/schema";
import { notifyProjectParticipants } from "@/lib/notifications";
import { sendTicketCreatedEmailToAdmin } from "@/lib/emails";
import { ticketCreateSchema } from "@/lib/zod-schemas";
import { assertUserCanAccessProject, isStaff, canAccessTickets, isProspect } from "@/lib/utils";

type TicketStatus = "open" | "in_progress" | "done";

const TICKET_STATUSES = new Set<TicketStatus>(["open", "in_progress", "done"]);

function buildWhereClause(
  conditions: Array<SQL<unknown>>
): SQL<unknown> | undefined {
  return conditions.reduce<SQL<unknown> | undefined>(
    (acc, condition) => (acc ? and(acc, condition) : condition),
    undefined
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Vérifier que l'utilisateur n'est pas un prospect
  if (isProspect(session.user.role)) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée aux clients. Contactez-nous pour activer votre accès complet." },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status") as TicketStatus | null;

  if (status && !TICKET_STATUSES.has(status)) {
    return NextResponse.json({ error: "Status invalide." }, { status: 400 });
  }

  const whereConditions = [];

  if (projectId) {
    whereConditions.push(eq(tickets.projectId, projectId));
  }

  if (status) {
    whereConditions.push(eq(tickets.status, status));
  }

  if (session.user.role === "client") {
    whereConditions.push(eq(projects.ownerId, session.user.id));
  }

  const rows = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      category: tickets.category,
      priority: tickets.priority,
      projectId: tickets.projectId,
      projectName: projects.name,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt
    })
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .where(buildWhereClause(whereConditions))
    .orderBy(desc(tickets.createdAt));

  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Vérifier que l'utilisateur n'est pas un prospect
  if (isProspect(session.user.role)) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée aux clients. Contactez-nous pour activer votre accès complet." },
      { status: 403 }
    );
  }

  const parsedBody = await request.json().catch(() => null);
  const validation = ticketCreateSchema.safeParse(parsedBody);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: validation.error.flatten()
      },
      { status: 400 }
    );
  }

  const { projectId, title, description, category, priority, files: attachedFiles } = validation.data;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      name: true,
      ownerId: true
    }
  });

  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: project.ownerId
    });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const [created] = await db
    .insert(tickets)
    .values({
      projectId,
      title,
      description,
      status: "open",
      category,
      priority,
      authorId: session.user.id
    })
    .returning({
      id: tickets.id
    });

  if (attachedFiles && attachedFiles.length > 0) {
    await db.insert(files).values(
      attachedFiles.map((file) => ({
        projectId,
        uploaderId: session.user.id,
        ticketId: created.id,
        path: file.url,
        label: file.name,
        storageProvider: "uploadthing" as const // Assuming uploadthing for now
      }))
    );
  }

  const creatorName = session.user.name ?? session.user.email ?? "Un utilisateur";

  try {
    // Si c'est un client qui crée le ticket, notifier le staff
    // Si c'est le staff qui crée le ticket, notifier le client (propriétaire)
    await notifyProjectParticipants({
      projectId,
      excludeUserIds: [session.user.id],
      includeOwner: isStaff(session.user.role), // Notifier le client si c'est le staff qui crée
      includeStaff: !isStaff(session.user.role), // Notifier le staff si c'est un client qui crée
      type: "ticket_created",
      title: "Nouveau ticket",
      body: `Le ticket "${title}" a été créé par ${creatorName}.`,
      metadata: {
        ticketId: created.id,
        projectId
      }
    });
  } catch (error) {
    console.error("[Notifications] Échec de la création de notification ticket_created:", error);
  }

  // Envoyer un email à l'admin si c'est un client qui a créé le ticket
  if (!isStaff(session.user.role) && project) {
    sendTicketCreatedEmailToAdmin(
      created.id,
      title,
      project.name,
      creatorName
    ).catch((error) => {
      console.error("[Email] Failed to send ticket created email:", error);
    });
  }

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
