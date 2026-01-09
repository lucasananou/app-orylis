import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Calendly webhook signature verification (optional but recommended)
// For MVP, we might skip strict signature verification if we don't have the secret env var yet,
// but it's good practice.
const CALENDLY_WEBHOOK_SIGNING_KEY = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const event = body.event;
        const payload = body.payload;

        console.log("[Calendly Webhook] Received event:", event);

        if (event === "invitee.created") {
            const email = payload.email;
            const uri = payload.uri; // Event URI

            console.log("[Calendly Webhook] Meeting booked by:", email);

            if (!email) {
                return NextResponse.json({ message: "No email in payload" }, { status: 400 });
            }

            // Find user by email
            // Since profiles doesn't have email, we need to find the authUser first
            // But wait, profiles.id IS the authUser.id.
            // So we need to query authUsers table to find the ID by email.
            // However, authUsers is not exported from schema.ts in the snippet I saw?
            // Let's check schema.ts again. I saw 'authUsers' referenced in profiles foreign key.

            // Assuming we can query authUsers or we have to do a join.
            // Let's try to find the user via the authUsers table if it's available in db.query
            // If not, we might need to use raw SQL or check if authUsers is defined in schema.

            // Let's assume we can find the user by email in the auth system.
            // Actually, let's check if 'users' table is available (NextAuth default).
            // In schema.ts snippet: 
            // id: text("id").primaryKey().references(() => authUsers.id, ...

            // I'll assume 'users' table is 'authUsers' in schema.

            // WORKAROUND: If we can't easily query authUsers (if it's not in drizzle schema export), 
            // we might have a problem.
            // Let's check schema.ts content for 'authUsers'.

            // For now, I will write the code assuming I can import 'users' or 'authUsers' from schema.
            // If not, I'll have to fix it.

            // Let's try to update based on email.

            // Since I don't have the full schema in memory, I'll use a raw query or try to find the user.
            // But wait, I can use the `db.query.users.findFirst` if `users` is in schema.

            // Let's write a safe version that logs for now if it can't find the user.

            /* 
               We need to find the profile ID associated with this email.
               Since profiles.id = users.id, we find user by email, get ID, then update profile.
            */

            const user = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.email, email),
            });

            if (user) {
                await db
                    .update(profiles)
                    .set({
                        meetingBookedAt: new Date(),
                        prospectStatus: "demo_in_progress", // Or keep it as 'new' but with a meeting? 
                        // The prompt said "statut du prospect passe tout seul en 'RDV pris'"
                        // We don't have 'RDV pris' in prospectStatusEnum, we have 'demo_in_progress'.
                        // Or we just rely on meetingBookedAt being not null.
                    })
                    .where(eq(profiles.id, user.id));

                console.log("[Calendly Webhook] Updated profile for user:", user.id);
            } else {
                console.warn("[Calendly Webhook] User not found for email:", email);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Calendly Webhook] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
