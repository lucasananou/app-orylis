// app/api/tickets/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ticketMessages, tickets } from "@/lib/schema";
import { auth } from "@/auth";
import { notifyProjectParticipants } from "@/lib/notifications";
import { assertUserCanAccessProject } from "@/lib/utils";
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

  const messages = await db
    .select({
      id: ticketMessages.id,
      body: ticketMessages.body,
      createdAt: ticketMessages.createdAt,
      authorId: ticketMessages.authorId
    })
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, id))
    .orderBy(ticketMessages.createdAt);

  return NextResponse.json({ data: { ticket: item, messages } });
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

  const updates = parsed.data;

  const existing = await db
    .select({
      id: tickets.id,
      projectId: tickets.projectId,
      title: tickets.title,
      status: tickets.status,
      category: tickets.category,
      authorId: tickets.authorId
    })
    .from(tickets)
    .where(eq(tickets.id, id))
    .then((rows) => rows.at(0));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: existing.authorId
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

  try {
    await notifyProjectParticipants({
      projectId: existing.projectId,
      excludeUserIds: [session.user.id],
      includeOwner: true,
      includeStaff: true,
      type: "ticket_updated",
      title: `Mise à jour du ticket`,
      body: `Le ticket “${updated?.title ?? existing.title}” est désormais ${statusLabel[(updated?.status ??
        existing.status) as keyof typeof statusLabel]}.`,
      metadata: {
        ticketId: existing.id,
        projectId: existing.projectId
      }
    });
  } catch (error) {
    console.error("[Notifications] Échec de la création de notification ticket_updated:", error);
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
      body: messageBody
    })
    .returning({
      id: ticketMessages.id,
      createdAt: ticketMessages.createdAt
    });

  try {
    await notifyProjectParticipants({
      projectId: ticket.projectId,
      excludeUserIds: [session.user.id],
      includeOwner: true,
      includeStaff: true,
      type: "ticket_updated",
      title: `Nouvelle réponse sur le ticket` ,
      body: `${session.user.name ?? session.user.email ?? "Un membre"} a répondu sur "${ticket.title}".` ,
      metadata: {
        ticketId: ticket.id,
        projectId: ticket.projectId
      }
    });
  } catch (error) {
    console.error("[Notifications] Échec de la notification ticket_message:", error);
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
