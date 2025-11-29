// app/api/onboarding/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq, sql, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects, profiles } from "@/lib/schema";
import { notifyProjectParticipants } from "@/lib/notifications";
import {
  sendOnboardingCompletedEmailToAdmin,
  sendProspectOnboardingCompletedEmail
} from "@/lib/emails";
import { assertUserCanAccessProject, isStaff, isProspect } from "@/lib/utils";
import {
  OnboardingFinalSchema,
  OnboardingPayloadSchema,
  OnboardingDraftSchema,
  ProspectOnboardingFinalSchema,
  ProspectOnboardingDraftSchema,
  type OnboardingFinalPayload,
  type OnboardingPayload,
  type ProspectOnboardingPayload
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

  // Détecter si c'est un payload prospect ou client
  // Les payloads prospect ont des champs spécifiques (activity, siteGoal, welcomePhrase, etc.)
  const isProspectPayload =
    "activity" in payload ||
    "siteGoal" in payload ||
    "welcomePhrase" in payload ||
    ("mainServices" in payload && Array.isArray(payload.mainServices));

  // Pour les brouillons (autosave), utiliser un schéma permissif
  // Pour la validation finale, utiliser le schéma strict
  const validation = completed
    ? isProspectPayload
      ? ProspectOnboardingFinalSchema.safeParse(payload)
      : OnboardingFinalSchema.safeParse(payload)
    : isProspectPayload
      ? ProspectOnboardingDraftSchema.safeParse(payload)
      : OnboardingDraftSchema.safeParse(payload);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Payload onboarding invalide.", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Pour les brouillons, on accepte un payload partiel
  // Pour la validation finale, on utilise le type strict
  const safePayload:
    | OnboardingPayload
    | OnboardingFinalPayload
    | ProspectOnboardingPayload
    | Record<string, unknown> = completed
      ? isProspectPayload
        ? (validation.data as ProspectOnboardingPayload)
        : (validation.data as OnboardingFinalPayload)
      : (validation.data as Record<string, unknown>);

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

  const type = isProspectPayload ? "prospect" : "client";

  const existing = await db
    .select({
      id: onboardingResponses.id,
      completed: onboardingResponses.completed
    })
    .from(onboardingResponses)
    .where(
      and(
        eq(onboardingResponses.projectId, projectId),
        eq(onboardingResponses.type, type)
      )
    )
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
        sql`INSERT INTO ${onboardingResponses} (project_id, type, payload, completed) VALUES (${projectId}, ${type}, ${jsonbValue}, ${completed})`
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

  // Récupérer le rôle de l'utilisateur pour déterminer le nouveau statut (en parallèle avec le calcul du summary)
  const [userProfile] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.id, session.user.id),
      columns: { role: true }
    }),
    // Mettre à jour le projet immédiatement
    db
      .update(projects)
      .set({
        progress: progressToStore,
        ...(completed && isProspect(session.user.role) ? { status: "demo_in_progress" } : {})
      })
      .where(eq(projects.id, projectId))
  ]);

  const isProspectUser = isProspect(userProfile?.role ?? session.user.role);

  // Synchroniser les données de l'onboarding vers le profil utilisateur (fullName, company, phone)
  // Cela permet d'afficher ces informations dans les cartes clients
  if (completed && parsedPayload) {
    const profileUpdate: {
      fullName?: string;
      company?: string;
      phone?: string;
    } = {};

    if (typeof parsedPayload.fullName === "string" && parsedPayload.fullName.trim()) {
      profileUpdate.fullName = parsedPayload.fullName.trim();
    }
    // Gérer à la fois "company" (client) et "companyName" (prospect)
    const companyValue = (parsedPayload.company as string | undefined) ?? (parsedPayload.companyName as string | undefined);
    if (typeof companyValue === "string" && companyValue.trim()) {
      profileUpdate.company = companyValue.trim();
    }
    if (typeof parsedPayload.phone === "string" && parsedPayload.phone.trim()) {
      profileUpdate.phone = parsedPayload.phone.trim();
    }

    // Mettre à jour le profil si au moins un champ est présent
    if (Object.keys(profileUpdate).length > 0) {
      db.update(profiles)
        .set(profileUpdate)
        .where(eq(profiles.id, session.user.id))
        .catch((error) => {
          console.error("[Onboarding] Failed to update profile:", error);
        });
    }
  }

  // Attendre les notifications et emails pour garantir l'envoi (Serverless)
  if (completed && project) {
    try {
      // Si c'est un onboarding CLIENT (pas prospect), on génère le Brief v1
      if (!isProspectUser && parsedPayload) {
        const { generateBriefContentFromPayload } = await import("@/lib/brief-generator");
        const { projectBriefs } = await import("@/lib/schema");

        const briefContent = generateBriefContentFromPayload(parsedPayload as any); // Cast as any to avoid strict type issues with partial payloads

        // Créer le Brief v1
        await db.insert(projectBriefs).values({
          projectId,
          version: 1,
          content: briefContent,
          status: "sent", // "sent" signifie "En attente de validation client" (ou ici "En attente de revue Orylis" ?)
          // Disons "sent" pour l'instant, ou on pourrait ajouter un statut "pending_review"
          // Pour simplifier : "sent" = le brief est émis. 
          // Mais ici c'est l'inverse, c'est le client qui émet.
          // On va dire que v1 est "draft" pour l'admin, ou "sent" pour que le client le voie ?
          // Le user a dit : "L'onboarding devient le premier brief... une fois les modifs faites, je veux pouvoir côté admin dire que c'est fait"
          // Donc v1 = Onboarding brut.
          // L'admin va le relire et créer la v2.
          // Donc v1 peut être "approved" par défaut (c'est ce que le client a dit) ?
          // Ou "draft" ?
          // Allons sur "sent" (envoyé à l'admin).
        });
        console.log("[Onboarding] Brief v1 generated");
      }

      await Promise.all([
        notifyProjectParticipants({
          projectId,
          excludeUserIds: [session.user.id],
          includeOwner: true,
          includeStaff: true,
          type: "onboarding_update",
          title: "Onboarding complété",
          body: `L'onboarding du projet "${project.name}" a été complété.`,
          metadata: {
            projectId
          }
        }),
        sendOnboardingCompletedEmailToAdmin(projectId, project.name),
        isProspectUser
          ? sendProspectOnboardingCompletedEmail(session.user.id, project.name)
          : Promise.resolve()
      ]);
      console.log("[Onboarding] Emails sent successfully");
    } catch (error) {
      console.error("[Onboarding] Failed to send emails/notifications or generate brief:", error);
      // On ne bloque pas la réponse si les emails échouent, mais on log l'erreur
    }
  }

  return NextResponse.json({ ok: true });
}
