"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, authUsers, projects } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { sendEmail, getEmailTemplate } from "@/lib/emails";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProspectStatus(clientId: string, newStatus: string) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        throw new Error("Non autorisé");
    }

    // Validate status against enum values
    const validStatuses = ["new", "contacted", "demo_sent", "offer_sent", "negotiation", "lost"];
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
            with: {
                owner: {
                    with: {
                        authUser: true
                    }
                }
            }
        });

        if (!project) {
            return { error: "Aucun projet trouvé pour ce prospect" };
        }

        const userEmail = project.owner?.authUser?.email;

        await db.update(projects)
            .set({ demoUrl: url, status: "demo_in_progress" })
            .where(eq(projects.id, project.id));

        // Send email to prospect
        if (userEmail) {
            const emailContent = getEmailTemplate(
                `<h2 style="color: #1a202c;">Votre démo est prête ! 🚀</h2>
                <p>Bonne nouvelle, nous avons configuré une version de démonstration pour votre projet.</p>
                <p>Vous pouvez la consulter dès maintenant en cliquant sur le bouton ci-dessous :</p>`,
                "Voir ma démo",
                url
            );

            await sendEmail({
                to: userEmail,
                subject: "Votre démo est en ligne ! 🎨",
                html: emailContent,
                text: `Votre démo est prête ! Voir ici : ${url}`
            });
            console.log(`[Admin] Demo email sent to ${userEmail}`);
        }

        revalidatePath("/admin/prospects");
        return { success: true };
    } catch (error) {
        console.error("Failed to set demo URL:", error);
        return { error: "Erreur lors de l'ajout du lien démo" };
    }
}
