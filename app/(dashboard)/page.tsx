import * as React from "react";
import { redirect } from "next/navigation";
import { cache } from "react";
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
  projectMessages,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { ProspectTimeline } from "@/components/dashboard/prospect-timeline";
import { ProspectStaffMessages } from "@/components/dashboard/prospect-staff-messages";
import { ProspectFeaturesTeaser } from "@/components/dashboard/prospect-features-teaser";
import { ProspectCTASticky } from "@/components/dashboard/prospect-cta-sticky";

// Cache les données du dashboard pendant 60 secondes pour améliorer les performances
export const revalidate = 60;

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
          where: (profile, { eq: eqFn }) => eqFn(profile.role, "client"),
          columns: {
            id: true,
            fullName: true,
            company: true
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
    ownerId: project.ownerId,
    ownerName: project.ownerName ?? null,
    createdAt: project.createdAt ? project.createdAt.toISOString() : null
  }));

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

    // Compter les fichiers et tickets pour le teaser
    const [filesCountResult, ticketsCountResult] = await Promise.all([
      db
        .select({ value: sql<number>`count(*)` })
        .from(files)
        .where(eq(files.projectId, mainProject.id))
        .then((rows) => rows.at(0)),
      db
        .select({ value: sql<number>`count(*)` })
        .from(tickets)
        .where(eq(tickets.projectId, mainProject.id))
        .then((rows) => rows.at(0))
    ]);

    const filesCount = filesCountResult?.value ?? 0;
    const ticketsCount = ticketsCountResult?.value ?? 0;

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
      ticketsCount
    };
  }

  // Pour les clients/staff, charger toutes les données en parallèle
  const onboardingPromise = onboardingProject
    ? db
        .select({
          payload: onboardingResponses.payload,
          updatedAt: onboardingResponses.updatedAt
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
    ticketsCount
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
    ticketsCount
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
        {/* Message de bienvenue avec badge prospect */}
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-gradient-to-r from-accent/5 to-accent/10 p-4 sm:mb-6 sm:gap-4 sm:rounded-2xl sm:p-6">
          <Avatar className="h-12 w-12 ring-2 ring-accent/20 sm:h-14 sm:w-14">
            <AvatarFallback className="bg-accent/10 text-base font-semibold text-accent sm:text-lg">
              {(userName ?? userEmail ?? "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl">
                Bonjour {greetingName} 👋
              </h2>
              <Badge variant="secondary" className="text-xs">Prospect</Badge>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Votre projet {mainProject.name} est en cours. Suivez son avancement ci-dessous.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 min-h-[44px] rounded-full"
            asChild
          >
            <a href="https://calendly.com/lucas-orylis/30min" target="_blank" rel="noopener noreferrer">
              Prendre rendez-vous
            </a>
          </Button>
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
      {/* Message de bienvenue avec avatar */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-gradient-to-r from-accent/5 to-accent/10 p-4 sm:mb-6 sm:gap-4 sm:rounded-2xl sm:p-6">
        <Avatar className="h-12 w-12 ring-2 ring-accent/20 sm:h-14 sm:w-14">
          <AvatarFallback className="bg-accent/10 text-base font-semibold text-accent sm:text-lg">
            {(userName ?? userEmail ?? "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl">
            Bonjour {greetingName} 👋
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Suivez en un coup d'oeil l'avancement de vos projets Orylis.
          </p>
        </div>
      </div>

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

