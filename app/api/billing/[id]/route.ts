import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { billingLinks, projects } from "@/lib/schema";
import { assertUserCanAccessProject } from "@/lib/utils";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const link = await db
    .select({
      id: billingLinks.id,
      projectId: billingLinks.projectId,
      ownerId: projects.ownerId
    })
    .from(billingLinks)
    .innerJoin(projects, eq(billingLinks.projectId, projects.id))
    .where(eq(billingLinks.id, params.id))
    .limit(1)
    .then((rows) => rows.at(0));

  if (!link) {
    return NextResponse.json({ error: "Lien introuvable." }, { status: 404 });
  }

  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: link.ownerId
    });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  await db.delete(billingLinks).where(eq(billingLinks.id, params.id));

  return NextResponse.json({ ok: true });
}

