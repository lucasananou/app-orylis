import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files, projects } from "@/lib/schema";
import { isStaff, isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { FilesSection } from "@/components/files/files-section";
import { ProspectBanner } from "@/components/prospect/prospect-banner";

// Cache les fichiers pendant 20 secondes
export const revalidate = 20;

async function loadFilesPageData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;
  const staff = isStaff(user.role);
  const isProspectUser = isProspect(user.role);

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
        where: (project, { eq: eqFn }) => eqFn(project.ownerId, user.id),
        columns: {
          id: true,
          name: true,
          ownerId: true
        },
        orderBy: (project, { asc }) => asc(project.name)
      });

  const projectIds = accessibleProjects.map((project) => project.id);

  const rawFiles =
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

  return {
    role: user.role,
    staff,
    accessibleProjects,
    userId: user.id,
    files: rawFiles.map((file) => ({
      id: file.id,
      label: file.label ?? "Fichier sans titre",
      storageProvider: file.storageProvider,
      createdAt: file.createdAt.toISOString(),
      path: file.path,
      projectId: file.projectId,
      projectName: file.projectName,
      canDelete: staff || file.ownerId === user.id
    }))
  };
}

export default async function FilesPage(): Promise<JSX.Element> {
  const { role, staff, accessibleProjects, files, userId } = await loadFilesPageData();
  const isProspectUser = isProspect(role);

  return (
    <>
      <PageHeader
        title="Fichiers partagés"
        description="Tous les livrables, exports et documents de travail centralisés."
      />
      {isProspectUser && <ProspectBanner />}
      <FilesSection
        projects={accessibleProjects.map(({ id, name }) => ({ id, name }))}
        files={files}
        role={role}
        canManage={staff || accessibleProjects.some((project) => project.ownerId === userId)}
      />
    </>
  );
}

