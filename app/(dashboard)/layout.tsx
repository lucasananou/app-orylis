import { redirect } from "next/navigation";
import { cache } from "react";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { NavbarWrapper } from "@/components/navbar-wrapper";

// Cache le layout pendant 10 secondes (les projets changent peu souvent)
export const revalidate = 10;

// Cache la session pour éviter les appels multiples
const getCachedSession = cache(async () => {
  return await auth();
});

async function loadLayoutData() {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;
  const staff = isStaff(user.role);

  const accessibleProjects = staff
    ? await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status
      })
      .from(projects)
      .orderBy(asc(projects.name))
    : await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status
      })
      .from(projects)
      .where(eq(projects.ownerId, user.id))
      .orderBy(asc(projects.name));

  const hasDeliveredProject = accessibleProjects.some(p => p.status === "delivered");

  return {
    role: user.role,
    userEmail: user.email ?? "—",
    userName: user.name,
    accessibleProjects,
    hasDeliveredProject
  };
}

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const data = await loadLayoutData();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={data.role} hasDeliveredProject={data.hasDeliveredProject} />
      <div className="flex flex-1 flex-col">
        <NavbarWrapper
          role={data.role}
          userEmail={data.userEmail}
          userName={data.userName}
          projects={data.accessibleProjects}
        />
        <main className="flex-1 bg-gradient-to-b from-[#F7F9FB] via-white to-white py-4 sm:py-5 md:py-6">
          <div className="mx-auto w-full max-w-6xl space-y-4 min-w-0 safe-px sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

