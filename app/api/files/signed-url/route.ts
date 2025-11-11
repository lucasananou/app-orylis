import { NextRequest, NextResponse } from "next/server";
import { createUploadURL, getDownloadUrl } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, projects } from "@/lib/schema";
import { buildFileStoragePath, isStaff } from "@/lib/utils";
import { fileMetaSchema } from "@/lib/zod-schemas";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const fileId = request.nextUrl.searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "fileId requis." }, { status: 400 });
  }

  const fileRecord = await db
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

  if (!fileRecord) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const canAccess =
    isStaff(session.user.role) || fileRecord.ownerId === session.user.id || session.user.id === fileRecord.ownerId;

  if (!canAccess) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { url } = await getDownloadUrl({
    pathname: fileRecord.path,
    expiresIn: 60
  });

  return NextResponse.json({ downloadUrl: url });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const validation = fileMetaSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Payload invalide.", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { projectId, filename, type } = validation.data;

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
  const pathname = buildFileStoragePath(projectId, fileId, filename);

  const uploadData = await createUploadURL({
    access: "private",
    expires: new Date(Date.now() + 5 * 60 * 1000),
    contentType: type,
    contentLength: {
      min: 1,
      max: 10 * 1024 * 1024
    },
    metadata: {
      projectId,
      uploaderId: session.user.id,
      fileId
    },
    pathname
  });

  const uploadUrl = uploadData.url;
  const blobUrl = uploadUrl.split("?")[0];

  const [record] = await db
    .insert(files)
    .values({
      id: fileId,
      projectId,
      uploaderId: session.user.id,
      path: blobUrl,
      label: filename,
      storageProvider: "blob"
    })
    .returning({
      id: files.id,
      path: files.path
    });

  return NextResponse.json({
    uploadUrl,
    fileId: record.id,
    filePath: record.path
  });
}

