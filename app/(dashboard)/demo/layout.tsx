import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { NavbarWrapper } from "@/components/navbar-wrapper";

// Layout spécifique pour la page démo qui utilise le même sidebar/navbar mais avec un main sans contraintes
export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;

  if (!isProspect(user.role)) {
    redirect("/");
  }

  // Récupérer les projets pour la navbar
  const accessibleProjects = await db
    .select({
      id: projects.id,
      name: projects.name
    })
    .from(projects)
    .where(eq(projects.ownerId, user.id))
    .orderBy(asc(projects.name));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col">
        <NavbarWrapper
          role={user.role}
          userEmail={user.email ?? "—"}
          userName={user.name}
          projects={accessibleProjects}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

