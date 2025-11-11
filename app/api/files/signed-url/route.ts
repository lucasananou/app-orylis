import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, projects } from "@/lib/schema";
import { buildFileStoragePath, isStaff } from "@/lib/utils";
import { fileMetaSchema } from "@/lib/zod-schemas";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "FormData requis." }, { status: 400 });
  }

  const projectId = formData.get("projectId");
  const file = formData.get("file");

  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "projectId invalide." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }

  const validation = fileMetaSchema.safeParse({
    projectId,
    filename: file.name,
    type: file.type,
    size: file.size
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Payload invalide.", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      ownerId: true
    }
  });

  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  const canUpload = isStaff(session.user.role) || project.ownerId === session.user.id;

  if (!canUpload) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const fileId = crypto.randomUUID();
  const pathname = buildFileStoragePath(projectId, fileId, file.name);

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type
  });

  const [record] = await db
    .insert(files)
    .values({
      id: fileId,
      projectId,
      uploaderId: session.user.id,
      path: blob.url,
      label: file.name,
      storageProvider: "blob"
    })
    .returning({
      id: files.id,
      path: files.path,
      label: files.label,
      createdAt: files.createdAt,
      projectId: files.projectId
    });

  return NextResponse.json({
    ok: true,
    file: {
      id: record.id,
      label: record.label,
      path: record.path,
      createdAt: record.createdAt,
      projectId: record.projectId
    }
  });
}


