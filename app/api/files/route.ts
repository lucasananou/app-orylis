import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files, projects, profiles } from "@/lib/schema";
import { isStaff, userCanAccessProject } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  const conditions: Array<SQL<unknown>> = [];

  if (projectId) {
    conditions.push(eq(files.projectId, projectId));
  }

  if (!isStaff(session.user.role)) {
    conditions.push(eq(projects.ownerId, session.user.id));
  }

  const whereClause = conditions.reduce<SQL<unknown> | undefined>(
    (acc, condition) => (acc ? and(acc, condition) : condition),
    undefined
  );

  const baseQuery = db
    .select({
      id: files.id,
      label: files.label,
      path: files.path,
      storageProvider: files.storageProvider,
      projectId: files.projectId,
      createdAt: files.createdAt,
      uploaderId: files.uploaderId,
      projectName: projects.name,
      ownerId: projects.ownerId,
      uploaderName: profiles.fullName
    })
    .from(files)
    .innerJoin(projects, eq(files.projectId, projects.id))
    .leftJoin(profiles, eq(files.uploaderId, profiles.id));

  const query = whereClause ? baseQuery.where(whereClause) : baseQuery;

  const data = await query.orderBy(desc(files.createdAt));

  return NextResponse.json({
    data: data.map(({ ownerId, ...file }) => ({
      ...file,
      isOwnerFile: userCanAccessProject({
        ownerId,
        role: session.user.role,
        userId: session.user.id
      })
    }))
  });
}

