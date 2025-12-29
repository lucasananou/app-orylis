"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isStaff } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function updateClientNotes(clientId: string, notes: string) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        throw new Error("Non autorisé.");
    }

    try {
        await db.update(profiles)
            .set({ internalNotes: notes })
            .where(eq(profiles.id, clientId));

        revalidatePath(`/admin/clients/${clientId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update notes:", error);
        return { error: "Erreur lors de la mise à jour." };
    }
}
