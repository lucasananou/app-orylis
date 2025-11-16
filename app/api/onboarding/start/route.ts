import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, profiles, projects } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const user = session.user!;

  try {
    // S'il existe déjà un projet en onboarding pour cet utilisateur, ne pas en créer un autre
    const existing = await db.query.projects.findFirst({
      where: (p, { and, eq: eqFn }) => and(eqFn(p.ownerId, user.id), eqFn(p.status, "onboarding")),
      columns: { id: true, name: true }
    });

    if (existing) {
      return NextResponse.json({ ok: true, projectId: existing.id, created: false });
    }

    // Récupérer éventuellement le nom d'entreprise pour nommer le projet
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: { fullName: true, company: true }
    });

    const projectName =
      profile?.company?.trim() && profile.company.trim().length > 1
        ? `Site ${profile.company.trim()}`
        : profile?.fullName?.trim() && profile.fullName.trim().length > 1
          ? `Site ${profile.fullName.trim()}`
          : "Mon site web";

    // Créer un nouveau projet en statut onboarding
    const [newProject] = await db
      .insert(projects)
      .values({
        ownerId: user.id,
        name: projectName,
        status: "onboarding",
        progress: 0
      })
      .returning({ id: projects.id });

    // Créer l'entrée d'onboarding vide (brouillon)
    await db.insert(onboardingResponses).values({
      projectId: newProject.id,
      payload: {},
      completed: false
    });

    return NextResponse.json({ ok: true, projectId: newProject.id, created: true });
  } catch (error) {
    console.error("[Onboarding/Start] Error:", error);
    return NextResponse.json({ error: "Impossible de démarrer l’onboarding." }, { status: 500 });
  }
}


