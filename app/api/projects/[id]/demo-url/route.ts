import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, projectStatusEnum } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { assertStaff, safeJson } from "@/lib/utils";
import { notifyProjectOwner } from "@/lib/notifications";
import { sendProspectDemoReadyEmailStatic } from "@/lib/emails";

const BodySchema = z.object({
  demoUrl: z.string().min(1, "demoUrl requis"),
  // Optionnel: permet de forcer un statut si besoin, sinon on met "demo_in_progress" par défaut
  status: z.enum(["onboarding", "demo_in_progress", "design", "build", "review", "delivered"]).optional()
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return safeJson({ error: "UNAUTHORIZED" }, 401);
  }

  try {
    assertStaff(session.user.role);
  } catch {
    return safeJson({ error: "FORBIDDEN" }, 403);
  }

  const { id: projectId } = await context.params;
  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return safeJson({ error: "INVALID_BODY", details: parsed.error.flatten() }, 400);
  }

  const { demoUrl, status } = parsed.data;

  const [updated] = await db
    .update(projects)
    .set({
      demoUrl,
      status: status ?? "demo_in_progress",
      // On peut ajuster la progression si besoin
      ...(status === "demo_in_progress" ? { progress: 60 } : {})
    })
    .where(eq(projects.id, projectId))
    .returning({
      id: projects.id,
      ownerId: projects.ownerId,
      name: projects.name,
      status: projects.status,
      demoUrl: projects.demoUrl
    });

  if (!updated) {
    return safeJson({ error: "NOT_FOUND" }, 404);
  }

  // Notifier le client que la démo est prête ou mise à jour
  await notifyProjectOwner(updated.id, {
    type: "onboarding_update",
    title: "Votre démo est prête",
    body: "Cliquez pour découvrir votre démo personnalisée.",
    metadata: { demoUrl: updated.demoUrl }
  }).catch(() => null);

  // Envoyer un email "démo prête" au prospect et logger le résultat
  // On n'échoue pas la requête si l'email ne part pas
  sendProspectDemoReadyEmailStatic(updated.ownerId)
    .then((res) => {
      if (!res?.success) {
        console.error("[Demo URL] Demo ready email not sent:", res?.error);
      }
    })
    .catch((e) => {
      console.error("[Demo URL] Failed to send demo ready email:", e);
    });

  return safeJson({ ok: true, project: updated }, 200);
}


