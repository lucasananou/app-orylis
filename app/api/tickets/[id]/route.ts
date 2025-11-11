// app/api/tickets/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tickets } from "@/lib/schema";
import { auth } from "@/auth";
import { notifyProjectParticipants } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Next 16 typed routes: params is a Promise
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const item = await db.query.tickets.findFirst({
    where: (t, { eq }) => eq(t.id, id),
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: item });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<{
    title: string;
    description: string | null;
    status: "open" | "in_progress" | "done";
  }>;

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (typeof body.status === "string") update.status = body.status;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const existing = await db
    .select({
      id: tickets.id,
      projectId: tickets.projectId,
      title: tickets.title,
      status: tickets.status
    })
    .from(tickets)
    .where(eq(tickets.id, id))
    .then((rows) => rows.at(0));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.update(tickets).set(update).where(eq(tickets.id, id));

  const updated = await db
    .select({
      title: tickets.title,
      status: tickets.status
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
