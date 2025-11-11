// app/api/tickets/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tickets } from "@/lib/schema";
import { auth } from "@/auth";

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

  await db.update(tickets).set(update).where(eq(tickets.id, id));
  return NextResponse.json({ ok: true });
}
