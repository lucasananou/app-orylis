import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects } from "@/lib/schema";
import {
  OnboardingFinalSchema,
  OnboardingPayloadSchema,
  type OnboardingFinalPayload,
  type OnboardingPayload
} from "@/lib/zod-schemas";
import { assertUserCanAccessProject } from "@/lib/utils";

function sanitizePayload(payload: OnboardingPayload | OnboardingFinalPayload) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { confirm, ...rest } = payload as OnboardingFinalPayload & OnboardingPayload;
  return rest as OnboardingPayload;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "Paramètre projectId requis." }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      ownerId: true,
      status: true,
      progress: true
    },
    with: {
      onboardingResponses: {
        columns: {
          id: true,
          payload: true,
          completed: true,
          updatedAt: true
        }
      }
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

  const latestResponse = project.onboardingResponses.at(0) ?? null;

  return NextResponse.json({
    payload: (latestResponse?.payload as OnboardingPayload | null) ?? null,
    completed: latestResponse?.completed ?? false,
    updatedAt: latestResponse?.updatedAt ?? null,
    projectStatus: project.status,
    progress: project.progress
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    typeof body.projectId !== "string" ||
    !body.projectId
  ) {
    return NextResponse.json({ error: "Payload invalide (projectId requis)." }, { status: 400 });
  }

  const projectId: string = body.projectId;
  const completedRequest: boolean = Boolean(body.completed);
  const incomingPayload = (body.payload ?? {}) as Partial<OnboardingPayload>;
  const confirmFlag: boolean = Boolean(body.confirm ?? incomingPayload?.confirm);

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      ownerId: true,
      progress: true,
      status: true
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

  const partialValidation = OnboardingPayloadSchema.partial().safeParse(incomingPayload);
  if (!partialValidation.success) {
    return NextResponse.json(
      { error: "Payload onboarding invalide.", details: partialValidation.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await db.query.onboardingResponses.findFirst({
    where: eq(onboardingResponses.projectId, projectId),
    columns: {
      id: true,
      payload: true,
      completed: true
    }
  });

  const mergedPayload = {
    ...(existing?.payload as OnboardingPayload | undefined),
    ...partialValidation.data
  };

  if (completedRequest) {
    if (!confirmFlag) {
      return NextResponse.json(
        { error: "Merci de confirmer la validation finale." },
        { status: 400 }
      );
    }
    const finalValidation = OnboardingFinalSchema.safeParse({
      ...mergedPayload,
      confirm: true
    });
    if (!finalValidation.success) {
      return NextResponse.json(
        { error: "Les informations d’onboarding sont incomplètes.", details: finalValidation.error.flatten() },
        { status: 400 }
      );
    }
    const finalPayload = sanitizePayload(finalValidation.data);

    await db.transaction(async (tx) => {
      if (existing) {
        await tx
          .update(onboardingResponses)
          .set({
            payload: finalPayload,
            completed: true
          })
          .where(eq(onboardingResponses.id, existing.id));
      } else {
        await tx.insert(onboardingResponses).values({
          projectId,
          payload: finalPayload,
          completed: true
        });
      }

      await tx
        .update(projects)
        .set({
          status: "design",
          progress: Math.max(project.progress ?? 0, 40)
        })
        .where(eq(projects.id, projectId));
    });

    return NextResponse.json({ ok: true, completed: true });
  }

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(onboardingResponses)
        .set({
          payload: sanitizePayload(mergedPayload),
          completed: existing.completed
        })
        .where(and(eq(onboardingResponses.projectId, projectId), eq(onboardingResponses.id, existing.id)));
    } else {
      await tx.insert(onboardingResponses).values({
        projectId,
        payload: sanitizePayload(mergedPayload),
        completed: false
      });
    }
  });

  return NextResponse.json({ ok: true, completed: false });
}
