// app/api/tickets/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, ticketMessages, tickets, projects, files } from "@/lib/schema";
import { auth } from "@/auth";
import { notifyProjectParticipants } from "@/lib/notifications";
import { sendTicketReplyEmail, sendTicketUpdatedEmail } from "@/lib/emails";
import { assertUserCanAccessProject, isStaff } from "@/lib/utils";
import { ticketMessageSchema, ticketUpdateSchema } from "@/lib/zod-schemas";

export const dynamic = "force-dynamic";

// Next 16 typed routes: params is a Promise
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const item = await db.query.tickets.findFirst({
    where: (t, { eq }) => eq(t.id, id)
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ticketFiles = await db.query.files.findMany({
    where: (f, { eq }) => eq(f.ticketId, id)
  });

  const allMessages = await db
    .select({
      id: ticketMessages.id,
      body: ticketMessages.body,
      createdAt: ticketMessages.createdAt,
      authorId: ticketMessages.authorId,
      isInternal: ticketMessages.isInternal,
      fullName: profiles.fullName,
      email: profiles.id,
      role: profiles.role
    })
    .from(ticketMessages)
    .innerJoin(profiles, eq(ticketMessages.authorId, profiles.id))
    .where(eq(ticketMessages.ticketId, id))
    .orderBy(ticketMessages.createdAt);

  // Filtrer les messages internes pour les non-staff
  const isUserStaff = isStaff(session.user.role);
  const filteredMessages = allMessages.filter((msg) => isUserStaff || !msg.isInternal);

  // Associer les fichiers aux messages
  const messagesWithFiles = filteredMessages.map((msg) => ({
    ...msg,
    files: ticketFiles.filter((f) => f.messageId === msg.id)
  }));

  const ticketAttachments = ticketFiles.filter((f) => !f.messageId);

  return NextResponse.json({
    data: {
      ticket: { ...item, files: ticketAttachments },
      messages: messagesWithFiles
    }
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = ticketUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const rawUpdates = parsed.data;

  // Filtrer les valeurs undefined pour éviter les erreurs Drizzle
  const updates: {
    title?: string;
    description?: string;
    status?: "open" | "in_progress" | "done";
    category?: "request" | "feedback" | "issue" | "general";
    priority?: "low" | "medium" | "high" | "urgent";
    updatedAt?: Date;
  } = {};
  if (rawUpdates.title !== undefined) updates.title = rawUpdates.title;
  if (rawUpdates.description !== undefined) updates.description = rawUpdates.description;
  if (rawUpdates.status !== undefined) updates.status = rawUpdates.status;
  if (rawUpdates.category !== undefined) updates.category = rawUpdates.category;
  if (rawUpdates.priority !== undefined) updates.priority = rawUpdates.priority;

  // Force update timestamp to avoid Drizzle $onUpdate bug (e.toISOString is not a function)
  updates.updatedAt = new Date();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucun changement détecté." }, { status: 400 });
  }

  const existing = await db
    .select({
      id: tickets.id,
      projectId: tickets.projectId,
      title: tickets.title,
      status: tickets.status,
      category: tickets.category,
      authorId: tickets.authorId,
      ownerId: profiles.id
    })
    .from(tickets)
    .innerJoin(profiles, eq(tickets.authorId, profiles.id))
    .where(eq(tickets.id, id))
    .then((rows) => rows.at(0));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: existing.ownerId
    });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  await db.update(tickets).set(updates).where(eq(tickets.id, id));

  const updated = await db
    .select({
      title: tickets.title,
      status: tickets.status,
      category: tickets.category
    })
    .from(tickets)
    .where(eq(tickets.id, id))
    .then((rows) => rows.at(0));

  const statusLabel: Record<"open" | "in_progress" | "done", string> = {
    open: "ouvert",
    in_progress: "en cours",
    done: "résolu"
  };

  // Récupérer le nom du projet
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, existing.projectId),
    columns: { name: true }
  });

  const newStatus = (updated?.status ?? existing.status) as "open" | "in_progress" | "done";

  try {
    await notifyProjectParticipants({
      projectId: existing.projectId,
      excludeUserIds: [session.user.id],
      includeOwner: true,
      includeStaff: true,
      type: "ticket_updated",
      title: `Mise à jour du ticket`,
      body: `Le ticket "${updated?.title ?? existing.title}" est désormais ${statusLabel[newStatus]}.`,
      metadata: {
        ticketId: existing.id,
        projectId: existing.projectId
      }
    });
  } catch (error) {
    console.error("[Notifications] Échec de la création de notification ticket_updated:", error);
  }

  // Envoyer un email aux participants (en arrière-plan)
  if (project && updates.status) {
    const participants = await db
      .select({ userId: profiles.id })
      .from(profiles)
      .innerJoin(projects, eq(projects.ownerId, profiles.id))
      .where(eq(projects.id, existing.projectId))
      .then((rows) => rows.map((r) => r.userId));

    // Ajouter le staff
    const staffProfiles = await db.query.profiles.findMany({
      where: (p, { eq }) => eq(p.role, "staff"),
      columns: { id: true }
    });
    const allRecipients = [
      ...new Set([...participants, ...staffProfiles.map((s) => s.id), existing.authorId])
    ].filter((uid) => uid !== session.user.id);

    for (const recipientId of allRecipients) {
      sendTicketUpdatedEmail(
        id,
        updated?.title ?? existing.title,
        project.name,
        newStatus,
        recipientId
      ).catch((error) => {
        console.error("[Email] Failed to send ticket updated email:", error);
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const ticket = await db.query.tickets.findFirst({
    where: (t, { eq }) => eq(t.id, id)
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });
  }

  // Récupérer le nom du projet
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, ticket.projectId),
    columns: { name: true }
  });

  // Vérifie l'accès (staff ou propriétaire du projet)
  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: ticket.authorId
    });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const messageParsed = ticketMessageSchema.safeParse(payload);

  if (!messageParsed.success) {
    return NextResponse.json(
      { error: "Message invalide", details: messageParsed.error.flatten() },
      { status: 400 }
    );
  }

  const messageBody = messageParsed.data.body.trim();

  const [message] = await db
    .insert(ticketMessages)
    .values({
      ticketId: id,
      authorId: session.user.id,
      body: messageBody,
      isInternal: messageParsed.data.isInternal
    })
    .returning({
      id: ticketMessages.id,
      createdAt: ticketMessages.createdAt,
      isInternal: ticketMessages.isInternal
    });

  if (messageParsed.data.files && messageParsed.data.files.length > 0) {
    await db.insert(files).values(
      messageParsed.data.files.map((file) => ({
        projectId: ticket.projectId,
        uploaderId: session.user.id,
        ticketId: id,
        messageId: message.id,
        path: file.url,
        label: file.name,
        storageProvider: "uploadthing" as const
      }))
    );
  }

  const authorName = session.user.name ?? session.user.email ?? "Un membre";

  try {
    await notifyProjectParticipants({
      projectId: ticket.projectId,
      excludeUserIds: [session.user.id],
      includeOwner: true,
      includeStaff: true,
      type: "ticket_updated",
      title: `Nouvelle réponse sur le ticket`,
      body: `${authorName} a répondu sur "${ticket.title}".`,
      metadata: {
        ticketId: ticket.id,
        projectId: ticket.projectId
      }
    });
  } catch (error) {
    console.error("[Notifications] Échec de la notification ticket_message:", error);
  }

  // Envoyer un email à l'auteur du ticket si ce n'est pas lui qui répond
  if (ticket.authorId !== session.user.id && project) {
    sendTicketReplyEmail(id, ticket.title, project.name, authorName, ticket.authorId).catch(
      (error) => {
        console.error("[Email] Failed to send ticket reply email:", error);
      }
    );

    // Si c'est le staff qui répond, envoyer aussi au client (owner du projet)
    if (isStaff(session.user.role)) {
      const projectOwner = await db.query.projects.findFirst({
        where: eq(projects.id, ticket.projectId),
        columns: { ownerId: true }
      });

      if (projectOwner?.ownerId && projectOwner.ownerId !== ticket.authorId) {
        sendTicketReplyEmail(id, ticket.title, project.name, authorName, projectOwner.ownerId).catch(
          (error) => {
            console.error("[Email] Failed to send ticket reply email to owner:", error);
          }
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    message: {
      id: message.id,
      body: messageBody,
      createdAt: message.createdAt,
      authorId: session.user.id
    }
  }, { status: 201 });
}
