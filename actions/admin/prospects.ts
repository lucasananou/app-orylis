"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
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
