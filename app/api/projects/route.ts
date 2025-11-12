import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, profiles } from "@/lib/schema";
import { assertStaff, isStaff, parseISODate, safeJson } from "@/lib/utils";
import { projectCreateSchema } from "@/lib/zod-schemas";
import { sendProjectCreatedEmail } from "@/lib/emails";

export async function GET(_: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return safeJson({ error: "Non authentifié." }, 401);
  }

  const staff = isStaff(session.user.role);

  const results = staff
    ? await db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          progress: projects.progress,
          dueDate: projects.dueDate,
          ownerId: projects.ownerId,
          ownerName: profiles.fullName
        })
        .from(projects)
        .leftJoin(profiles, eq(projects.ownerId, profiles.id))
        .orderBy(asc(projects.createdAt))
    : await db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          progress: projects.progress,
          dueDate: projects.dueDate,
          ownerId: projects.ownerId,
          ownerName: profiles.fullName
        })
        .from(projects)
        .leftJoin(profiles, eq(projects.ownerId, profiles.id))
        .where(eq(projects.ownerId, session.user.id))
        .orderBy(asc(projects.createdAt));

  return safeJson({
    data: results.map((project) => ({
      ...project,
      dueDate: project.dueDate
    }))
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return safeJson({ error: "Non authentifié." }, 401);
  }

  try {
    assertStaff(session.user.role);
  } catch {
    return safeJson({ error: "Accès réservé au staff." }, 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = projectCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return safeJson(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten()
      },
      400
    );
  }

  // Ne pas utiliser dueDate lors de la création d'un projet (onboarding)
  // La date d'échéance peut être ajoutée plus tard par le staff

  const ownerProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, parsed.data.ownerId),
    columns: {
      id: true
    }
  });

  if (!ownerProfile) {
    return safeJson({ error: "Client introuvable." }, 404);
  }

  const [created] = await db
    .insert(projects)
    .values({
      ownerId: ownerProfile.id,
      name: parsed.data.name,
      status: parsed.data.status ?? "onboarding",
      progress: parsed.data.progress ?? 10
      // dueDate est omis, peut être ajouté plus tard
    })
    .returning({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      progress: projects.progress,
      dueDate: projects.dueDate,
      ownerId: projects.ownerId
    });

  // Envoyer un email au client pour l'inviter à remplir son onboarding
  sendProjectCreatedEmail(created.id, created.name, ownerProfile.id).catch((error) => {
    console.error("[Email] Failed to send project created email:", error);
  });

  return safeJson(
    {
      ok: true,
      project: {
        ...created,
        dueDate: created.dueDate
      }
    },
    201
  );
}

