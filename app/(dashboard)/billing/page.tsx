import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { billingLinks, projects } from "@/lib/schema";
import { isStaff, isProspect } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { BillingLinksManager } from "@/components/billing/billing-links-manager";

// Cache 30 secondes : les liens de facturation changent peu
export const revalidate = 30;

async function loadBillingData() {
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

  const baseQuery = db
    .select({
      id: billingLinks.id,
      label: billingLinks.label,
      url: billingLinks.url,
      projectId: billingLinks.projectId,
      projectName: projects.name,
      createdAt: billingLinks.createdAt,
      ownerId: projects.ownerId
    })
    .from(billingLinks)
    .innerJoin(projects, eq(billingLinks.projectId, projects.id));

  const links = staff
    ? await baseQuery.orderBy(desc(billingLinks.createdAt))
    : await baseQuery
        .where(eq(projects.ownerId, user.id))
        .orderBy(desc(billingLinks.createdAt));

  return {
    role: user.role,
    accessibleProjects,
    links: links.map(({ ownerId: _ownerId, ...link }) => ({
      ...link,
      createdAt: link.createdAt.toISOString()
    }))
  };
}

export default async function BillingPage(): Promise<JSX.Element> {
  const { role, accessibleProjects, links } = await loadBillingData();
  const isProspectUser = isProspect(role);

  // Si c'est un prospect, afficher un message explicatif
  if (isProspectUser) {
    return (
      <>
        <PageHeader
          title="Facturation"
          description="Centralisez vos liens de paiement, devis et documents comptables."
        />
        <Card className="border border-border/70">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">
              Cette section est réservée aux clients
            </p>
            <p className="text-muted-foreground mb-4">
              Pour accéder à la facturation, tickets et fichiers, contactez-nous pour activer votre accès complet.
            </p>
            <p className="text-sm text-muted-foreground">
              En tant que prospect, vous pouvez actuellement remplir votre onboarding et suivre l'avancement de votre projet.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Facturation"
        description="Centralisez vos liens de paiement, devis et documents comptables."
      />

      <Card className="border border-border/70">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Liens de facturation</CardTitle>
            <CardDescription>
              Ajoutez ou supprimez les liens de paiement liés à vos projets actifs.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BillingLinksManager
            links={links}
            projects={accessibleProjects}
            role={role}
            canManage={accessibleProjects.length > 0}
          />
        </CardContent>
      </Card>
    </>
  );
}
