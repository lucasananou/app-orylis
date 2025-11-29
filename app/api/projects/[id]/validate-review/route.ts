import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, notifications, profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
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

        // Update project status to 'delivered'
        await db
            .update(projects)
            .set({
                status: "delivered",
                deliveredAt: new Date()
            })
            .where(eq(projects.id, projectId));

        // Notify Staff
        const staffAdmins = await db.query.profiles.findMany({
            where: eq(profiles.role, "staff")
        });

        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId)
        });

        for (const admin of staffAdmins) {
            await db.insert(notifications).values({
                userId: admin.id,
                projectId: projectId,
                type: "system",
                title: "Projet Validé !",
                body: `Le client a validé le site ${project?.name}. Le projet est maintenant LIVRÉ.`,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[VALIDATE_REVIEW]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
