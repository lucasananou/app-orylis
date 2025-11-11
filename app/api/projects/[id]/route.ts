import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { assertStaff, parseISODate, safeJson } from "@/lib/utils";
import { projectUpdateSchema } from "@/lib/zod-schemas";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return safeJson({ error: "Non authentifié." }, 401);
  }

  try {
    assertStaff(session.user.role);
  } catch {
    return safeJson({ error: "Accès réservé au staff." }, 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = projectUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return safeJson(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten()
      },
      400
    );
  }

  const updates: Partial<typeof projects.$inferInsert> = {};
  const { id: projectId } = await context.params;

  if (parsed.data.name !== undefined) {
    updates.name = parsed.data.name;
  }

  if (parsed.data.status !== undefined) {
    updates.status = parsed.data.status;
  }

  if (parsed.data.progress !== undefined) {
    updates.progress = parsed.data.progress;
  }

  if (parsed.data.dueDate !== undefined) {
    try {
      parseISODate(parsed.data.dueDate);
      updates.dueDate = parsed.data.dueDate ?? null;
    } catch {
      return safeJson({ error: "Date d’échéance invalide." }, 400);
    }
  }

  const [updated] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      progress: projects.progress,
      dueDate: projects.dueDate,
      ownerId: projects.ownerId
    });

  if (!updated) {
    return safeJson({ error: "Projet introuvable." }, 404);
  }

  return safeJson({
    ok: true,
    project: {
      ...updated,
      dueDate: updated.dueDate ?? null
    }
  });
}

