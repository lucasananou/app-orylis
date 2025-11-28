import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectMessages, projects, profiles } from "@/lib/schema";
import { assertStaff } from "@/lib/utils";
import { z } from "zod";

const createMessageSchema = z.object({
  message: z.string().min(1, "Le message ne peut pas être vide").max(2000, "Le message est trop long")
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    assertStaff(session.user.role);
  } catch {
    return NextResponse.json({ error: "Accès réservé au staff." }, { status: 403 });
  }

  const { id: projectId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = createMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  // Vérifier que le projet existe
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true }
  });

  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  // Créer le message
  const [created] = await db
    .insert(projectMessages)
    .values({
      projectId,
      authorId: session.user.id,
      message: parsed.data.message
    })
    .returning({
      id: projectMessages.id,
      message: projectMessages.message,
      createdAt: projectMessages.createdAt
    });

  // Récupérer le nom de l'auteur
  const author = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.user.id),
    columns: { fullName: true }
  });

  return NextResponse.json({
    id: created.id,
    message: created.message,
    authorName: author?.fullName ?? null,
    createdAt: created.createdAt.toISOString()
  });
}

