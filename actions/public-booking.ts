"use server";

import { db } from "@/lib/db";
import { profiles, calendarEvents, authUsers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function bookPublicMeeting(data: {
    name: string;
    email: string;
    phone: string;
    budget?: string;
    startTime: string; // ISO string
    notes?: string;
}) {
    // 1. Find a "Host" (For MVP, pick the first admin/sales user found)
    // In a real multi-tenant app, this would be based on the URL (e.g. /book/[username])
    const host = await db.query.profiles.findFirst({
        where: (p, { or, eq }) => or(eq(p.role, "prospect"), eq(p.role, "client")) ? undefined : undefined, // Quick hack to find staff
        // Actually, let's find a user who has Google Tokens if possible, or just the first created user
        orderBy: (p, { asc }) => [asc(p.createdAt)]
    });

    // Better strategy: Find the first user who is NOT a prospect/client.
    // Since we don't have a reliable "staff" filter yet in the query above easily without raw SQL or better filter, 
    // let's assume we want to match a specific user or just ANY non-prospect.
    // Let's try to find a user with role 'sales' or 'admin' (if roles exist).
    // Based on schema, role is enum: "prospect" | "client" | "staff" | "sales"
    const hostUser = await db.query.profiles.findFirst({
        where: (p, { inArray }) => inArray(p.role, ["sales", "staff"]),
    });

    if (!hostUser) {
        throw new Error("No available host found for booking.");
    }

    // 2. Upsert Prospect
    let prospectId: string;

    // Check if user exists by email
    const existingAuth = await db.query.authUsers.findFirst({
        where: eq(authUsers.email, data.email)
    });

    if (existingAuth) {
        prospectId = existingAuth.id;
        // Update name if missing?
    } else {
        // Create new prospect
        // We need an ID for authUsers (usually from an Auth provider, but here we create manually?)
        // Wait, standard Auth flow creates authUsers. Manually inserting into authUsers might break NextAuth if not careful.
        // But for a "lead", we might just create a Profile without an AuthUser? 
        // Schema says: id references authUsers.id. So we MUST have an authUser.
        // We will generate a uuid for the ID.

        const crypto = require('crypto');
        const newId = crypto.randomUUID();

        // Transaction to ensure consistency
        await db.transaction(async (tx) => {
            await tx.insert(authUsers).values({
                id: newId,
                email: data.email,
                emailVerified: new Date(), // It's verified by them entering it? Or leave null.
            });

            await tx.insert(profiles).values({
                id: newId,
                role: "prospect",
                fullName: data.name,
                prospectStatus: "new",
                createdAt: new Date(),
            });
        });

        prospectId = newId;
    }

    // 3. Create Calendar Event
    const startDate = new Date(data.startTime);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30); // Default 30 min duration

    // Build description with all collected info
    const budgetLabels: Record<string, string> = {
        "less-1k": "Moins de 1 000 €",
        "1k-2k": "Entre 1 000 € et 2 000 €",
        "2k-4k": "Entre 2 000 € et 4 000 €",
        "more-4k": "Plus de 4 000 €",
        "discuss": "Je préfère en discuter"
    };
    const budgetText = data.budget ? budgetLabels[data.budget] || data.budget : "Non renseigné";

    const description = `Réservé via page publique.
Téléphone: ${data.phone}
Budget envisagé: ${budgetText}
Notes: ${data.notes || "Aucune"}`;

    const [event] = await db.insert(calendarEvents).values({
        prospectId: prospectId,
        createdById: hostUser.id,
        title: `Démo avec ${data.name}`,
        description,
        type: "demo",
        startTime: startDate,
        endTime: endDate,
        status: "scheduled"
    }).returning();

    // 4. Send emails
    try {
        // Import email functions
        const { sendBookingConfirmationEmail, sendBookingNotificationToAdmin } = await import("@/lib/emails");

        // Send confirmation to prospect
        await sendBookingConfirmationEmail({
            name: data.name,
            email: data.email,
            phone: data.phone,
            date: startDate,
            budget: data.budget,
            meetingUrl: event.meetingUrl || undefined
        });

        // Send notification to admin/sales
        await sendBookingNotificationToAdmin({
            name: data.name,
            email: data.email,
            phone: data.phone,
            date: startDate,
            budget: data.budget,
            notes: data.notes,
            eventId: event.id
        });
    } catch (error) {
        console.error("Failed to send booking emails:", error);
        // Don't fail the request, just log it.
    }

    // 5. Trigger Google Sync (if host has tokens)
    if (hostUser.googleAccessToken) {
        try {
            const { syncEventToGoogle } = await import("@/lib/google-calendar");
            const syncResult = await syncEventToGoogle(hostUser.id, {
                id: event.id,
                title: event.title,
                description: event.description,
                startTime: event.startTime,
                endTime: event.endTime,
                meetingUrl: event.meetingUrl,
                location: event.location,
                prospect: {
                    fullName: data.name,
                    email: data.email
                }
            });

            if (syncResult) {
                await db.update(calendarEvents)
                    .set({
                        googleEventId: syncResult.id,
                        meetingUrl: syncResult.meetingUrl || event.meetingUrl
                    })
                    .where(eq(calendarEvents.id, event.id));
            }
        } catch (error) {
            console.error("Failed to sync public booking to Google Calendar:", error);
            // Don't fail the request, just log it.
        }
    }

    // Revalidate paths logic if needed (dashboard might see new event)
    revalidatePath("/dashboard/agenda");

    return { success: true, eventId: event.id };
}
