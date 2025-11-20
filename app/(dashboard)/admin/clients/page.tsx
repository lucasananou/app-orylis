import { redirect } from "next/navigation";
import { eq, asc, or, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, authUsers, projects } from "@/lib/schema";
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
  const clientsWithProjects = clients
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

