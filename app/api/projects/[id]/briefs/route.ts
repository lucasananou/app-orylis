import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectBriefs, projects } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isStaff } from "@/lib/utils";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify access
    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        columns: { ownerId: true }
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.ownerId === session.user.id;
    const isStaffUser = isStaff(session.user.role);

    if (!isOwner && !isStaffUser) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const briefs = await db.query.projectBriefs.findMany({
        where: eq(projectBriefs.projectId, projectId),
        orderBy: [desc(projectBriefs.version)]
    });

    return NextResponse.json(briefs);
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || !isStaff(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Get latest version
    const latestBrief = await db.query.projectBriefs.findFirst({
        where: eq(projectBriefs.projectId, projectId),
        orderBy: [desc(projectBriefs.version)]
    });

    const nextVersion = (latestBrief?.version || 0) + 1;

    const [newBrief] = await db
        .insert(projectBriefs)
        .values({
            projectId,
            version: nextVersion,
            content,
            status: "sent"
        })
        .returning();

    // Notify client? (TODO)

    return NextResponse.json(newBrief);
}
