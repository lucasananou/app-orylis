import { redirect } from "next/navigation";
import { and, eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects } from "@/lib/schema";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ClipboardList } from "lucide-react";
import { OnboardingForm } from "@/components/form/onboarding-form";
import { ProspectOnboardingForm } from "@/components/form/prospect-onboarding-form";
import { isStaff, isProspect } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadOnboardingData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;
  const staff = isStaff(user.role);
  const isProspectUser = isProspect(user.role);

  // Pour les prospects : vérifier s'ils ont un projet avec un statut autre que "onboarding"
  // Si oui, rediriger vers le dashboard qui gère les redirections automatiques
  if (isProspectUser) {
    const prospectProject = await db.query.projects.findFirst({
      where: eq(projects.ownerId, user.id),
      columns: { id: true, status: true, demoUrl: true },
      orderBy: (projects, { asc }) => [asc(projects.createdAt)]
    });

    // Si le prospect a un projet qui n'est plus en onboarding, rediriger vers le dashboard
    if (prospectProject && prospectProject.status !== "onboarding") {
      redirect("/");
    }
  }

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      progress: projects.progress,
      responseId: onboardingResponses.id,
      responsePayload: onboardingResponses.payload,
      responseCompleted: onboardingResponses.completed,
      responseUpdatedAt: onboardingResponses.updatedAt
    })
    .from(projects)
    .leftJoin(onboardingResponses, eq(onboardingResponses.projectId, projects.id))
    .where(
      staff
        ? eq(projects.status, "onboarding")
        : and(eq(projects.status, "onboarding"), eq(projects.ownerId, user.id))
    )
    .orderBy(asc(projects.createdAt));

  const onboardingProjectsMap = new Map<
    string,
    {
      id: string;
      name: string;
      status: string;
      progress: number;
      responseId: string | null;
      responsePayload: unknown;
      responseCompleted: boolean;
      responseUpdatedAt: Date | null;
    }
  >();

  for (const row of projectRows) {
    const existing = onboardingProjectsMap.get(row.id);
    if (existing) {
      // Already have best response; keep earliest (first) entry
      continue;
    }
    onboardingProjectsMap.set(row.id, {
      id: row.id,
      name: row.name,
      status: row.status,
      progress: row.progress,
      responseId: row.responseId ?? null,
      responsePayload: row.responsePayload ?? null,
      responseCompleted: row.responseCompleted ?? false,
      responseUpdatedAt: row.responseUpdatedAt ?? null
    });
  }

  const onboardingProjectsArray = Array.from(onboardingProjectsMap.values());

  const projectEntries = onboardingProjectsArray.map((project) => ({
    id: project.id,
    name: project.name,
    status: project.status,
    progress: project.progress,
    payload: (project.responsePayload as Record<string, unknown> | null) ?? null,
    completed: project.responseCompleted,
    updatedAt: project.responseUpdatedAt ? project.responseUpdatedAt.toISOString() : null
  }));

  return { staff, role: user.role, onboardingProjects: onboardingProjectsArray, projectEntries };
}

export default async function OnboardingPage(): Promise<JSX.Element> {
  const { staff, role, onboardingProjects, projectEntries } = await loadOnboardingData();

  // Pour les prospects : si pas de projet en onboarding, rediriger vers le dashboard
  // (le dashboard gère les redirections selon le statut)
  if (onboardingProjects.length === 0 && isProspect(role)) {
    redirect("/");
  }

  if (onboardingProjects.length === 0) {
    return (
      <>
        <PageHeader
          title="Onboarding projet"
          description="Toutes les informations nécessaires pour lancer la production sont déjà renseignées."
        />
        <EmptyState
          icon={ClipboardList}
          title="Pas d’onboarding actif"
          description={
            staff
              ? "Sélectionnez un projet à mettre en onboarding dans le back-office."
              : "Votre onboarding est déjà complété ou en cours d’orchestration côté Orylis."
          }
        />
      </>
    );
  }

  // Pour les prospects : afficher le formulaire simplifié
  // Pour les clients/staff : afficher le formulaire complet
  const isProspectUser = isProspect(role);

  return (
    <>
      {isProspectUser ? (
        // Pour les prospects : titre optimisé directement dans le formulaire (pas de PageHeader séparé)
        <ProspectOnboardingForm projects={projectEntries} />
      ) : (
        <>
          <PageHeader
            title="Onboarding projet"
            description="Renseignez les informations clés pour lancer sereinement votre projet Orylis."
          />
          <OnboardingForm projects={projectEntries} role={role} />
        </>
      )}
    </>
  );
}

