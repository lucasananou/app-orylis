import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, profiles } from "@/lib/schema";
import { assertStaff, isStaff, parseISODate, safeJson } from "@/lib/utils";
import { projectCreateSchema } from "@/lib/zod-schemas";

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
      dueDate: project.dueDate ? project.dueDate.toISOString() : null
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

  let dueDateValue: Date | undefined;
  if (parsed.data.dueDate) {
    try {
      dueDateValue = parseISODate(parsed.data.dueDate);
    } catch {
      return safeJson({ error: "Date d’échéance invalide." }, 400);
    }
  }

  const [created] = await db
    .insert(projects)
    .values({
      ownerId: parsed.data.ownerId,
      name: parsed.data.name,
      status: parsed.data.status ?? "onboarding",
      progress: parsed.data.progress ?? 10,
      dueDate: dueDateValue
    })
    .returning({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      progress: projects.progress,
      dueDate: projects.dueDate,
      ownerId: projects.ownerId
    });

  return safeJson(
    {
      ok: true,
      project: {
        ...created,
        dueDate: created.dueDate ? created.dueDate.toISOString() : null
      }
    },
    201
  );
}

