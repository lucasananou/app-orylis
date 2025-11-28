// app/api/files/signed-url/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { assertUserCanAccessProject, isStaff } from "@/lib/utils";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/files/signed-url?fileId=... — Génère une URL de téléchargement signée
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "fileId requis." }, { status: 400 });
  }

  // TODO: Récupérer le fichier depuis la DB, vérifier l'accès, générer l'URL signée
  // Pour l'instant, retourner une URL publique si le fichier est dans Vercel Blob
  return NextResponse.json({ url: null, fileId });
}

// POST /api/files/signed-url — Génère une URL d'upload signée
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData invalide." }, { status: 400 });
  }

  const projectId = formData.get("projectId")?.toString();
  const file = formData.get("file") as File | null;

  if (!projectId || !file) {
    return NextResponse.json({ error: "projectId et file requis." }, { status: 400 });
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

  // Vérifier la taille (10 Mo max)
  const maxSize = 10 * 1024 * 1024; // 10 Mo
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Fichier trop volumineux (10 Mo max)." }, { status: 400 });
  }

  // Vérifier le type
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
    "application/zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Type de fichier non autorisé." }, { status: 400 });
  }

  // Vérifier que le token est configuré
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json(
      { error: "Configuration manquante : BLOB_READ_WRITE_TOKEN n'est pas défini." },
      { status: 500 }
    );
  }

  try {
    // Upload vers Vercel Blob
    const blob = await put(`projects/${projectId}/${file.name}`, file, {
      access: "public",
      token: blobToken
    });

    const skipDb = req.nextUrl.searchParams.get("skipDb") === "true";

    if (!skipDb) {
      // Créer l'entrée en base
      const createResponse = await fetch(`${req.nextUrl.origin}/api/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("cookie") ?? ""
        },
        body: JSON.stringify({
          projectId,
          path: blob.url,
          label: file.name,
          storageProvider: "blob"
        })
      });

      if (!createResponse.ok) {
        // Si l'insertion en DB échoue, on garde le blob (cleanup manuel si besoin)
        console.error("[Files] Failed to create DB entry after blob upload");
      }
    }

    return NextResponse.json({
      ok: true,
      uploadUrl: blob.url,
      path: blob.url,
      filename: file.name
    });
  } catch (error) {
    console.error("[Files] Upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier." },
      { status: 500 }
    );
  }
}
