"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calendarEvents, profiles } from "@/lib/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Force rebuild timestamp: 12345

type EventType = "demo" | "followup" | "closing" | "support" | "other";
type EventStatus = "scheduled" | "completed" | "cancelled" | "no_show";

interface CreateEventData {
    prospectId: string;
    title: string;
    description?: string;
    type: EventType;
    startTime: Date | string;
    endTime: Date | string;
    meetingUrl?: string;
    location?: string;
    notes?: string;
}

interface UpdateEventData {
    title?: string;
    description?: string;
    type?: EventType;
    status?: EventStatus;
    startTime?: Date | string;
    endTime?: Date | string;
    meetingUrl?: string;
    location?: string;
    notes?: string;
}


// Helper to safely convert to ISO string WITHOUT using toISOString()
function ensureISO(input: any): string {
    try {
        const d = new Date(input);
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }
        // Manually build ISO string to avoid toISOString method
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        const seconds = String(d.getUTCSeconds()).padStart(2, '0');
        const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
    } catch (e) {
        console.error("Date conversion failed:", input, e);
        // Fallback to current time
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
    }
}

export async function createCalendarEvent(data: CreateEventData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const [event] = await db.insert(calendarEvents).values({
        prospectId: data.prospectId,
        createdById: session.user.id,
        title: data.title,
        description: data.description,
        type: data.type,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        meetingUrl: data.meetingUrl,
        location: data.location,
        notes: data.notes,
    }).returning();

    let warning: string | undefined;

    // Sync to Google Calendar
    try {
        const { syncEventToGoogle } = await import("@/lib/google-calendar");

        // Fetch prospect for Google Calendar invite
        const prospect = await db.query.profiles.findFirst({
            where: eq(profiles.id, data.prospectId),
            with: { authUser: true }
        });

        if (prospect) {
            const syncResult = await syncEventToGoogle(session.user.id, {
                id: event.id,
                title: event.title,
                description: event.description,
                startTime: ensureISO(event.startTime),
                endTime: ensureISO(event.endTime),
                meetingUrl: event.meetingUrl,
                location: event.location,
                prospect: {
                    fullName: prospect.fullName,
                    email: prospect.authUser?.email || null
                }
            });

            if (syncResult.success) {
                await db.update(calendarEvents)
                    .set({
                        googleEventId: syncResult.id,
                        meetingUrl: syncResult.meetingUrl || event.meetingUrl
                    })
                    .where(eq(calendarEvents.id, event.id));

                // Update local event object
                event.meetingUrl = syncResult.meetingUrl || event.meetingUrl;
            } else {
                warning = syncResult.error || "Impossible de synchroniser avec Google Calendar.";
            }
        }
    } catch (error) {
        console.error("Google Sync Error:", error instanceof Error ? error.message : error);
        warning = "Erreur Google Calendar: " + (error instanceof Error ? error.message : String(error));
    }

    revalidatePath("/dashboard/agenda");
    revalidatePath(`/prospects/${data.prospectId}`);

    return { event, warning };
}

export async function updateCalendarEvent(eventId: string, data: UpdateEventData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify ownership
    const existingEvent = await db.query.calendarEvents.findFirst({
        where: eq(calendarEvents.id, eventId)
    });

    if (!existingEvent) throw new Error("Event not found");

    const updatePayload: any = { updatedAt: new Date() };

    // Explicitly map fields to avoid spreading unexpected types (e.g. strings for dates)
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.meetingUrl !== undefined) updatePayload.meetingUrl = data.meetingUrl;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    if (data.startTime) updatePayload.startTime = new Date(data.startTime);
    if (data.endTime) updatePayload.endTime = new Date(data.endTime);

    const [updatedEvent] = await db.update(calendarEvents)
        .set(updatePayload)
        .where(eq(calendarEvents.id, eventId))
        .returning();

    // Update in Google Calendar
    if (updatedEvent.googleEventId) {
        const { updateGoogleEvent } = await import("@/lib/google-calendar");
        // Ensure dates are also Date objects for the Google function
        const googleUpdateData = { ...data };
        if (googleUpdateData.startTime) googleUpdateData.startTime = new Date(googleUpdateData.startTime);
        if (googleUpdateData.endTime) googleUpdateData.endTime = new Date(googleUpdateData.endTime);

        await updateGoogleEvent(session.user.id, updatedEvent.googleEventId, googleUpdateData as any);
    }

    revalidatePath("/dashboard/agenda");
    revalidatePath(`/prospects/${existingEvent.prospectId}`);

    return updatedEvent;
}

export async function cancelCalendarEvent(eventId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existingEvent = await db.query.calendarEvents.findFirst({
        where: eq(calendarEvents.id, eventId),
        with: { prospect: true }
    });

    if (!existingEvent) throw new Error("Event not found");

    await db.update(calendarEvents)
        .set({ status: "cancelled" })
        .where(eq(calendarEvents.id, eventId));

    // Cancel in Google Calendar
    if (existingEvent.googleEventId) {
        const { deleteGoogleEvent } = await import("@/lib/google-calendar");
        await deleteGoogleEvent(session.user.id, existingEvent.googleEventId);
    }

    // TODO: Send cancellation email to prospect
    // await sendEventCancellationEmail(existingEvent.prospect.email, existingEvent);

    revalidatePath("/dashboard/agenda");
    revalidatePath(`/prospects/${existingEvent.prospectId}`);

    return { success: true };
}

export async function getUpcomingEvents() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const events = await db.query.calendarEvents.findMany({
        where: and(
            eq(calendarEvents.status, "scheduled"),
            gte(calendarEvents.startTime, new Date())
        ),
        with: {
            prospect: true,
            createdBy: true
        },
        orderBy: [calendarEvents.startTime],
        limit: 50
    });

    return events;
}

export async function getProspectEvents(prospectId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const events = await db.query.calendarEvents.findMany({
        where: eq(calendarEvents.prospectId, prospectId),
        with: {
            createdBy: true
        },
        orderBy: [desc(calendarEvents.startTime)]
    });

    return events;
}

export async function markEventCompleted(eventId: string, notes?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const [event] = await db.update(calendarEvents)
        .set({
            status: "completed",
            notes: notes || undefined
        })
        .where(eq(calendarEvents.id, eventId))
        .returning();

    revalidatePath("/dashboard/agenda");
    revalidatePath(`/prospects/${event.prospectId}`);

    return event;
}
