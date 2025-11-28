import * as React from "react";
import { redirect } from "next/navigation";
import { cache } from "react";
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
  tickets
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
import {
  DashboardActivity,
  type DashboardActivityItem
} from "@/components/dashboard/dashboard-activity";
import { DashboardOnboardingCard } from "@/components/dashboard/dashboard-onboarding-card";
import { ProspectTimeline } from "@/components/dashboard/prospect-timeline";
import { ProspectStaffMessages } from "@/components/dashboard/prospect-staff-messages";
import { ProspectFeaturesTeaser } from "@/components/dashboard/prospect-features-teaser";
import { ProspectCTASticky } from "@/components/dashboard/prospect-cta-sticky";
import { ProspectCTAWidget } from "@/components/dashboard/prospect-cta-widget";
import { ClientTodoWidget } from "@/components/dashboard/client-todo-widget";
import { ProjectTimeline } from "@/components/dashboard/project-timeline";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { HostingWidget } from "@/components/dashboard/hosting-widget";
import { SiteHealthWidget } from "@/components/dashboard/site-health-widget";

// Cache intelligent : revalider toutes les 30 secondes
// Les données changent peu souvent, pas besoin de force-dynamic
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
  demoUrl: string | null;
  hostingExpiresAt: string | null;
  maintenanceActive: boolean;
  ownerId: string;
  ownerName: string | null;
  createdAt: string | null;
}

// Cache la session pour éviter les appels multiples
const getCachedSession = cache(async () => {
  return await auth();
});

async function loadDashboardData() {
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

  const projectsData: DashboardProject[] = projectRows.map((project) => ({
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
    createdAt: project.createdAt ? project.createdAt.toISOString() : null
  }));

  // Pour les prospects, gérer les redirections selon le statut du projet
  if (isProspectUser && projectsData.length > 0) {
    const mainProject = projectsData[0];

    // Utiliser directement le demoUrl chargé dans projectsData
    const projectWithDemo = mainProject;

    // Si onboarding non complété, rediriger vers l'onboarding
    if (mainProject.status === "onboarding") {
      redirect("/onboarding");
    }

    // Si démo en cours mais pas encore prête, rediriger vers la page d'attente
    if (mainProject.status === "demo_in_progress" && !mainProject.demoUrl) {
      redirect("/demo-in-progress");
    }

    // Si démo prête, rediriger vers la page de conversion
    if (mainProject.demoUrl) {
      redirect("/demo");
    }
  }

  const onboardingProject = projectsData.find((project) => project.status === "onboarding") ?? null;

  const projectIds = projectsData.map((project) => project.id);

  // Pour les prospects, charger seulement les données nécessaires
  if (isProspectUser && projectsData.length > 0) {
    const mainProject = projectsData[0];

    // Charger seulement l'onboarding et les messages staff pour les prospects
    const [onboardingResponseRow, staffMessagesRows] = await Promise.all([
      db
        .select({
          payload: onboardingResponses.payload,
          updatedAt: onboardingResponses.updatedAt
        })
        .from(onboardingResponses)
        .where(eq(onboardingResponses.projectId, mainProject.id))
        .then((rows) => rows.at(0) ?? null),
      db
        .select({
          id: projectMessages.id,
          message: projectMessages.message,
          authorName: profiles.fullName,
          createdAt: projectMessages.createdAt
        })
        .from(projectMessages)
        .innerJoin(profiles, eq(projectMessages.authorId, profiles.id))
        .where(eq(projectMessages.projectId, mainProject.id))
        .orderBy(desc(projectMessages.createdAt))
        .limit(5)
    ]);

    const onboardingPayload = onboardingResponseRow
      ? ((onboardingResponseRow.payload as Record<string, unknown> | null) ?? null)
      : null;
    const onboardingUpdatedAt = onboardingResponseRow?.updatedAt ?? null;
    const onboardingSummary = mainProject.status === "onboarding"
      ? summarizeOnboardingPayload(onboardingPayload)
      : null;

    const staffMessages: Array<{
      id: string;
      message: string;
      authorName: string | null;
      createdAt: string;
    }> = staffMessagesRows.map((row) => ({
      id: row.id,
      message: row.message,
      authorName: row.authorName,
      createdAt: row.createdAt.toISOString()
    }));

    // Compter les fichiers et tickets pour le teaser, et vérifier si un devis existe
    const [filesCountResult, ticketsCountResult, quoteResult] = await Promise.all([
      db
        .select({ value: sql<number>`count(*)` })
        .from(files)
        .where(eq(files.projectId, mainProject.id))
        .then((rows) => rows.at(0)),
      db
        .select({ value: sql<number>`count(*)` })
        .from(tickets)
        .where(eq(tickets.projectId, mainProject.id))
        .then((rows) => rows.at(0)),
      db.query.quotes.findFirst({
        where: eq(quotes.projectId, mainProject.id),
        columns: { id: true, status: true }
      })
    ]);

    const filesCount = filesCountResult?.value ?? 0;
    const ticketsCount = ticketsCountResult?.value ?? 0;
    const quoteStatus = quoteResult?.status ?? null;

    const onboardingCardProject = mainProject.status === "onboarding"
      ? {
        id: mainProject.id,
        name: mainProject.name,
        progress: mainProject.progress,
        dueDate: mainProject.dueDate,
        updatedAt: onboardingUpdatedAt ? onboardingUpdatedAt.toISOString() : null,
        payload: onboardingPayload
      }
      : null;

    return {
      role: user.role,
      staff: false,
      isProspectUser: true,
      ownerOptions: [],
      projectsData: [mainProject],
      highlights: [
        {
          id: "projects",
          label: "Mon projet",
          value: "1",
          helper: "En cours"
        },
        {
          id: "onboarding",
          label: "Onboarding",
          value: mainProject.status === "onboarding" ? `${formatProgress(mainProject.progress)}%` : "0%",
          helper: mainProject.status === "onboarding" && onboardingSummary?.nextAction
            ? `Prochaine étape : ${onboardingSummary.nextAction}`
            : "Aucun onboarding actif"
        }
      ],
      onboardingCardProject,
      activityItems: [],
      userName: user.name,
      userEmail: user.email,
      staffMessages,
      filesCount,
      ticketsCount,
      quoteStatus
    };
  }

  // Pour les clients/staff, charger toutes les données en parallèle
  const onboardingPromise = onboardingProject
    ? db
      .select({
        payload: onboardingResponses.payload,
        updatedAt: onboardingResponses.updatedAt,
        completed: onboardingResponses.completed
      })
      .from(onboardingResponses)
      .where(eq(onboardingResponses.projectId, onboardingProject.id))
      .then((rows) => rows.at(0) ?? null)
    : Promise.resolve(null);

  const unreadNotificationsPromise = countUnreadNotifications(user.id);

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
    onboardingCompleted
  };
}

export default async function DashboardHomePage(): Promise<JSX.Element> {
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
    onboardingCompleted
  } = await loadDashboardData();

  // Pour les clients non-staff, utiliser le nom du premier projet s'il existe
  // Sinon, utiliser le prénom comme fallback
  let greetingName: string;
  if (!staff && projectsData.length > 0) {
    greetingName = projectsData[0].name;
  } else {
    const firstName = userName?.split(" ")[0] ?? userEmail?.split("@")[0] ?? "Bienvenue";
    greetingName = firstName;
  }

  // Vue spéciale pour les prospects
  if (isProspectUser && projectsData.length > 0) {
    const mainProject = projectsData[0];
    return (
      <>
        <DashboardHeader
          userName={userName}
          userEmail={userEmail}
          greetingName={greetingName}
          isProspect={true}
          projectName={mainProject.name}
        />

        {/* CTA Widget pour prospects */}
        <div className="mb-6">
          <ProspectCTAWidget
            hasOnboarding={mainProject.status === "onboarding"}
            onboardingProgress={mainProject.progress}
            quoteStatus={quoteStatus}
            projectName={mainProject.name}
          />
        </div>

        {/* Timeline et progression */}
        <div className="mb-6">
          <ProspectTimeline
            projectName={mainProject.name}
            currentStatus={mainProject.status}
            progress={mainProject.progress}
            createdAt={mainProject.createdAt}
          />
        </div>

        {/* Messages staff */}
        {staffMessages.length > 0 && (
          <div className="mb-6">
            <ProspectStaffMessages messages={staffMessages} projectName={mainProject.name} />
          </div>
        )}

        {/* Teaser fonctionnalités client */}
        <div className="mb-6">
          <ProspectFeaturesTeaser filesCount={filesCount} ticketsCount={ticketsCount} />
        </div>

        {/* CTA Sticky */}
        <ProspectCTASticky
          projectStatus={mainProject.status}
          projectProgress={mainProject.progress}
        />
      </>
    );
  }

  // Vue normale pour clients et staff
  return (
    <>
      <DashboardHeader
        userName={userName}
        userEmail={userEmail}
        greetingName={greetingName}
      />

      <PageHeader
        title="Tableau de bord"
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
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] rounded-full sm:size-lg"
              asChild
            >
              <a href="https://calendly.com/lucas-orylis/30min" target="_blank" rel="noopener noreferrer">
                <span className="hidden md:inline">Planifier un point</span>
                <span className="md:hidden">Point</span>
              </a>
            </Button>
          </div>
        }
      />

      <DashboardStats highlights={highlights} className="mt-6" />

      <section className="mt-6 space-y-6">
        {staff ? (
          <Card className="border border-border/70 bg-white/90">
            <CardHeader>
              <CardTitle>Tous les projets actifs</CardTitle>
              <CardDescription>Vue globale des projets clients et de leur statut.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardProjects projects={projectsData} role={role} ownerOptions={ownerOptions} />
            </CardContent>
          </Card>
        ) : projectsData[0]?.status === "delivered" ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 p-4 text-green-800 border border-green-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl">
                  🚀
                </span>
                <div>
                  <h3 className="font-semibold">Votre site est en ligne !</h3>
                  <p className="text-sm text-green-700">Félicitations, votre projet est publié et accessible à tous.</p>
                </div>
              </div>
              {projectsData[0].demoUrl && (
                <Button asChild variant="outline" className="w-full sm:w-auto bg-white border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800">
                  <a href={projectsData[0].demoUrl} target="_blank" rel="noopener noreferrer">
                    Voir mon site
                  </a>
                </Button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <HostingWidget
                hostingExpiresAt={projectsData[0].hostingExpiresAt ? new Date(projectsData[0].hostingExpiresAt) : null}
                maintenanceActive={projectsData[0].maintenanceActive}
              />
              <SiteHealthWidget maintenanceActive={projectsData[0].maintenanceActive} />
            </div>
          </div>
        ) : (
          <>
            {onboardingCardProject && !onboardingCompleted ? (
              <Card className="border-l-4 border-l-blue-600 border-y border-r border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      Étape 1
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Action requise</span>
                  </div>
                  <CardTitle className="text-xl">Lancement de la production 🚀</CardTitle>
                  <CardDescription className="text-base">
                    Pour démarrer le développement de votre site, nous avons besoin de votre cahier des charges.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Button asChild size="lg" className="rounded-full shadow-md bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Link href="/onboarding">
                      Remplir le cahier des charges
                      <span className="ml-2 text-blue-200">→</span>
                    </Link>
                  </Button>
                  <p className="text-sm text-slate-500 max-w-md">
                    Ce formulaire définit vos pages, vos contenus et vos préférences techniques. <span className="font-medium text-slate-700">Temps estimé : 15 min.</span>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-l-4 border-l-green-600 border-y border-r border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Terminé
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Onboarding</span>
                  </div>
                  <CardTitle className="text-xl">Onboarding site terminé 🎉</CardTitle>
                  <CardDescription className="text-base">
                    Merci d'avoir rempli le cahier des charges. Notre équipe va maintenant analyser vos besoins.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Button asChild size="lg" variant="outline" className="rounded-full w-full sm:w-auto">
                    <Link href="/tickets">
                      Voir mes tickets
                      <span className="ml-2">→</span>
                    </Link>
                  </Button>
                  <p className="text-sm text-slate-500 max-w-md">
                    Si vous souhaitez demander des modifications ou ajouter des informations, vous pouvez créer un ticket.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>

      {(!projectsData[0] || projectsData[0].status !== "delivered") && (
        <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[2fr_1fr]">
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
                  <a href="mailto:contact@orylis.fr">contact@orylis.fr</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="mt-6">
        <DashboardActivity items={activityItems} />
      </section>
    </>
  );
}

