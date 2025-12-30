"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, authUsers, projects } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProspectStatus(clientId: string, newStatus: string) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        throw new Error("Non autorisé");
    }

    // Validate status against enum values
    const validStatuses = ["new", "contacted", "offer_sent", "negotiation", "lost"];
    if (!validStatuses.includes(newStatus)) {
        throw new Error("Statut invalide");
    }

    try {
        await db.update(profiles)
            .set({
                // @ts-ignore - Drizzle enum typing can be tricky with string inputs
                prospectStatus: newStatus
            })
            .where(eq(profiles.id, clientId));

        revalidatePath("/admin/prospects");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { error: "Erreur lors de la mise à jour" };
    }
}

export async function deleteProspect(prospectId: string) {
    const session = await auth();
    if (!session?.user || !isStaff(session.user.role)) {
        return { error: "Non autorisé" };
    }

    try {
        // Delete from authUsers (cascades to profiles, projects, etc.)
        await db.delete(authUsers).where(eq(authUsers.id, prospectId));

        revalidatePath("/admin/prospects");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete prospect:", error);
        return { error: "Erreur lors de la suppression" };
    }
}

export async function setDemoUrl(prospectId: string, url: string) {
    const session = await auth();
    if (!session?.user || !isStaff(session.user.role)) {
        return { error: "Non autorisé" };
    }

    try {
        // Find the project for this prospect
        const project = await db.query.projects.findFirst({
            where: eq(projects.ownerId, prospectId),
        });

        if (!project) {
            return { error: "Aucun projet trouvé pour ce prospect" };
        }

        await db.update(projects)
            .set({ demoUrl: url, status: "demo_in_progress" })
            .where(eq(projects.id, project.id));

        // Update profile status to 'negotiation' or similar? 
        // Let's keep it simple and just update the project. 
        // Maybe ensure prospect status is at least "contacted"?
        // For now, just the URL.

        revalidatePath("/admin/prospects");
        return { success: true };
    } catch (error) {
        console.error("Failed to set demo URL:", error);
        return { error: "Erreur lors de l'ajout du lien démo" };
    }
}
