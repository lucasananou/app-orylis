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
    // For 200 emails, we can loop. Resend handles bulk nicely but let's be gentle.
    let sentCount = 0;

    // Process in chunks of 10 to avoid timeouts? or just loop. 
    // Next.js server actions have a timeout limit (standard 10-60s on Vercel depending on plan).
    // For MVP, we'll try to process them all. If many, we might want background jobs, but for ~200 it's fine.

    // We'll return the count of TO BE sent emails, but triggering the actual sending might be better done 
    // in smaller batches if we hit limits. For now, let's just do it directly.

    console.log(`[Campaign] Launching revival for ${ghosts.length} prospects...`);

    const results = await Promise.allSettled(
        ghosts.map(async (ghost) => {
            // Check if we have an email helper that takes ID
            const res = await sendRevivalEmail(ghost.id);
            if (res.success) sentCount++;
            return res;
        })
    );

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
