// app/api/files/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files, projects } from "@/lib/schema";
import { assertUserCanAccessProject, isStaff } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/files/[id] — Récupère les détails d'un fichier
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const routeParams = "then" in ctx.params ? await ctx.params : ctx.params;
  const fileId = routeParams.id;

  const fileRow = await db
    .select({
      id: files.id,
      projectId: files.projectId,
      path: files.path,
      label: files.label,
      storageProvider: files.storageProvider,
      createdAt: files.createdAt,
      ownerId: projects.ownerId
    })
    .from(files)
    .innerJoin(projects, eq(files.projectId, projects.id))
    .where(eq(files.id, fileId))
    .then((rows) => rows.at(0));

  if (!fileRow) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: fileRow.ownerId
    });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  return NextResponse.json({
    data: {
      id: fileRow.id,
      path: fileRow.path,
      label: fileRow.label,
      storageProvider: fileRow.storageProvider,
      createdAt: fileRow.createdAt.toISOString()
    }
  });
}

// DELETE /api/files/[id] — Supprime un fichier
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const routeParams = "then" in ctx.params ? await ctx.params : ctx.params;
  const fileId = routeParams.id;

  const fileRow = await db
    .select({
      id: files.id,
      projectId: files.projectId,
      path: files.path,
      storageProvider: files.storageProvider,
      ownerId: projects.ownerId
    })
    .from(files)
    .innerJoin(projects, eq(files.projectId, projects.id))
    .where(eq(files.id, fileId))
    .then((rows) => rows.at(0));

  if (!fileRow) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: fileRow.ownerId
    });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Supprimer le blob si c'est Vercel Blob
  if (fileRow.storageProvider === "blob") {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        await del(fileRow.path, {
          token: blobToken
        });
      } catch (error) {
        console.error("[Files] Failed to delete blob:", error);
        // On continue quand même pour supprimer l'entrée DB
      }
    } else {
      console.warn("[Files] BLOB_READ_WRITE_TOKEN not configured, skipping blob deletion");
    }
  }

  // Supprimer l'entrée en base
  await db.delete(files).where(eq(files.id, fileId));

  return NextResponse.json({ ok: true, deletedId: fileId });
}
