import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { billingLinks, projects } from "@/lib/schema";
import { billingLinkSchema } from "@/lib/zod-schemas";
import { assertUserCanAccessProject } from "@/lib/utils";

function reduceConditions(conditions: Array<SQL<unknown>>) {
  return conditions.reduce<SQL<unknown> | undefined>(
    (acc, condition) => (acc ? and(acc, condition) : condition),
    undefined
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  const whereConditions: Array<SQL<unknown>> = [];

  if (projectId) {
    whereConditions.push(eq(billingLinks.projectId, projectId));
  }

  if (session.user.role === "client") {
    whereConditions.push(eq(projects.ownerId, session.user.id));
  }

  const rows = await db
    .select({
      id: billingLinks.id,
      label: billingLinks.label,
      url: billingLinks.url,
      createdAt: billingLinks.createdAt,
      projectId: billingLinks.projectId,
      projectName: projects.name,
      ownerId: projects.ownerId
    })
    .from(billingLinks)
    .innerJoin(projects, eq(billingLinks.projectId, projects.id))
    .where(reduceConditions(whereConditions))
    .orderBy(desc(billingLinks.createdAt));

  const sanitized = rows.map(({ ownerId, ...rest }) => rest);

  return NextResponse.json({ data: sanitized });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const validation = billingLinkSchema.safeParse(payload);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Payload invalide.", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { projectId, label, url: linkUrl } = validation.data;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, ownerId: true }
  });

  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  try {
    assertUserCanAccessProject({
      role: session.user.role,
      userId: session.user.id,
      ownerId: project.ownerId
    });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const [created] = await db
    .insert(billingLinks)
    .values({
      projectId,
      label,
      url: linkUrl
    })
    .returning({
      id: billingLinks.id
    });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}

