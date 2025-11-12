import * as React from "react";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  billingLinks,
  files,
  notifications,
  onboardingResponses,
  projects,
  profiles,
  tickets
} from "@/lib/schema";
import { summarizeOnboardingPayload } from "@/lib/onboarding-summary";
import { countUnreadNotifications } from "@/lib/notifications";
import { formatDate, formatProgress, isStaff } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ProjectEditorDialog } from "@/components/projects/project-editor-dialog";
import { DashboardProjects } from "@/components/dashboard/dashboard-projects";
import { ClientCreateDialog } from "@/components/admin/client-create-dialog";
import {
  DashboardHighlights,
  type DashboardHighlightItem
} from "@/components/dashboard/dashboard-highlights";
import {
  DashboardActivity,
  type DashboardActivityItem
} from "@/components/dashboard/dashboard-activity";
import { DashboardOnboardingCard } from "@/components/dashboard/dashboard-onboarding-card";

// Cache les données du dashboard pendant 30 secondes pour améliorer les performances
export const revalidate = 30;

const ticketStatusLabels: Record<"open" | "in_progress" | "done", string> = {
  open: "Ouvert",
  in_progress: "En cours",
  done: "Résolu"
};

interface DashboardProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string | null;
  ownerId: string;
  ownerName: string | null;
  createdAt: string | null;
}

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
          ownerName: profiles.fullName,
          createdAt: projects.createdAt
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
          ownerName: profiles.fullName,
          createdAt: projects.createdAt
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

  const projectsData: DashboardProject[] = projectRows.map((project) => ({
    id: project.id,
    name: project.name,
    status: project.status,
    progress: project.progress,
    dueDate: project.dueDate ? new Date(project.dueDate).toISOString() : null,
    ownerId: project.ownerId,
    ownerName: project.ownerName ?? null,
    createdAt: project.createdAt ? project.createdAt.toISOString() : null
  }));

  const onboardingProject = projectsData.find((project) => project.status === "onboarding") ?? null;

  const projectIds = projectsData.map((project) => project.id);

  let onboardingPayload: Record<string, unknown> | null = null;
  let onboardingUpdatedAt: Date | null = null;

  if (onboardingProject) {
    const responseRow = await db
      .select({
        payload: onboardingResponses.payload,
        updatedAt: onboardingResponses.updatedAt
      })
      .from(onboardingResponses)
      .where(eq(onboardingResponses.projectId, onboardingProject.id))
      .then((rows) => rows.at(0) ?? null);

    onboardingPayload = (responseRow?.payload as Record<string, unknown> | null) ?? null;
    onboardingUpdatedAt = responseRow?.updatedAt ?? null;
  }

  const onboardingSummary = onboardingProject
    ? summarizeOnboardingPayload(onboardingPayload)
    : null;

  let openTicketsCount = 0;
  let recentActivity: DashboardActivityItem[] = [];

  let unreadNotifications = 0;

  if (projectIds.length > 0) {
    const [
      openTicketsRows,
      recentTicketsRows,
      recentFilesRows,
      recentBillingRows,
      recentNotificationsRows
    ] = await Promise.all([
      db
        .select({ value: sql<number>`count(*)` })
        .from(tickets)
        .where(and(inArray(tickets.projectId, projectIds), eq(tickets.status, "open"))),
      db
        .select({
          id: tickets.id,
          title: tickets.title,
          status: tickets.status,
          projectName: projects.name,
          updatedAt: tickets.updatedAt
        })
        .from(tickets)
        .innerJoin(projects, eq(tickets.projectId, projects.id))
        .where(inArray(tickets.projectId, projectIds))
        .orderBy(desc(tickets.updatedAt))
        .limit(5),
      db
        .select({
          id: files.id,
          label: files.label,
          projectName: projects.name,
          createdAt: files.createdAt
        })
        .from(files)
        .innerJoin(projects, eq(files.projectId, projects.id))
        .where(inArray(files.projectId, projectIds))
        .orderBy(desc(files.createdAt))
        .limit(5),
      db
        .select({
          id: billingLinks.id,
          label: billingLinks.label,
          projectName: projects.name,
          createdAt: billingLinks.createdAt
        })
        .from(billingLinks)
        .innerJoin(projects, eq(billingLinks.projectId, projects.id))
        .where(inArray(billingLinks.projectId, projectIds))
        .orderBy(desc(billingLinks.createdAt))
        .limit(5),
      db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          body: notifications.body,
          createdAt: notifications.createdAt
        })
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(4)
    ]);

    openTicketsCount = openTicketsRows.at(0)?.value ?? 0;

    const ticketActivities: DashboardActivityItem[] = recentTicketsRows.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: "ticket",
      title: ticket.title,
      description: `${ticketStatusLabels[ticket.status]} · ${ticket.projectName}`,
      date: ticket.updatedAt.toISOString()
    }));

    const fileActivities: DashboardActivityItem[] = recentFilesRows.map((file) => ({
      id: `file-${file.id}`,
      type: "file",
      title: file.label ?? "Fichier ajouté",
      description: file.projectName,
      date: file.createdAt.toISOString()
    }));

    const billingActivities: DashboardActivityItem[] = recentBillingRows.map((link) => ({
      id: `billing-${link.id}`,
      type: "billing",
      title: link.label,
      description: link.projectName,
      date: link.createdAt.toISOString()
    }));

    const typeMap: Record<string, DashboardActivityItem["type"]> = {
      ticket_created: "ticket",
      ticket_updated: "ticket",
      file_uploaded: "file",
      billing_added: "billing",
      onboarding_update: "onboarding",
      system: "system"
    };

    const notificationActivities: DashboardActivityItem[] = recentNotificationsRows.map((notification) => ({
      id: `notification-${notification.id}`,
      type: typeMap[notification.type] ?? "system",
      title: notification.title,
      description: notification.body,
      date: notification.createdAt.toISOString()
    }));

    recentActivity = [...ticketActivities, ...fileActivities, ...billingActivities, ...notificationActivities];

    if (onboardingProject) {
      recentActivity.push({
        id: `onboarding-${onboardingProject.id}`,
        type: "onboarding",
        title: `Onboarding · ${onboardingProject.name}`,
        description: onboardingSummary?.nextAction
          ? `Prochaine étape : ${onboardingSummary.nextAction}`
          : "Onboarding prêt pour validation",
        date: onboardingUpdatedAt?.toISOString() ?? new Date().toISOString()
      });
    }

    recentActivity = recentActivity
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }

  unreadNotifications = await countUnreadNotifications(user.id);

  const totalProjects = projectsData.length;
  const deliveredProjects = projectsData.filter((project) => project.status === "delivered").length;
  const activeProjects = totalProjects - deliveredProjects;

  const nextMilestoneProject = projectsData
    .filter((project) => project.dueDate !== null)
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
    .at(0) ?? null;

  const highlights: DashboardHighlightItem[] = [
    {
      id: "projects",
      label: staff ? "Projets actifs" : "Mes projets",
      value: String(Math.max(activeProjects, 0)),
      helper:
        deliveredProjects > 0
          ? `${deliveredProjects} livré${deliveredProjects > 1 ? "s" : ""}`
          : "Livraison en cours"
    },
    {
      id: "onboarding",
      label: "Onboarding",
      value: onboardingProject ? `${formatProgress(onboardingProject.progress)}%` : "0%",
      helper: onboardingProject
        ? onboardingSummary?.nextAction
          ? `Prochaine étape : ${onboardingSummary.nextAction}`
          : "Checklist finalisée"
        : "Aucun onboarding actif"
    },
    {
      id: "tickets",
      label: "Tickets ouverts",
      value: String(openTicketsCount),
      helper: openTicketsCount > 0 ? "Traitements à planifier" : "Aucun ticket en attente"
    }
  ];

  if (nextMilestoneProject?.dueDate) {
    highlights.push({
      id: "milestone",
      label: "Prochain jalon",
      value: formatDate(nextMilestoneProject.dueDate),
      helper: nextMilestoneProject.name
    });
  }

  highlights.push({
    id: "notifications",
    label: "Notifications",
    value: String(unreadNotifications),
    helper: unreadNotifications > 0 ? `${unreadNotifications} à lire` : "Tout est lu"
  });

  const onboardingCardProject = onboardingProject
    ? {
        id: onboardingProject.id,
        name: onboardingProject.name,
        progress: onboardingProject.progress,
        dueDate: onboardingProject.dueDate,
        updatedAt: onboardingUpdatedAt ? onboardingUpdatedAt.toISOString() : null,
        payload: onboardingPayload
      }
    : null;

  return {
    role: user.role,
    staff,
    ownerOptions,
    projectsData,
    highlights,
    onboardingCardProject,
    activityItems: recentActivity
  };
}

export default async function DashboardHomePage(): Promise<JSX.Element> {
  const { role, staff, ownerOptions, projectsData, highlights, onboardingCardProject, activityItems } =
    await loadDashboardData();

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Suivez en un coup d'oeil l'avancement de vos projets Orylis."
        actions={
          <div className="flex items-center gap-3">
            {staff && (
              <ClientCreateDialog
                trigger={
                  <Button variant="outline" size="lg" className="rounded-full">
                    Nouveau client
                  </Button>
                }
              />
            )}
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

      <DashboardHighlights items={highlights} className="mt-6" />

      <section className="mt-6 space-y-6">
        <Card className="border border-border/70 bg-white/90">
          <CardHeader>
            <CardTitle>{staff ? "Tous les projets actifs" : "Mes projets"}</CardTitle>
            <CardDescription>
              {staff
                ? "Vue globale des projets clients et de leur statut."
                : "Suivi partagé avec l'équipe Orylis en temps réel."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardProjects projects={projectsData} role={role} ownerOptions={ownerOptions} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <DashboardOnboardingCard project={onboardingCardProject} role={role} />

        <Card className="border border-border/70">
          <CardHeader className="pb-3">
            <CardTitle>Guide & Support</CardTitle>
            <CardDescription>Accédez à la base de connaissances et au support.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/guide">
                <BookOpen className="mr-2 h-4 w-4" />
                Base de connaissances
              </Link>
            </Button>
            <div className="flex justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <span>Email support</span>
              <Button size="sm" variant="ghost" asChild>
                <a href="mailto:hello@orylis.fr">hello@orylis.fr</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <DashboardActivity items={activityItems} />
      </section>
    </>
  );
}

