import { redirect } from "next/navigation";
import { eq, asc, or, sql, inArray, aliasedTable } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, authUsers, projects, onboardingResponses, quotes } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ClientsList, type Client } from "@/components/admin/clients-list";

const referrers = aliasedTable(profiles, "referrers");

// Pas de cache pour l'admin : les actions doivent être immédiates
export const revalidate = 0;

async function loadClientsData() {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/");
  }

  // Récupérer tous les clients
  const clients = (await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      company: profiles.company,
      phone: profiles.phone,
      email: authUsers.email,
      role: profiles.role,
      createdAt: profiles.createdAt,
      referrerName: referrers.fullName,
      referrerCompany: referrers.company
    })
    .from(profiles)
    .innerJoin(authUsers, eq(profiles.id, authUsers.id))
    .leftJoin(referrers, eq(profiles.referrerId, referrers.id))
    .where(or(eq(profiles.role, "prospect"), eq(profiles.role, "client")))
    .orderBy(asc(profiles.fullName))) as unknown as {
      id: string;
      fullName: string | null;
      company: string | null;
      phone: string | null;
      email: string | null;
      role: "prospect" | "client" | "staff";
      createdAt: Date | null;
      referrerName: string | null;
      referrerCompany: string | null;
    }[];

  // Récupérer les numéros de téléphone depuis les réponses d'onboarding pour les clients qui n'en ont pas dans leur profil
  const clientIdsWithoutPhone = clients.filter((c) => !c.phone).map((c) => c.id);

  let phoneFromOnboarding = new Map<string, string | null>();

  if (clientIdsWithoutPhone.length > 0) {
    const onboardingData = await db
      .select({
        ownerId: projects.ownerId,
        payload: onboardingResponses.payload
      })
      .from(onboardingResponses)
      .innerJoin(projects, eq(onboardingResponses.projectId, projects.id))
      .where(inArray(projects.ownerId, clientIdsWithoutPhone));

    onboardingData.forEach((row) => {
      if (!phoneFromOnboarding.has(row.ownerId) && row.payload && typeof row.payload === "object") {
        const payload = row.payload as Record<string, unknown>;
        const phone = (payload.phone as string | undefined) ?? null;
        if (phone) {
          phoneFromOnboarding.set(row.ownerId, phone);
        }
      }
    });
  }

  // Combiner les numéros : priorité au profil, sinon depuis l'onboarding
  const clientsWithPhone = clients.map((client) => ({
    ...client,
    referrerName: client.referrerName,
    referrerCompany: client.referrerCompany,
    phone: client.phone ?? phoneFromOnboarding.get(client.id) ?? null
  }));

  // Récupérer tous les projets et les compter en parallèle (optimisation : 2 requêtes au lieu de N)
  const [allProjects, projectCounts] = await Promise.all([
    db
      .select({
        ownerId: projects.ownerId,
        id: projects.id,
        name: projects.name,
        demoUrl: projects.demoUrl,
        status: projects.status,
        createdAt: projects.createdAt
      })
      .from(projects)
      .orderBy(asc(projects.createdAt)),
    db
      .select({
        ownerId: projects.ownerId,
        count: sql<number>`COUNT(*)::int`.as("count")
      })
      .from(projects)
      .groupBy(projects.ownerId)
  ]);

  // Créer des maps pour accès rapide O(1)
  const projectsByOwner = new Map<string, typeof allProjects[0]>();
  const countsByOwner = new Map<string, number>();

  // Garder seulement le premier projet par owner (trié par createdAt ASC)
  allProjects.forEach((project) => {
    if (!projectsByOwner.has(project.ownerId)) {
      projectsByOwner.set(project.ownerId, project);
    }
  });

  projectCounts.forEach((count) => {
    countsByOwner.set(count.ownerId, Number(count.count));
  });

  // Récupérer les devis pour ces projets
  const projectIds = allProjects.map(p => p.id);
  let quotesByProject = new Map<string, { status: string, pdfUrl: string, signedPdfUrl: string | null }>();

  if (projectIds.length > 0) {
    const quotesData = await db.query.quotes.findMany({
      where: inArray(quotes.projectId, projectIds),
      columns: { projectId: true, status: true, pdfUrl: true, signedPdfUrl: true }
    });

    quotesData.forEach(q => {
      quotesByProject.set(q.projectId, q);
    });
  }

  // Combiner les données
  const clientsWithProjects: Client[] = clientsWithPhone
    .filter((client) => client.role !== "staff")
    .map((client) => {
      const firstProject = projectsByOwner.get(client.id);
      const projectCount = countsByOwner.get(client.id) ?? 0;

      let projectData = null;
      if (firstProject) {
        const quote = quotesByProject.get(firstProject.id);
        projectData = {
          id: firstProject.id,
          name: firstProject.name,
          demoUrl: firstProject.demoUrl,
          status: firstProject.status,
          quoteStatus: quote?.status ?? null,
          quotePdfUrl: quote?.signedPdfUrl ?? quote?.pdfUrl ?? null
        };
      }

      return {
        ...client,
        projectCount,
        firstProject: projectData,
        createdAt: client.createdAt?.toISOString() ?? null,
        role: client.role as "prospect" | "client",
        referrerName: client.referrerName,
        referrerCompany: client.referrerCompany
      };
    });

  return { clients: clientsWithProjects };
}

export default async function AdminClientsPage() {
  const { clients } = await loadClientsData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des clients"
        description="Gérez les clients et prospects. Promouvez les prospects en clients pour leur donner accès à toutes les fonctionnalités."
      />

      <ClientsList clients={clients} />
    </div>
  );
}
