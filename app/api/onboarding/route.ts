// app/api/onboarding/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects } from "@/lib/schema";
import { notifyProjectParticipants } from "@/lib/notifications";
import { sendOnboardingCompletedEmailToAdmin } from "@/lib/emails";
import { assertUserCanAccessProject, isStaff } from "@/lib/utils";
import {
  OnboardingFinalSchema,
  OnboardingPayloadSchema,
  type OnboardingFinalPayload,
  type OnboardingPayload
} from "@/lib/zod-schemas";
import { summarizeOnboardingPayload } from "@/lib/onboarding-summary";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  projectId: z.string().uuid(),
  payload: z.record(z.any()),
  completed: z.boolean().optional(),
  confirm: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsedBody = requestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Payload invalide.", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const { projectId, payload, completed = false } = parsedBody.data;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      name: true,
      ownerId: true,
      progress: true
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

  const validation = completed
    ? OnboardingFinalSchema.safeParse(payload)
    : OnboardingPayloadSchema.safeParse(payload);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Payload onboarding invalide.", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const safePayload: OnboardingPayload | OnboardingFinalPayload = completed
    ? (validation.data as OnboardingFinalPayload)
    : (validation.data as OnboardingPayload);

  // Sérialiser en JSON de manière sûre, en convertissant toutes les Dates en ISO strings
  const jsonPayload = JSON.stringify(safePayload, (_key, value) => {
    if (value && typeof value === "object" && typeof (value as Date).toISOString === "function") {
      return (value as Date).toISOString();
    }
    return value;
  });

  // Parser le JSON pour l'utiliser dans summarizeOnboardingPayload
  const parsedPayload = JSON.parse(jsonPayload) as Record<string, unknown>;

  console.log("[Onboarding] payload snapshot", {
    projectId,
    completed,
    payloadPreview: Object.fromEntries(
      Object.entries(parsedPayload ?? {}).map(([key, value]) => [key, typeof value])
    )
  });

  const existing = await db
    .select({
      id: onboardingResponses.id,
      completed: onboardingResponses.completed
    })
    .from(onboardingResponses)
    .where(eq(onboardingResponses.projectId, projectId))
    .then((rows) => rows.at(0) ?? null);

  try {
    // Utiliser db.execute() avec sql template literal pour insérer le JSON de manière sécurisée
    // On utilise sql.raw() pour le JSON pour éviter que Drizzle essaie de le sérialiser
    // Cela évite les erreurs toISOString
    // On échappe les apostrophes pour éviter les injections SQL
    const escapedJson = jsonPayload.replace(/'/g, "''").replace(/\\/g, "\\\\");
    const jsonbValue = sql.raw(`'${escapedJson}'::jsonb`);
    
    if (existing) {
      await db.execute(
        sql`UPDATE ${onboardingResponses} SET payload = ${jsonbValue}, completed = ${completed ? true : existing.completed} WHERE id = ${existing.id}`
      );
    } else {
      await db.execute(
        sql`INSERT INTO ${onboardingResponses} (project_id, payload, completed) VALUES (${projectId}, ${jsonbValue}, ${completed})`
      );
    }
  } catch (error) {
    console.error("[Onboarding] Failed to upsert payload", {
      projectId,
      completed,
      error
    });
    return NextResponse.json(
      { error: "Échec de l’enregistrement de l’onboarding." },
      { status: 500 }
    );
  }

  const summary = summarizeOnboardingPayload(parsedPayload);
  const computedProgress = Math.max(10, Math.round(summary.completionRatio * 100));
  const progressToStore = completed ? 100 : Math.max(project.progress ?? 10, computedProgress);

  await db
    .update(projects)
    .set({
      progress: progressToStore
    })
    .where(eq(projects.id, projectId));

  // Si l'onboarding est complété, envoyer un email au staff
  if (completed && project) {
    try {
      await notifyProjectParticipants({
        projectId,
        excludeUserIds: [session.user.id],
        includeOwner: false,
        includeStaff: true,
        type: "onboarding_update",
        title: "Onboarding complété",
        body: `L'onboarding du projet "${project.name}" a été complété.`,
        metadata: {
          projectId
        }
      });
    } catch (error) {
      console.error("[Notifications] Échec de la notification onboarding_completed:", error);
    }

    // Envoyer un email à l'admin
    sendOnboardingCompletedEmailToAdmin(projectId, project.name).catch((error) => {
      console.error("[Email] Failed to send onboarding completed email:", error);
    });
  }

  return NextResponse.json({ ok: true });
}
