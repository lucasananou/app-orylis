import * as React from "react";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { useProjectSelection } from "@/lib/project-selection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/dashboard/project-card";
import { ProgressSteps } from "@/components/progress-steps";
import { ProjectEditorDialog } from "@/components/projects/project-editor-dialog";
import { Edit3 } from "lucide-react";

export default async function DashboardHomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const staff = isStaff(session.user.role);

  const projectRows = staff
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

  const rawOwners = staff
    ? await db.query.profiles.findMany({
        where: (profile, { eq: eqFn }) => eqFn(profile.role, "client"),
        columns: {
          id: profiles.id,
          fullName: profiles.fullName,
          company: profiles.company
        },
        orderBy: (profile, { asc: ascFn }) => ascFn(profile.fullName)
      })
    : [];

  const ownerOptions = staff
    ? rawOwners.map((owner) => ({
        id: owner.id,
        name: owner.fullName ?? owner.company ?? "Client"
      }))
    : [];

  const projectsData = projectRows.map((project) => ({
    id: project.id,
    name: project.name,
    status: project.status,
    progress: project.progress,
    dueDate: project.dueDate ? project.dueDate.toISOString() : null,
    ownerId: project.ownerId,
    ownerName: project.ownerName ?? null
  }));

  const onboardingProject = projectsData.find((project) => project.status === "onboarding");
  const onboardingProgress = onboardingProject?.progress ?? 0;

  const onboardingStepStates = onboardingProject
    ? onboardingProgress < 15
      ? (["current", "upcoming", "upcoming"] as const)
      : onboardingProgress < 35
        ? (["done", "current", "upcoming"] as const)
        : (["done", "done", "current"] as const)
    : (["done", "done", "done"] as const);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Suivez en un coup d’œil l’avancement de vos projets Orylis."
        actions={
          <div className="flex items-center gap-3">
            {staff && (
              <ProjectEditorDialog
                mode="create"
                owners={ownerOptions}
                trigger={
                  <Button size="lg" className="rounded-full">
                    Nouveau projet
                  </Button>
                }
              />
            )}
            <Button size="lg" variant="outline" className="rounded-full">
              Planifier un point
            </Button>
          </div>
        }
      />

      <section className="space-y-6">
        <Card className="border border-border/70 bg-white/90">
          <CardHeader>
            <CardTitle>{staff ? "Tous les projets actifs" : "Mes projets"}</CardTitle>
            <CardDescription>
              {staff
                ? "Vue globale des projets clients et de leur statut."
                : "Suivi partagé avec l’équipe Orylis en temps réel."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardProjects
              projects={projectsData}
              role={session.user.role}
              ownerOptions={ownerOptions}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-border/70">
          <CardHeader className="pb-3">
            <CardTitle>Onboarding</CardTitle>
            <CardDescription>
              {onboardingProject
                ? `Le projet ${onboardingProject.name} est en phase d’onboarding.`
                : "Aucun onboarding en cours pour le moment."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressSteps
              steps={[
                {
                  id: "brief",
                  label: "Brief stratégique",
                  description: "Vision et objectifs",
                  status: onboardingStepStates[0]
                },
                {
                  id: "assets",
                  label: "Assets & contenu",
                  description: "Marque, contenus, médias",
                  status: onboardingStepStates[1]
                },
                {
                  id: "validation",
                  label: "Validation",
                  description: "Point de lancement production",
                  status: onboardingStepStates[2]
                }
              ]}
            />
            <Button className="mt-6" size="lg" variant="outline" asChild>
              <a href="/onboarding">
                {onboardingProject ? "Continuer l’onboarding" : "Consulter l’onboarding"}
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader className="pb-3">
            <CardTitle>Canaux & Support</CardTitle>
            <CardDescription>Vos accès rapides pour collaborer avec nous.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex justify-between rounded-2xl bg-muted/40 px-4 py-3">
              <span>Slack partagé</span>
              <Button size="sm" variant="ghost">
                Ouvrir
              </Button>
            </div>
            <div className="flex justify-between rounded-2xl bg-muted/40 px-4 py-3">
              <span>Email support</span>
              <Button size="sm" variant="ghost">
                hello@orylis.fr
              </Button>
            </div>
            <div className="flex justify-between rounded-2xl bg-muted/40 px-4 py-3">
              <span>Documentation projet</span>
              <Button size="sm" variant="ghost">
                Notion
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

interface DashboardProjectsProps {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    dueDate: string | null;
    ownerId: string;
    ownerName: string | null;
  }>;
  role: "client" | "staff";
  ownerOptions: Array<{ id: string; name: string }>;
}

function DashboardProjects({ projects, role, ownerOptions }: DashboardProjectsProps) {
  "use client";

  const { projectId, setProjectId, ready } = useProjectSelection();
  const staff = isStaff(role);
  const hasProjects = projects.length > 0;

  React.useEffect(() => {
    if (!ready || staff || !hasProjects) {
      return;
    }
    if (!projectId) {
      setProjectId(projects[0]?.id ?? null);
    }
  }, [hasProjects, projectId, projects, ready, setProjectId, staff]);

  if (!ready) {
    return (
      <div className="rounded-2xl border border-border/70 bg-white/80 p-6 text-center text-sm text-muted-foreground">
        Chargement des projets…
      </div>
    );
  }

  if (!hasProjects) {
    return (
      <EmptyState
        icon={ClipboardIcon}
        title="Aucun projet en cours"
        description="Lancez un onboarding pour démarrer votre premier projet."
      />
    );
  }

  const activeProjectId = staff ? projectId : projectId ?? projects[0].id;

  const filteredProjects =
    activeProjectId && (!staff || projectId)
      ? projects.filter((project) => project.id === activeProjectId)
      : projects;

  if (filteredProjects.length === 0) {
    return (
      <EmptyState
        icon={ClipboardIcon}
        title="Aucun projet sélectionné"
        description="Choisissez un projet via le sélecteur en haut de page."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredProjects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          name={project.name}
          status={project.status}
          progress={project.progress}
          dueDate={project.dueDate}
          roleLabel={
            staff
              ? project.ownerName
                ? `Client · ${project.ownerName}`
                : "Client"
              : undefined
          }
          editTrigger={
            staff ? (
              <ProjectEditorDialog
                mode="edit"
                owners={ownerOptions}
                project={{
                  id: project.id,
                  name: project.name,
                  status: project.status,
                  progress: project.progress,
                  dueDate: project.dueDate,
                  ownerId: project.ownerId
                }}
                trigger={
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Éditer le projet"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                }
              />
            ) : undefined
          }
        />
      ))}
    </div>
  );
}

function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-3-2v4m-7 4h12m-12 4h8m3-9a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2h2" />
    </svg>
  );
}

