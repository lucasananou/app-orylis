import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const userId = session.user.id;

        // Create a new project
        const [newProject] = await db
            .insert(projects)
            .values({
                ownerId: userId,
                name: "Nouveau Projet",
                status: "onboarding",
                progress: 0,
                createdAt: new Date()
            })
            .returning({ id: projects.id });

        if (!newProject) {
            throw new Error("Impossible de créer le projet");
        }

        return NextResponse.json({
            ok: true,
            projectId: newProject.id
        });
    } catch (error) {
        console.error("[Create Project] Error:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue lors de la création du projet" },
            { status: 500 }
        );
    }
}
