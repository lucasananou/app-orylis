"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { sendRevivalEmail } from "@/lib/emails";
import { and, eq, inArray, lt, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function launchRevivalCampaign() {
    const session = await auth();

    // 1. Authentification & Authorization
    if (!session?.user || !isStaff(session.user.role)) {
        throw new Error("Unauthorized");
    }

    // 2. Fetch "Ghosts" (Prospects created > 7 days ago who are still 'new' or 'contacted')
    // We want to avoid spamming recent prospects.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ghosts = await db.query.profiles.findMany({
        where: and(
            eq(profiles.role, "prospect"),
            inArray(profiles.prospectStatus, ["new", "contacted"]),
            lt(profiles.createdAt, sevenDaysAgo)
        ),
        columns: {
            id: true,
            fullName: true
        }
    });

    if (ghosts.length === 0) {
        return { success: true, count: 0, message: "Aucun prospect à relancer." };
    }

    // 3. Send Batch Emails (with rate limiting / delays handled by the helper or loop)
    // For 200 emails, we can loop. Resend handles bulk nicely but we must respect 2 req/s limit.
    let sentCount = 0;

    console.log(`[Campaign] Launching revival for ${ghosts.length} prospects...`);

    // Sequential loop with delay to avoid 429 Too Many Requests
    for (const ghost of ghosts) {
        try {
            const res = await sendRevivalEmail(ghost.id);
            if (res.success) {
                sentCount++;
                console.log(`[Campaign] Email sent to ${ghost.fullName} (${ghost.id})`);
            } else {
                console.error(`[Campaign] Failed to send to ${ghost.fullName}:`, res.error);
            }
        } catch (err) {
            console.error(`[Campaign] Error processing ${ghost.fullName}:`, err);
        }

        // Wait 600ms between each email to respect 2 req/s limit
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    revalidatePath("/admin/prospects");

    return {
        success: true,
        count: sentCount,
        total: ghosts.length,
        message: `Campagne lancée : ${sentCount}/${ghosts.length} emails envoyés.`
    };
}

export async function getGhostCount() {
    const session = await auth();
    if (!session?.user || !isStaff(session.user.role)) return 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ghosts = await db.query.profiles.findMany({
        where: and(
            eq(profiles.role, "prospect"),
            inArray(profiles.prospectStatus, ["new", "contacted"]),
            lt(profiles.createdAt, sevenDaysAgo)
        ),
        columns: { id: true }
    });

    return ghosts.length;
}
