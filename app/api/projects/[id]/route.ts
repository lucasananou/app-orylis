import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, profiles } from "@/lib/schema";
import { auth } from "@/auth";
import { notifyProjectParticipants } from "@/lib/notifications";
import { sendProjectUpdatedEmail, sendProspectDemoReadyEmailStaticTo } from "@/lib/emails";
import { isStaff, isProspect } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const item = await db.query.projects.findFirst({
    where: (t, { eq }) => eq(t.id, id)
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: item });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<{
    name: string;
    status: "onboarding" | "demo_in_progress" | "design" | "build" | "review" | "delivered";
    progress: number;
    dueDate: string | null;
    demoUrl: string | null;
    hostingExpiresAt: string | null;
    maintenanceActive: boolean;
    deliveredAt: string | null;
  }>;

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.status === "string") update.status = body.status;
  if (typeof body.progress === "number") update.progress = body.progress;
  if (body.dueDate !== undefined) update.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.demoUrl !== undefined) update.demoUrl = body.demoUrl || null;
  if (body.hostingExpiresAt !== undefined) update.hostingExpiresAt = body.hostingExpiresAt ? new Date(body.hostingExpiresAt) : null;
  if (typeof body.maintenanceActive === "boolean") update.maintenanceActive = body.maintenanceActive;
  if (body.deliveredAt !== undefined) update.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  // Récupérer le projet avant la mise à jour
  const projectBefore = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    columns: {
      name: true,
      ownerId: true,
      status: true,
      progress: true,
      demoUrl: true
    }
  });

  if (!projectBefore) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  await db.update(projects).set(update).where(eq(projects.id, id));

  // Récupérer le projet après la mise à jour
  const projectAfter = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    columns: {
      name: true,
      status: true,
      progress: true,
      demoUrl: true,
      ownerId: true
    }
  });

  // Envoi systématique de l'email "Démo prête" dès qu'un demoUrl est fourni,
  // même si la valeur n'a pas changé et quel que soit le rôle.
  const demoProvided = typeof body.demoUrl !== "undefined";
  if (demoProvided && projectAfter?.ownerId) {
    // Récupérer l'email du propriétaire ici (une seule requête ciblée)
    const owner = await db.query.authUsers.findFirst({
      where: (t, { eq }) => eq(t.id, projectAfter.ownerId),
      columns: { email: true }
    });

    sendProspectDemoReadyEmailStaticTo(owner?.email ?? "")
      .then((res) => {
        if (!res?.success) {
          console.error("[Email] Demo ready email not sent:", res?.error);
        }
      })
      .catch((error) => {
        console.error("[Email] Failed to send prospect demo ready email:", error);
      });
  }

  // Construire le message de mise à jour
  const updateMessages: string[] = [];
  const statusChanged = update.status && update.status !== projectBefore.status;
  const statusLabels: Record<string, string> = {
    onboarding: "Onboarding",
    demo_in_progress: "Démo en création",
    design: "Design",
    build: "Développement",
    review: "Review",
    delivered: "Livré"
  };

  if (statusChanged) {
    updateMessages.push(
      `Statut : ${statusLabels[projectBefore.status] ?? projectBefore.status} → ${statusLabels[update.status as string] ?? update.status}`
    );
  }
  if (update.progress && typeof update.progress === "number" && update.progress !== projectBefore.progress) {
    updateMessages.push(`Progression : ${projectBefore.progress}% → ${update.progress}%`);
  }
  if (update.name && update.name !== projectBefore.name) {
    updateMessages.push(`Nom : ${projectBefore.name} → ${update.name}`);
  }

  const updateMessage = updateMessages.length > 0 ? updateMessages.join(", ") : "Mise à jour du projet";

  // Notifier dans l'app

  try {
    if (statusChanged) {
      // Notification spéciale pour changement de statut
      await notifyProjectParticipants({
        projectId: id,
        excludeUserIds: [session.user.id],
        includeOwner: true, // Le client doit être notifié du changement de statut
        includeStaff: false, // Le staff a fait le changement, pas besoin de le notifier
        type: "onboarding_update",
        title: "Projet mis à jour",
        body: `Votre projet "${projectBefore.name}" est passé en phase ${statusLabels[update.status as string] ?? update.status}.`,
        metadata: {
          projectId: id,
          status: update.status,
          previousStatus: projectBefore.status
        }
      });
    } else if (updateMessages.length > 0) {
      // Notification pour autres mises à jour (progression, nom, etc.)
      await notifyProjectParticipants({
        projectId: id,
        excludeUserIds: [session.user.id],
        includeOwner: true,
        includeStaff: false,
        type: "onboarding_update",
        title: "Projet mis à jour",
        body: updateMessage,
        metadata: {
          projectId: id
        }
      });
    }
  } catch (error) {
    console.error("[Notifications] Échec de la notification project_updated:", error);
  }

  // Envoyer un email au client si c'est le staff qui a mis à jour
  if (isStaff(session.user.role) && projectAfter && updateMessages.length > 0) {
    sendProjectUpdatedEmail(id, projectAfter.name, updateMessage, projectBefore.ownerId).catch(
      (error) => {
        console.error("[Email] Failed to send project updated email:", error);
      }
    );
  }

  return NextResponse.json({ ok: true });
}