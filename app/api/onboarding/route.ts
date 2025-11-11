// app/api/onboarding/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects } from "@/lib/schema";
import { assertUserCanAccessProject } from "@/lib/utils";
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

  const safePayload = validation.data as completed
    ? OnboardingFinalPayload
    : OnboardingPayload;

  const existing = await db
    .select({
      id: onboardingResponses.id,
      completed: onboardingResponses.completed
    })
    .from(onboardingResponses)
    .where(eq(onboardingResponses.projectId, projectId))
    .then((rows) => rows.at(0) ?? null);

  if (existing) {
    await db
      .update(onboardingResponses)
      .set({
        payload: safePayload,
        completed: completed ? true : existing.completed
      })
      .where(eq(onboardingResponses.id, existing.id));
  } else {
    await db.insert(onboardingResponses).values({
      projectId,
      payload: safePayload,
      completed
    });
  }

  const summary = summarizeOnboardingPayload(safePayload as Record<string, unknown> | null);
  const computedProgress = Math.max(10, Math.round(summary.completionRatio * 100));
  const progressToStore = completed ? 100 : Math.max(project.progress ?? 10, computedProgress);

  await db
    .update(projects)
    .set({
      progress: progressToStore
    })
    .where(eq(projects.id, projectId));

  return NextResponse.json({ ok: true });
}
