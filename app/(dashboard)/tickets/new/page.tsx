import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { NewTicketForm } from "./new-ticket-form";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";

async function loadNewTicketData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;
  const staff = isStaff(user.role);

  const accessibleProjects = staff
    ? await db
        .select({
          id: projects.id,
          name: projects.name
        })
        .from(projects)
        .orderBy(projects.name)
    : await db.query.projects.findMany({
        where: (project, { eq: eqFn }) => eqFn(project.ownerId, user.id),
        columns: {
          id: true,
          name: true
        },
        orderBy: (project, { asc }) => asc(project.name)
      });

  return { accessibleProjects, staff };
}

export default async function NewTicketPage(): Promise<JSX.Element> {
  const { accessibleProjects, staff } = await loadNewTicketData();

  return (
    <>
      <PageHeader
        title="Nouveau ticket"
        description="Exprimez clairement votre besoin pour une réponse rapide et précise."
        actions={
          <Button asChild variant="ghost">
            <Link href="/tickets">Retour aux tickets</Link>
          </Button>
        }
      />

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Informations demande</CardTitle>
          <CardDescription>
            Toutes les sections sont obligatoires pour enclencher la prise en charge côté équipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accessibleProjects.length === 0 ? (
            <EmptyState
              icon={Info}
              title="Aucun projet disponible"
              description={
                staff
                  ? "Aucun projet n’est actuellement assigné. Créez un projet ou attribuez-vous en un pour créer un ticket."
                  : "Vous n’avez pas encore de projet actif. Contactez Orylis pour initialiser votre espace."
              }
            />
          ) : (
            <NewTicketForm projects={accessibleProjects} />
          )}
        </CardContent>
      </Card>
    </>
  );
}