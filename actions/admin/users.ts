"use server";

import { auth } from "@/auth";
import { isStaff } from "@/lib/utils";
import { sendMeetingRequestEmail } from "@/lib/emails";

export async function sendMeetingRequest(userId: string) {
    const session = await auth();

    // 1. Authentification & Authorization
    if (!session?.user || !isStaff(session.user.role)) {
        return { error: "Non autorisé" };
    }

    try {
        const result = await sendMeetingRequestEmail(userId);
        if (!result.success) {
            return { error: result.error || "Erreur lors de l'envoi de l'email" };
        }
        return { success: true };
    } catch (error) {
        console.error("Error sending meeting request:", error);
        return { error: "Erreur serveur" };
    }
}
