import { redirect } from "next/navigation";
import { eq, asc, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, authUsers, projects } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ClientsList } from "@/components/admin/clients-list";

export const dynamic = "force-dynamic";

async function loadClientsData() {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/");
  }

  const clients = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      company: profiles.company,
      email: authUsers.email,
      role: profiles.role,
      createdAt: profiles.createdAt
    })
    .from(profiles)
    .innerJoin(authUsers, eq(profiles.id, authUsers.id))
    .where(or(eq(profiles.role, "prospect"), eq(profiles.role, "client")))
    .orderBy(asc(profiles.fullName));

  // Compter les projets par client et récupérer le premier projet pour les prospects
  const clientsWithProjects = await Promise.all(
    clients
      .filter((client) => client.role !== "staff") // Filtrer les staff (ne devrait pas arriver mais sécurité)
      .map(async (client) => {
        const clientProjects = await db
          .select({
            id: projects.id,
            name: projects.name,
            demoUrl: projects.demoUrl,
            status: projects.status
          })
          .from(projects)
          .where(eq(projects.ownerId, client.id))
          .limit(1);

        return {
          ...client,
          projectCount: await db
            .select({ count: projects.id })
            .from(projects)
            .where(eq(projects.ownerId, client.id))
            .then((rows) => rows.length),
          firstProject: clientProjects[0] ?? null,
          createdAt: client.createdAt?.toISOString() ?? null,
          role: client.role as "prospect" | "client" // Type assertion car on a filtré les staff
        };
      })
  );

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

