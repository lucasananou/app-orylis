// app/api/files/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files, profiles, projects } from "@/lib/schema";
import { assertUserCanAccessProject, isStaff } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/files?projectId=... — Liste les fichiers d'un projet
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis." }, { status: 400 });
  }

  // Vérifier l'accès au projet
  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, projectId),
    columns: {
      id: true,
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

  const fileRows = await db
    .select({
      id: files.id,
      label: files.label,
      path: files.path,
      storageProvider: files.storageProvider,
      createdAt: files.createdAt,
      uploaderId: files.uploaderId,
      uploaderName: profiles.fullName
    })
    .from(files)
    .leftJoin(profiles, eq(files.uploaderId, profiles.id))
    .where(eq(files.projectId, projectId))
    .orderBy(files.createdAt);

  return NextResponse.json({
    data: fileRows.map((file) => ({
      id: file.id,
      label: file.label ?? file.path,
      path: file.path,
      storageProvider: file.storageProvider,
      createdAt: file.createdAt.toISOString(),
      uploaderName: file.uploaderName ?? "Inconnu"
    }))
  });
}

// POST /api/files — Création d'un fichier (après upload vers blob)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { projectId, path, label, storageProvider = "blob" } = body as {
    projectId?: string;
    path?: string;
    label?: string;
    storageProvider?: string;
  };

  if (!projectId || !path) {
    return NextResponse.json({ error: "projectId et path requis." }, { status: 400 });
  }

  // Vérifier l'accès au projet
  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, projectId),
    columns: {
      id: true,
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
    .insert(files)
    .values({
      projectId,
      uploaderId: session.user.id,
      path,
      label: label ?? null,
      storageProvider: storageProvider as "blob" | "s3" | "r2" | "uploadthing"
    })
    .returning({
      id: files.id,
      path: files.path,
      label: files.label,
      createdAt: files.createdAt
    });

  return NextResponse.json({
    ok: true,
    data: {
      id: created.id,
      path: created.path,
      label: created.label,
      createdAt: created.createdAt.toISOString()
    }
  });
}
