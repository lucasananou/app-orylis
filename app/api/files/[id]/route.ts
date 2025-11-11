// app/api/files/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/schema";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const item = await db.query.files.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    columns: { id: true, path: true, projectId: true, uploaderId: true }
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(files).where(eq(files.id, id));
  return NextResponse.json({ ok: true });
}

