"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { passwordResetTokens } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

export async function generateImpersonationToken(targetUserId: string) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        return { error: "Non autorisé" };
    }

    // Generate a short-lived token (1 minute)
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

    try {
        // Clean up existing tokens for this user first
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, targetUserId));

        await db.insert(passwordResetTokens).values({
            userId: targetUserId,
            token,
            expiresAt
        });

        return { success: true, token };
    } catch (error) {
        console.error("Impersonation error:", error);
        return { error: "Erreur lors de la génération du jeton" };
    }
}
