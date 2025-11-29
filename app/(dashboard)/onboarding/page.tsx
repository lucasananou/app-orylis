import { redirect } from "next/navigation";
import { and, eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects } from "@/lib/schema";
import { EmptyState } from "@/components/empty-state";
import { OnboardingStartButton } from "@/components/onboarding-start-button";
import { PageHeader } from "@/components/page-header";
import { ClipboardList } from "lucide-react";
import { OnboardingForm } from "@/components/form/onboarding-form";
import { ProspectOnboardingForm } from "@/components/form/prospect-onboarding-form";
import { Card, CardContent } from "@/components/ui/card";
import { isStaff, isProspect } from "@/lib/utils";

// Cache 10 secondes : l'onboarding peut être modifié fréquemment
export const revalidate = 10;

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
    .leftJoin(
      onboardingResponses,
      and(
        eq(onboardingResponses.projectId, projects.id),
        // Si c'est un prospect, on veut sa réponse prospect
        // Si c'est un client, on veut sa réponse client
        // Si c'est le staff, on prend tout (ou on pourrait affiner)
        isProspectUser
          ? eq(onboardingResponses.type, "prospect")
          : eq(onboardingResponses.type, "client")
      )
    )
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

  return { staff, role: user.role, userEmail: user.email, onboardingProjects: onboardingProjectsArray, projectEntries };
}

export default async function OnboardingPage(): Promise<JSX.Element> {
  const { staff, role, userEmail, onboardingProjects, projectEntries } = await loadOnboardingData();

  // Pour les prospects : si pas de projet en onboarding, rediriger vers le dashboard
  // (le dashboard gère les redirections selon le statut)
  if (onboardingProjects.length === 0 && isProspect(role)) {
    redirect("/");
  }

  if (onboardingProjects.length === 0) {
    return (
      <>
        <div className="mx-auto max-w-3xl pt-8 sm:pt-12">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lancement de votre projet 🚀</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Bienvenue dans votre espace de production. Pour démarrer la création de votre site, nous avons besoin de comprendre votre vision.
            </p>
          </div>

          <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 shadow-sm">
            <CardContent className="flex flex-col items-center text-center py-12 px-6 sm:px-12">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <ClipboardList className="h-8 w-8 text-blue-600" />
              </div>

              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                Cahier des charges & Préférences
              </h2>
              <p className="text-slate-500 max-w-md mb-8">
                Ce formulaire interactif nous permettra de collecter vos contenus, vos préférences de design et vos accès techniques. C'est la pierre angulaire de votre projet.
              </p>

              {staff ? (
                <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                  En tant que staff, vous devez initier le projet depuis le back-office.
                </p>
              ) : (
                <div className="w-full max-w-sm">
                  <OnboardingStartButton />
                  <p className="text-xs text-slate-400 mt-4">
                    Temps estimé : 10-15 minutes · Sauvegarde automatique
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-lg font-bold text-slate-900">1</div>
              <h3 className="font-medium text-slate-900">Vos informations</h3>
              <p className="text-sm text-slate-500">Identité visuelle, logo et coordonnées.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-lg font-bold text-slate-900">2</div>
              <h3 className="font-medium text-slate-900">Vos contenus</h3>
              <p className="text-sm text-slate-500">Pages, textes et structure du site.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-lg font-bold text-slate-900">3</div>
              <h3 className="font-medium text-slate-900">Validation</h3>
              <p className="text-sm text-slate-500">Revue finale avant lancement production.</p>
            </div>
          </div>
        </div>
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
        <ProspectOnboardingForm projects={projectEntries} userEmail={userEmail} />
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

