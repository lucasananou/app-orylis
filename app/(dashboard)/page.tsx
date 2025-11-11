import * as React from "react";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ProgressSteps } from "@/components/progress-steps";
import { ProjectEditorDialog } from "@/components/projects/project-editor-dialog";
import { DashboardProjects } from "@/components/dashboard/dashboard-projects";

export const dynamic = "force-dynamic";

async function loadDashboardData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;
  const staff = isStaff(user.role);

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
        .where(eq(projects.ownerId, user.id))
        .orderBy(asc(projects.createdAt));

  const rawOwners = staff
    ? await db.query.profiles.findMany({
        where: (profile, { eq: eqFn }) => eqFn(profile.role, "client"),
        columns: {
          id: true,
          fullName: true,
          company: true
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
    dueDate: project.dueDate ? new Date(project.dueDate).toISOString() : null,
    ownerId: project.ownerId,
    ownerName: project.ownerName ?? null
  }));

  const onboardingProject = projectsData.find((project) => project.status === "onboarding") ?? null;
  const onboardingProgress = onboardingProject?.progress ?? 0;

  const onboardingStepStates = onboardingProject
    ? onboardingProgress < 15
      ? (["current", "upcoming", "upcoming"] as const)
      : onboardingProgress < 35
        ? (["done", "current", "upcoming"] as const)
        : (["done", "done", "current"] as const)
    : (["done", "done", "done"] as const);

  return {
    role: user.role,
    staff,
    ownerOptions,
    projectsData,
    onboardingProject,
    onboardingStepStates
  };
}

export default async function DashboardHomePage(): Promise<JSX.Element> {
  const { role, staff, ownerOptions, projectsData, onboardingProject, onboardingStepStates } =
    await loadDashboardData();

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
              role={role}
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

