import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, projects } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { FilesSection } from "@/components/files/files-section";

const session = await auth();

if (!session?.user) {
  redirect("/login");
}

const staff = isStaff(session.user.role);

const accessibleProjects = staff
  ? await db
      .select({
        id: projects.id,
        name: projects.name,
        ownerId: projects.ownerId
      })
      .from(projects)
      .orderBy(projects.name)
  : await db.query.projects.findMany({
      where: (project, { eq: eqFn }) => eqFn(project.ownerId, session.user.id),
      columns: {
        id: true,
        name: true,
        ownerId: true
      },
      orderBy: (project, { asc }) => asc(project.name)
    });

const projectIds = accessibleProjects.map((project) => project.id);

const fileRows =
  projectIds.length === 0
    ? []
    : await (staff
        ? db
            .select({
              id: files.id,
              label: files.label,
              storageProvider: files.storageProvider,
              createdAt: files.createdAt,
              path: files.path,
              projectId: files.projectId,
              projectName: projects.name,
              ownerId: projects.ownerId
            })
            .from(files)
            .innerJoin(projects, eq(files.projectId, projects.id))
            .orderBy(desc(files.createdAt))
        : db
            .select({
              id: files.id,
              label: files.label,
              storageProvider: files.storageProvider,
              createdAt: files.createdAt,
              path: files.path,
              projectId: files.projectId,
              projectName: projects.name,
              ownerId: projects.ownerId
            })
            .from(files)
            .innerJoin(projects, eq(files.projectId, projects.id))
            .where(inArray(files.projectId, projectIds))
            .orderBy(desc(files.createdAt)));

export default function FilesPage(): JSX.Element {
  return (
    <>
      <PageHeader
        title="Fichiers partagés"
        description="Tous les livrables, exports et documents de travail centralisés."
      />
      <FilesSection
        projects={accessibleProjects.map(({ id, name }) => ({ id, name }))}
        files={fileRows.map((file) => ({
          id: file.id,
          label: file.label ?? "Fichier sans titre",
          storageProvider: file.storageProvider,
          createdAt: file.createdAt.toISOString(),
          path: file.path,
          projectId: file.projectId,
          projectName: file.projectName,
          canDelete: staff || file.ownerId === session.user.id
        }))}
        role={session.user.role}
        canManage={staff || accessibleProjects.some((project) => project.ownerId === session.user.id)}
      />
    </>
  );
}

