import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { isStaff } from "@/lib/utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify access (Staff only for now, or owner)
    if (!isStaff(session.user.role)) {
        // Check if owner
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, id),
            columns: { ownerId: true }
        });

        if (!project || project.ownerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    // Fetch client onboarding (type = 'client')
    const onboarding = await db
        .select()
        .from(onboardingResponses)
        .where(
            and(
                eq(onboardingResponses.projectId, id),
                eq(onboardingResponses.type, "client")
            )
        )
        .limit(1)
        .then((rows) => rows[0]);

    if (!onboarding) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(onboarding);
}
