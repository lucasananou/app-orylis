import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboardingDrafts, onboardingResponses } from "@/lib/schema";
import { eq, lt, isNull, and, sql } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
    try {
        // 1. Find stale drafts (> 10 mins, not alerted)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        const staleDrafts = await db.select()
            .from(onboardingDrafts)
            .where(and(
                lt(onboardingDrafts.updatedAt, tenMinutesAgo),
                isNull(onboardingDrafts.alertedAt)
            ));

        if (staleDrafts.length === 0) {
            return NextResponse.json({ message: "No stale drafts found" });
        }

        let alertedCount = 0;

        for (const draft of staleDrafts) {
            // 2. Check if actually completed (in onboarding_responses)
            // We check by email inside the payload (since onboarding_responses doesn't have direct email column usually, but let's check payload)
            // Actually, onboarding_responses has a projectId, and authUsers has email. 
            // But simpler: we can check if an authUser exists with this email? 
            // Yes, if they finished, they have an account.

            // Wait, public onboarding creates an account.
            // So if authUser exists, they likely finished? 
            // Or maybe they finished step 1 (account creation) but not the wizard?
            // The wizard creates everything at the END.
            // So if they exist in authUsers, they finished.

            const user = await db.query.authUsers.findFirst({
                where: (users, { eq }) => eq(users.email, draft.email)
            });

            if (user) {
                // They finished! Mark as alerted (or just delete?)
                // Let's mark as alerted so we don't check again.
                await db.update(onboardingDrafts)
                    .set({ alertedAt: new Date() })
                    .where(eq(onboardingDrafts.id, draft.id));
                continue;
            }

            // 3. They haven't finished -> Send Alert
            const payload = draft.payload as any;
            const name = `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || "Inconnu";
            const phone = draft.phone || "Non renseigné";

            await resend.emails.send({
                from: "Orylis Admin <admin@orylis.com>", // Update with real sender
                to: ["admin@orylis.com"], // Update with real admin email
                subject: `⚠️ Abandon Onboarding : ${name}`,
                html: `
                    <h1>Abandon de formulaire détecté</h1>
                    <p>Le prospect <strong>${name}</strong> a commencé le formulaire il y a plus de 10 minutes mais ne l'a pas terminé.</p>
                    <ul>
                        <li><strong>Email :</strong> ${draft.email}</li>
                        <li><strong>Téléphone :</strong> ${phone}</li>
                        <li><strong>Dernière étape :</strong> ${draft.step}</li>
                    </ul>
                    <p>👉 <a href="tel:${phone}">Appeler maintenant</a></p>
                `
            });

            // 4. Mark as alerted
            await db.update(onboardingDrafts)
                .set({ alertedAt: new Date() })
                .where(eq(onboardingDrafts.id, draft.id));

            alertedCount++;
        }

        return NextResponse.json({ success: true, alerted: alertedCount });
    } catch (error) {
        console.error("Cron check error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
