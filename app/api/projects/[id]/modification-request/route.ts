import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectBriefs, projects, notifications, profiles } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const projectId = params.id;
        const body = await req.json();
        const { feedback } = body;

        if (!feedback) {
            return new NextResponse("Feedback required", { status: 400 });
        }

        // 1. Get current max version
        const existingBriefs = await db
            .select()
            .from(projectBriefs)
            .where(eq(projectBriefs.projectId, projectId))
            .orderBy(desc(projectBriefs.version))
            .limit(1);

        const currentVersion = existingBriefs[0]?.version || 0;
        const newVersion = currentVersion + 1;

        // 2. Create new brief version with feedback
        await db.insert(projectBriefs).values({
            projectId,
            version: newVersion,
            content: feedback, // Storing feedback as the content of the new brief version
            status: "sent", // Sent by client
            clientComment: "Modification Request (Review Phase)"
        });

        // 3. Update project status to 'build'
        await db
            .update(projects)
            .set({ status: "build" })
            .where(eq(projects.id, projectId));

        // 4. Notify Admin (Owner)
        // First get the project owner
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
            with: {
                owner: true
            }
        });

        // Notify all staff admins
        const staffAdmins = await db.query.profiles.findMany({
            where: eq(profiles.role, "staff")
        });

        for (const admin of staffAdmins) {
            await db.insert(notifications).values({
                userId: admin.id,
                projectId: projectId,
                type: "system",
                title: "Demande de modifications",
                body: `Le client a demandé des modifications sur le projet ${project?.name}. Statut passé en Build.`,
                metadata: { feedback }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[MODIFICATION_REQUEST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
