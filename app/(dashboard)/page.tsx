import * as React from "react";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";
import { redirect } from "next/navigation";

import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  billingLinks,
  files,
  notifications,
  onboardingResponses,
  projects,
  profiles,
  projectMessages,
  quotes,
  tickets,
  projectBriefs as briefs
} from "@/lib/schema";
import { summarizeOnboardingPayload } from "@/lib/onboarding-summary";
import { countUnreadNotifications } from "@/lib/notifications";
import { formatDate, formatProgress, isStaff, isProspect } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ProjectEditorDialog } from "@/components/projects/project-editor-dialog";
import { DashboardProjects } from "@/components/dashboard/dashboard-projects";
import { ClientCreateDialog } from "@/components/admin/client-create-dialog";
import {
  type DashboardHighlightItem
} from "@/components/dashboard/dashboard-highlights";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import {
  DashboardActivity,
  type DashboardActivityItem
} from "@/components/dashboard/dashboard-activity";
import { DashboardOnboardingCard } from "@/components/dashboard/dashboard-onboarding-card";
import { SiteReviewCard } from "@/components/dashboard/site-review-card";
import { ClientTodoWidget } from "@/components/dashboard/client-todo-widget";
import { ProjectTimeline } from "@/components/dashboard/project-timeline";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { HostingWidget } from "@/components/dashboard/hosting-widget";
import { SiteHealthWidget } from "@/components/dashboard/site-health-widget";
import { BriefValidationCard } from "@/components/dashboard/brief-validation-card";
import { BriefHistory } from "@/components/dashboard/brief-history";
import type { Route } from "next";

// Cache intelligent : revalider toutes les 0 secondes (désactivé pour dev instantané)
// Les données changent peu souvent, pas besoin de force-dynamic
export const revalidate = 0;

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
  demoUrl: string | null;
  hostingExpiresAt: string | null;
  maintenanceActive: boolean;
  deliveredAt: string | null;
  briefs: Array<{
    id: string;
    version: number;
    content: string;
    status: "draft" | "sent" | "approved" | "rejected";
    clientComment: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  ownerId: string;
  ownerName: string | null;
  createdAt: string | null;
}

// Cache la session pour éviter les appels multiples
async function getCachedSession() {
  return await auth();
}

async function loadDashboardData(selectedProjectId?: string) {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;
  const staff = isStaff(user.role);
  const isProspectUser = isProspect(user.role);

  if (staff) {
    redirect("/admin" as any);
  }

  if (user.role === "sales") {
    redirect("/dashboard");
  }

  // Charger les projets et les owners en parallèle
  const [projectRows, rawOwners] = await Promise.all([
    staff
      ? db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          progress: projects.progress,
          dueDate: projects.dueDate,
          demoUrl: projects.demoUrl,
          hostingExpiresAt: projects.hostingExpiresAt,
          maintenanceActive: projects.maintenanceActive,
          deliveredAt: projects.deliveredAt,
          ownerId: projects.ownerId,
          ownerName: profiles.fullName,
          createdAt: projects.createdAt
        })
        .from(projects)
        .leftJoin(profiles, eq(projects.ownerId, profiles.id))
        .orderBy(asc(projects.createdAt))
      : db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          progress: projects.progress,
          dueDate: projects.dueDate,
          demoUrl: projects.demoUrl,
          hostingExpiresAt: projects.hostingExpiresAt,
          maintenanceActive: projects.maintenanceActive,
          deliveredAt: projects.deliveredAt,
          ownerId: projects.ownerId,
          ownerName: profiles.fullName,
          createdAt: projects.createdAt
        })
        .from(projects)
        .leftJoin(profiles, eq(projects.ownerId, profiles.id))
        .where(eq(projects.ownerId, user.id))
        .orderBy(asc(projects.createdAt)),
    staff
      ? db.query.profiles.findMany({
        where: (profile, { or, eq: eqFn }) => or(
          eqFn(profile.role, "client"),
          eqFn(profile.role, "prospect")
        ),
        columns: {
          id: true,
          fullName: true,
          company: true,
          role: true
        },
        orderBy: (profile, { asc: ascFn }) => ascFn(profile.fullName)
      })
      : Promise.resolve([])
  ]);

  const ownerOptions = staff
    ? rawOwners.map((owner) => ({
      id: owner.id,
      name: owner.fullName ?? owner.company ?? "Client"
    }))
    : [];

  const projectsData: DashboardProject[] = await Promise.all(projectRows.map(async (project) => {
    // Fetch project briefs
    const projectBriefs = await db.query.projectBriefs.findMany({
      where: eq(briefs.projectId, project.id),
      orderBy: [desc(briefs.version)]
    });

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      progress: project.progress,
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString() : null,
      demoUrl: project.demoUrl ?? null,
      hostingExpiresAt: project.hostingExpiresAt ? project.hostingExpiresAt.toISOString() : null,
      maintenanceActive: project.maintenanceActive,
      ownerId: project.ownerId,
      ownerName: project.ownerName ?? null,
      createdAt: project.createdAt ? project.createdAt.toISOString() : null,
      deliveredAt: project.deliveredAt ? project.deliveredAt.toISOString() : null,
      briefs: projectBriefs.map(b => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString()
      }))
    };
  }));

  // Determine active project
  const activeProject = selectedProjectId
    ? projectsData.find(p => p.id === selectedProjectId) ?? projectsData[0]
    : projectsData[0];

  // Pour les prospects, gérer les redirections selon le statut du projet
  if (isProspectUser && projectsData.length > 0 && activeProject) {
    const mainProject = activeProject;

    // Si onboarding non complété, rediriger vers l'onboarding
    // MAIS d'abord vérifier si l'onboarding est déjà complété dans la DB
    const onboardingCompleted = await db.query.onboardingResponses.findFirst({
      where: and(
        eq(onboardingResponses.projectId, mainProject.id),
        eq(onboardingResponses.type, "prospect"),
        eq(onboardingResponses.completed, true)
      )
    });

    if (mainProject.status === "onboarding" && !onboardingCompleted) {
      redirect("/onboarding");
    }

    // Si onboarding complété mais pas de démo, rediriger vers demo-in-progress
    if (onboardingCompleted && !mainProject.demoUrl) {
      redirect("/demo-in-progress");
    }

    // Si démo prête, rediriger vers la page de conversion
    if (mainProject.demoUrl) {
      redirect("/demo");
    }
  }

  // Pour les clients/staff,  // Charger l'onboarding du projet principal (le premier)
  const onboardingPromise = projectsData.length > 0 && activeProject
    ? db
      .select({
        payload: onboardingResponses.payload,
        updatedAt: onboardingResponses.updatedAt,
        completed: onboardingResponses.completed
      })
      .from(onboardingResponses)
      .where(
        and(
          eq(onboardingResponses.projectId, activeProject.id),
          or(
            eq(onboardingResponses.type, "client"),
            isProspectUser ? eq(onboardingResponses.type, "prospect") : undefined
          )
        )
      )
      .orderBy(asc(onboardingResponses.type)) // 'client' < 'prospect', so client comes first
      .limit(1)
      .then((rows) => rows.at(0) ?? null)
    : Promise.resolve(null);

  const unreadNotificationsPromise = countUnreadNotifications(user.id);

  const projectIds = projectsData.map((project) => project.id);

  // Charger toutes les données en parallèle
  const [
    onboardingResponseRow,
    unreadNotifications,
    ...dashboardData
  ] = await Promise.all([
    onboardingPromise,
    unreadNotificationsPromise,
    ...(projectIds.length > 0
      ? [
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
      ]
      : [])
  ]);

  // Traiter les données de l'onboarding
  const onboardingPayload = onboardingResponseRow
    ? ((onboardingResponseRow.payload as Record<string, unknown> | null) ?? null)
    : null;
  const onboardingUpdatedAt = onboardingResponseRow?.updatedAt ?? null;
  const onboardingCompleted = onboardingResponseRow?.completed ?? false;

  const onboardingProject = activeProject?.status === "onboarding" ? activeProject : null;

  const onboardingSummary = onboardingProject
    ? summarizeOnboardingPayload(onboardingPayload)
    : null;

  // Traiter les données du dashboard
  let openTicketsCount = 0;
  let recentActivity: DashboardActivityItem[] = [];

  if (projectIds.length > 0) {
    const [
      openTicketsRows,
      recentTicketsRows,
      recentFilesRows,
      recentBillingRows,
      recentNotificationsRows
    ] = dashboardData as [
      Array<{ value: number }>,
      Array<{
        id: string;
        title: string;
        status: string;
        projectName: string;
        updatedAt: Date;
      }>,
      Array<{
        id: string;
        label: string | null;
        projectName: string;
        createdAt: Date;
      }>,
      Array<{
        id: string;
        label: string;
        projectName: string;
        createdAt: Date;
      }>,
      Array<{
        id: string;
        type: string;
        title: string;
        body: string;
        createdAt: Date;
      }>
    ];

    openTicketsCount = openTicketsRows.at(0)?.value ?? 0;

    const ticketActivities: DashboardActivityItem[] = recentTicketsRows.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: "ticket",
      title: ticket.title,
      description: `${ticketStatusLabels[ticket.status as keyof typeof ticketStatusLabels] ?? ticket.status} · ${ticket.projectName}`,
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

  // Les messages staff ne sont pas chargés pour les clients/staff (seulement pour les prospects)
  const staffMessages: Array<{
    id: string;
    message: string;
    authorName: string | null;
    createdAt: string;
  }> = [];

  // Compter les fichiers et tickets pour le teaser (si client)
  let filesCount = 0;
  let ticketsCount = 0;

  if (!isProspectUser && projectsData.length > 0) {
    const projectIds = projectsData.map((p) => p.id);
    const [filesRows, ticketsRows] = await Promise.all([
      db
        .select({ id: files.id })
        .from(files)
        .where(inArray(files.projectId, projectIds)),
      db
        .select({ id: tickets.id })
        .from(tickets)
        .where(inArray(tickets.projectId, projectIds))
    ]);
    filesCount = filesRows.length;
    ticketsCount = ticketsRows.length;
  }

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
    isProspectUser,
    ownerOptions,
    projectsData,
    highlights,
    onboardingCardProject,
    activityItems: recentActivity,
    userName: user.name,
    userEmail: user.email,
    staffMessages,
    filesCount,
    ticketsCount,
    quoteStatus: null, // Pour les clients/staff, on ne vérifie pas les devis
    onboardingCompleted,
    activeProject,
    unreadNotifications
  };
}

export default async function DashboardHomePage({ searchParams }: { searchParams: { project?: string } }): Promise<JSX.Element> {
  const {
    role,
    staff,
    isProspectUser,
    ownerOptions,
    projectsData,
    highlights,
    onboardingCardProject,
    activityItems,
    userName,
    userEmail,
    staffMessages,
    filesCount,
    ticketsCount,
    quoteStatus,
    onboardingCompleted,
    activeProject,
    unreadNotifications
  } = await loadDashboardData(searchParams?.project);

  // Pour les clients non-staff, utiliser le nom du premier projet s'il existe
  // Sinon, utiliser le prénom comme fallback
  let greetingName: string;
  if (!staff && activeProject) {
    greetingName = activeProject.name;
  } else {
    const firstName = userName?.split(" ")[0] ?? userEmail?.split("@")[0] ?? "Bienvenue";
    greetingName = firstName;
  }

  // Vue normale pour clients et staff
  const isDelivered = projectsData.some(p => p.status === "delivered");
  const projectInReview = projectsData.find(p => p.status === "review");

  // Explicit Timeline Logic
  const getStepStatus = (stepId: string, currentStatus: string, onboardingDone: boolean): "completed" | "current" | "upcoming" => {
    // 1. Onboarding
    if (stepId === "onboarding") {
      return onboardingDone ? "completed" : "current";
    }

    // 2. Construction (Design/Build)
    if (stepId === "construction") {
      if (!onboardingDone) return "upcoming";
      if (currentStatus === "onboarding") return "upcoming";
      if (["demo_in_progress", "design", "build"].includes(currentStatus)) return "current";
      if (["review", "delivered"].includes(currentStatus)) return "completed";
      return "upcoming"; // Fallback
    }

    // 3. Review
    if (stepId === "review") {
      if (["delivered"].includes(currentStatus)) return "completed";
      if (currentStatus === "review") return "current";
      return "upcoming";
    }

    // 4. Delivery
    if (stepId === "delivery") {
      if (currentStatus === "delivered") return "completed";
      return "upcoming";
    }

    return "upcoming";
  };

  const timelineSteps = activeProject ? [
    {
      id: "onboarding",
      label: "Onboarding",
      status: getStepStatus("onboarding", activeProject.status, onboardingCompleted),
      date: onboardingCompleted && activeProject.createdAt ? formatDate(activeProject.createdAt) : undefined
    },
    {
      id: "construction",
      label: "Construction",
      status: getStepStatus("construction", activeProject.status, onboardingCompleted),
    },
    {
      id: "review",
      label: "Révision & Validation",
      status: getStepStatus("review", activeProject.status, onboardingCompleted),
    },
    {
      id: "delivery",
      label: "Mise en ligne",
      status: getStepStatus("delivery", activeProject.status, onboardingCompleted),
      date: activeProject.deliveredAt ? formatDate(activeProject.deliveredAt) : undefined
    }
  ] : [];

  // Generate Todos
  const todos = [];
  if (unreadNotifications > 0) {
    todos.push({
      id: "notifications",
      type: "notification" as const,
      title: "Notifications non lues",
      count: unreadNotifications,
      href: "/notifications" as Route
    });
  }

  // If client onboarding is not completed, add it to todos
  if (!onboardingCompleted && activeProject && !staff) {
    todos.push({
      id: "onboarding-todo",
      type: "onboarding" as const,
      title: "Lancer la création du site internet",
      count: 1,
      href: `/projects/${activeProject.id}/onboarding` as Route
    });
  }

  if (ticketsCount > 0) {
    // Note: ticketsCount here is total tickets, not open tickets.
    // But we don't have open tickets count for the widget specifically passed down except in highlights.
    // Let's use a generic link for now.
    // Actually we have `highlights` which has open tickets count.
    const openTicketsHighlight = highlights.find(h => h.id === "tickets");
    const openTickets = openTicketsHighlight ? parseInt(openTicketsHighlight.value) : 0;

    if (openTickets > 0) {
      todos.push({
        id: "tickets",
        type: "ticket" as const,
        title: "Tickets en attente",
        count: openTickets,
        href: "/tickets" as Route
      });
    }
  }

  return (
    <>
      <DashboardHeader
        userName={userName}
        userEmail={userEmail}
        greetingName={greetingName}
      />

      <PageHeader
        title={isDelivered ? "" : "Tableau de bord"}
        description=""
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {staff && (
              <ClientCreateDialog
                trigger={
                  <Button variant="outline" size="sm" className="min-h-[44px] rounded-full sm:size-lg">
                    <span className="hidden sm:inline">Nouveau client</span>
                    <span className="sm:hidden">Client</span>
                  </Button>
                }
              />
            )}
            {staff && (
              <ProjectEditorDialog
                mode="create"
                owners={ownerOptions}
                trigger={
                  <Button size="sm" className="min-h-[44px] rounded-full sm:size-lg">
                    <span className="hidden sm:inline">Nouveau projet</span>
                    <span className="sm:hidden">Projet</span>
                  </Button>
                }
              />
            )}
          </div>
        }
      />

      {/* Main Content Layout */}
      {isDelivered ? (
        /* Delivered Layout: Full Width Stack */
        <div className="space-y-6">
          <AnalyticsDashboard projectId={activeProject?.id} />

          {/* Widgets Grid */}
          {activeProject && staff && (
            <div className="grid gap-6 md:grid-cols-3">
              <HostingWidget
                hostingExpiresAt={activeProject.hostingExpiresAt ? new Date(activeProject.hostingExpiresAt) : null}
                maintenanceActive={activeProject.maintenanceActive}
              />
              <SiteHealthWidget
                maintenanceActive={activeProject.maintenanceActive}
              />
              <DashboardActivity items={activityItems} />
            </div>
          )}
        </div>
      ) : (
        /* Construction Layout: 2/3 + 1/3 Grid */
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="space-y-6 lg:col-span-2">
            {/* Onboarding Card (if active) */}
            {onboardingCardProject && (
              <DashboardOnboardingCard
                project={onboardingCardProject}
                role={role}
              />
            )}

            {/* Site Review Card (if in review) */}
            {projectInReview && (
              <SiteReviewCard
                project={{
                  id: projectInReview.id,
                  name: projectInReview.name,
                  demoUrl: projectInReview.demoUrl
                }}
              />
            )}

            {/* Brief Validation Card (if brief sent) */}
            {activeProject && activeProject.briefs.length > 0 && activeProject.briefs[0].status === "sent" && (
              <BriefValidationCard
                brief={activeProject.briefs[0]}
              />
            )}

            {/* Project Timeline */}
            {activeProject && (
              <ProjectTimeline
                steps={timelineSteps}
                projectName={activeProject.name}
              />
            )}

            {/* Brief History */}
            {activeProject && activeProject.briefs.length > 0 && (
              <BriefHistory
                briefs={activeProject.briefs}
              />
            )}

            {/* Recent Activity */}
            <DashboardActivity items={activityItems} />
          </div>

          {/* Sidebar for Construction Phase */}
          <div className="space-y-6">
            <AnalyticsChart title="Visiteurs" description="200 derniers visiteurs" />

            {staff && (
              <DashboardProjects
                projects={projectsData}
                role={role}
                ownerOptions={ownerOptions}
              />
            )}

            {activeProject && (
              <ClientTodoWidget
                todos={todos}
              />
            )}
          </div>
        </div>
      )}

    </>
  );
}
