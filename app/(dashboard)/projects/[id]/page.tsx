import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  billingLinks,
  files,
  onboardingResponses,
  profiles,
  projects,
  tickets
} from "@/lib/schema";
import { summarizeOnboardingPayload } from "@/lib/onboarding-summary";
import { formatDate, formatProgress, isStaff } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/ui/progress";
import { ProgressBadge } from "@/components/ui/progress-badge";
import { ProjectRequestDialog } from "@/components/projects/project-request-dialog";
import { ProjectFeedbackDialog } from "@/components/projects/project-feedback-dialog";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  design: "Design",
  build: "Build",
  review: "Review",
  delivered: "Livré"
};

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const params = await props.params;
  return <ProjectDetailPageContent params={params} />;
}

async function ProjectDetailPageContent({ params }: ProjectDetailPageProps): Promise<JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;

  const projectRow = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      progress: projects.progress,
      dueDate: projects.dueDate,
      createdAt: projects.createdAt,
      ownerId: projects.ownerId,
      ownerName: profiles.fullName,
      ownerCompany: profiles.company
    })
    .from(projects)
    .leftJoin(profiles, eq(projects.ownerId, profiles.id))
    .where(eq(projects.id, params.id))
    .then((rows) => rows.at(0));

  if (!projectRow) {
    notFound();
  }

  const staff = isStaff(user.role);
  const isOwner = projectRow.ownerId === user.id;

  if (!staff && !isOwner) {
    redirect("/" as Route);
  }

  const canCreateRequest = staff || isOwner;

  const [onboardingEntry, ticketCountRow, fileCountRow, billingCountRow] = await Promise.all([
    db
      .select({
        payload: onboardingResponses.payload,
        completed: onboardingResponses.completed,
        updatedAt: onboardingResponses.updatedAt
      })
      .from(onboardingResponses)
      .where(eq(onboardingResponses.projectId, projectRow.id))
      .then((rows) => rows.at(0) ?? null),
    db
      .select({ value: sql<number>`count(*)` })
      .from(tickets)
      .where(eq(tickets.projectId, projectRow.id))
      .then((rows) => rows.at(0)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(files)
      .where(eq(files.projectId, projectRow.id))
      .then((rows) => rows.at(0)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(billingLinks)
      .where(eq(billingLinks.projectId, projectRow.id))
      .then((rows) => rows.at(0))
  ]);

  const onboardingSummary = onboardingEntry
    ? summarizeOnboardingPayload(onboardingEntry.payload as Record<string, unknown> | null)
    : null;

  const safeProgress = formatProgress(projectRow.progress);
  const statusLabel = STATUS_LABELS[projectRow.status] ?? projectRow.status;
  const ticketCount = ticketCountRow?.value ?? 0;
  const fileCount = fileCountRow?.value ?? 0;
  const billingCount = billingCountRow?.value ?? 0;

  return (
    <>
      <PageHeader
        title={projectRow.name}
        description={`Vue d’ensemble du projet — ${statusLabel}`}
        actions={
          <Button asChild variant="ghost">
            <Link href={"/" as Route}>Retour au dashboard</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Progression</span>
                <Badge variant="secondary" className="capitalize">
                  {statusLabel}
                </Badge>
              </CardTitle>
              <CardDescription>
                {projectRow.dueDate
                  ? `Livraison cible : ${formatDate(projectRow.dueDate, { dateStyle: "medium" })}`
                  : "Pas d’échéance fixée."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressBadge value={safeProgress} showLabel={safeProgress < 100} />
              {safeProgress < 100 && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Créé le{" "}
                    {formatDate(projectRow.createdAt, {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                  </span>
                  {projectRow.ownerName ? (
                    <span>
                      Client : {projectRow.ownerName}
                      {projectRow.ownerCompany ? ` (${projectRow.ownerCompany})` : ""}
                    </span>
                  ) : null}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {canCreateRequest ? (
                  <>
                    <ProjectRequestDialog projectId={projectRow.id} projectName={projectRow.name} role={user.role} />
                    <ProjectFeedbackDialog projectId={projectRow.id} projectName={projectRow.name} role={user.role} />
                  </>
                ) : null}
                <Button asChild variant="outline">
                  <Link href={`/projects/${projectRow.id}/onboarding` as Route}>Voir l’onboarding</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/tickets">Tickets</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/files">Fichiers</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/billing">Liens de paiement</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {onboardingSummary ? (
            <Card className="border border-border/70">
              <CardHeader>
                <CardTitle>Onboarding</CardTitle>
                <CardDescription>
                  {onboardingEntry?.completed
                    ? "Onboarding complété. Toutes les informations ont été transmises."
                    : onboardingSummary.nextAction
                      ? `Prochaine action : ${onboardingSummary.nextAction}`
                      : "Onboarding en cours de finalisation."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Progress value={onboardingSummary.completionRatio * 100} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Checklist complétée à {Math.round(onboardingSummary.completionRatio * 100)}%
                    {onboardingEntry?.updatedAt
                      ? ` · Dernière mise à jour ${formatDate(onboardingEntry.updatedAt, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}`
                      : ""}
                  </p>
                </div>
                <ul className="space-y-3">
                  {onboardingSummary.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-3 w-3 rounded-full ${item.completed ? "bg-accent" : "bg-muted-foreground/30"
                          }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-white/90">
            <CardHeader>
              <CardTitle>Indicateurs</CardTitle>
              <CardDescription>Vue rapide des éléments liés au projet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-muted-foreground">Tickets</p>
                <span className="text-base font-semibold text-foreground">{ticketCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-muted-foreground">Fichiers</p>
                <span className="text-base font-semibold text-foreground">{fileCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-muted-foreground">Liens de paiement</p>
                <span className="text-base font-semibold text-foreground">{billingCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

