import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, tickets } from "@/lib/schema";
import { ticketUpdateSchema } from "@/lib/zod-schemas";
import { assertUserCanAccessProject, isStaff } from "@/lib/utils";

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await context.params;

  const [row] = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      projectId: tickets.projectId,
      projectName: projects.name,
      ownerId: projects.ownerId,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      authorId: tickets.authorId
    })
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .where(eq(tickets.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });
  }

  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: row.ownerId
    });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { ownerId, ...ticket } = row;

  return NextResponse.json({ data: ticket });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await context.params;

  const payload = await request.json().catch(() => null);
  const validation = ticketUpdateSchema.safeParse(payload);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Payload invalide.", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({
      id: tickets.id,
      projectId: tickets.projectId,
      status: tickets.status,
      title: tickets.title,
      description: tickets.description,
      ownerId: projects.ownerId
    })
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .where(eq(tickets.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });
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

  if (!isStaff(session.user.role)) {
    if (existing.status === "done") {
      return NextResponse.json(
        { error: "Ce ticket est clôturé. Merci de contacter l’équipe pour le rouvrir." },
        { status: 403 }
      );
    }

    if (validation.data.status && validation.data.status !== existing.status) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier le statut du ticket." },
        { status: 403 }
      );
    }
  }

  const updatePayload: Partial<{
    title: string;
    description: string | null;
    status: "open" | "in_progress" | "done";
  }> = {};

  if (validation.data.title) {
    updatePayload.title = validation.data.title;
  }

  if (typeof validation.data.description === "string") {
    updatePayload.description = validation.data.description;
  }

  if (validation.data.status && isStaff(session.user.role)) {
    updatePayload.status = validation.data.status;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "Aucun changement détecté." },
      { status: 400 }
    );
  }

  await db
    .update(tickets)
    .set(updatePayload)
    .where(eq(tickets.id, id));

  const [updated] = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      projectId: tickets.projectId,
      updatedAt: tickets.updatedAt
    })
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  return NextResponse.json({ ok: true, data: updated });
}
