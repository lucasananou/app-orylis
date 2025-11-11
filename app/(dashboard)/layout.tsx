import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const userEmail = user.email ?? "—";
  const staff = isStaff(user.role);

  const accessibleProjects = staff
    ? await db
        .select({
          id: projects.id,
          name: projects.name
        })
        .from(projects)
        .orderBy(asc(projects.name))
    : await db
        .select({
          id: projects.id,
          name: projects.name
        })
        .from(projects)
        .where(eq(projects.ownerId, user.id))
        .orderBy(asc(projects.name));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar
          role={user.role}
          userEmail={userEmail}
          userName={user.name}
          projects={accessibleProjects}
        />
        <main className="flex-1 bg-gradient-to-b from-[#F7F9FB] via-white to-white px-8 py-10">
          <div className="mx-auto w-full max-w-6xl space-y-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

