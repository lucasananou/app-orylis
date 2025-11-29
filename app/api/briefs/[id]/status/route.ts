import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectBriefs, projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: briefId } = await params;
    const body = await request.json();
    const { status, clientComment } = body;

    if (!["approved", "rejected"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get brief and verify ownership
    const brief = await db.query.projectBriefs.findFirst({
        where: eq(projectBriefs.id, briefId),
        with: {
            project: {
                with: {
                    owner: true
                }
            }
        }
    });

    if (!brief) {
        return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    const isOwner = brief.project.owner.id === session.user.id;

    if (!isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (brief.status !== "sent") {
        return NextResponse.json({ error: "Brief is not in pending state" }, { status: 400 });
    }

    const [updatedBrief] = await db
        .update(projectBriefs)
        .set({
            status,
            clientComment,
            updatedAt: new Date()
        })
        .where(eq(projectBriefs.id, briefId))
        .returning();

    if (status === "approved") {
        await db
            .update(projects)
            .set({ status: "design" })
            .where(eq(projects.id, brief.project.id));
    }

    // TODO: Send email notification to admin

    return NextResponse.json(updatedBrief);
}
