import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, tickets } from "@/lib/schema";
import { ticketCreateSchema } from "@/lib/zod-schemas";
import { assertUserCanAccessProject } from "@/lib/utils";

const TICKET_STATUSES = new Set(["open", "in_progress", "done"]);

function buildWhereClause(
  conditions: Array<SQL<unknown>>
): SQL<unknown> | undefined {
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
  const status = url.searchParams.get("status");

  if (status && !TICKET_STATUSES.has(status)) {
    return NextResponse.json({ error: "Status invalide." }, { status: 400 });
  }

  const whereConditions = [];

  if (projectId) {
    whereConditions.push(eq(tickets.projectId, projectId));
  }

  if (status) {
    whereConditions.push(eq(tickets.status, status));
  }

  if (session.user.role === "client") {
    whereConditions.push(eq(projects.ownerId, session.user.id));
  }

  const rows = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      projectId: tickets.projectId,
      projectName: projects.name,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt
    })
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .where(buildWhereClause(whereConditions))
    .orderBy(desc(tickets.createdAt));

  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const parsedBody = await request.json().catch(() => null);
  const validation = ticketCreateSchema.safeParse(parsedBody);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: validation.error.flatten()
      },
      { status: 400 }
    );
  }

  const { projectId, title, description } = validation.data;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      ownerId: true
    }
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
    .insert(tickets)
    .values({
      projectId,
      title,
      description,
      status: "open",
      authorId: session.user.id
    })
    .returning({
      id: tickets.id
    });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
