import { redirect } from "next/navigation";
import { eq, asc, or, sql, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, authUsers, projects, onboardingResponses } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ClientsList } from "@/components/admin/clients-list";

// Cache 60 secondes : la liste des clients change peu
export const revalidate = 60;

async function loadClientsData() {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/");
  }

  // Récupérer tous les clients
  const clients = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      company: profiles.company,
      phone: profiles.phone,
      email: authUsers.email,
      role: profiles.role,
      createdAt: profiles.createdAt
    })
    .from(profiles)
    .innerJoin(authUsers, eq(profiles.id, authUsers.id))
    .where(or(eq(profiles.role, "prospect"), eq(profiles.role, "client")))
    .orderBy(asc(profiles.fullName));

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

  // Combiner les données
  const clientsWithProjects = clientsWithPhone
    .filter((client) => client.role !== "staff")
    .map((client) => {
      const firstProject = projectsByOwner.get(client.id);
      const projectCount = countsByOwner.get(client.id) ?? 0;

      return {
        ...client,
        projectCount,
        firstProject: firstProject
          ? {
              id: firstProject.id,
              name: firstProject.name,
              demoUrl: firstProject.demoUrl,
              status: firstProject.status
            }
          : null,
        createdAt: client.createdAt?.toISOString() ?? null,
        role: client.role as "prospect" | "client"
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
        description="G├®rez les clients et prospects. Promouvez les prospects en clients pour leur donner acc├¿s ├á toutes les fonctionnalit├®s."
      />

      <ClientsList clients={clients} />
    </div>
  );
}

