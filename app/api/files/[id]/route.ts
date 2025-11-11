import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, projects } from "@/lib/schema";
import { isStaff } from "@/lib/utils";

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id: fileId } = await context.params;

  const record = await db
    .select({
      id: files.id,
      path: files.path,
      projectId: files.projectId,
      ownerId: projects.ownerId
    })
    .from(files)
    .innerJoin(projects, eq(files.projectId, projects.id))
    .where(eq(files.id, fileId))
    .then((rows) => rows.at(0));

  if (!record) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const canDelete = isStaff(session.user.role) || record.ownerId === session.user.id;

  if (!canDelete) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  await del(record.path);
  await db.delete(files).where(eq(files.id, fileId));

  return NextResponse.json({ ok: true });
}

