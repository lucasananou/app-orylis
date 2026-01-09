"use server";

import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface CalendarEvent {
    id: string;
    title: string;
    description?: string | null;
    startTime: Date | string;
    endTime: Date | string;
    meetingUrl?: string | null;
    location?: string | null;
    prospect: {
        fullName: string | null;
        email: string | null;
    };
}

interface GoogleTokens {
    accessToken: string;
    refreshToken?: string;
    expiry: Date;
}

/**
 * Refresh an expired Google access token
 */
async function refreshAccessToken(userId: string): Promise<string | null> {
    const user = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
        columns: {
            googleRefreshToken: true,
            googleAccessToken: true
        }
    });

    if (!user?.googleRefreshToken) {
        console.error("[Google Calendar] No refresh token for user", userId);
        return null;
    }

    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: user.googleRefreshToken,
                grant_type: "refresh_token"
            })
        });

        if (!response.ok) {
            console.error("[Google Calendar] Failed to refresh token:", await response.text());
            return null;
        }

        const data = await response.json();
        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + data.expires_in);

        // Update tokens in database
        await db.update(profiles)
            .set({
                googleAccessToken: data.access_token,
                googleTokenExpiry: newExpiry
            })
            .where(eq(profiles.id, userId));

        return data.access_token;
    } catch (error) {
        console.error("[Google Calendar] Error refreshing token:", error);
        return null;
    }
}

/**
 * Get a valid access token (refreshing if necessary)
 */
async function getValidAccessToken(userId: string): Promise<string | null> {
    const user = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
        columns: {
            googleAccessToken: true,
            googleTokenExpiry: true,
            googleRefreshToken: true
        }
    });

    if (!user?.googleAccessToken) {
        console.log("[Google Calendar] No access token for user", userId);
        return null;
    }

    // Check if token is expired
    if (user.googleTokenExpiry && new Date() >= user.googleTokenExpiry) {
        console.log("[Google Calendar] Token expired, refreshing...");
        return await refreshAccessToken(userId);
    }

    return user.googleAccessToken;
}

/**
 * Helper to safely convert any date-like input to ISO string
 * WITHOUT using toISOString() method to avoid environment issues
 */
const safeISODate = (d: any) => {
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        // Manually build ISO string
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
    } catch (e) {
        console.error("[Google Calendar] Date conversion error:", e, d);
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
};

/**
 * Create an event in Google Calendar
 */
export async function syncEventToGoogle(
    userId: string,
    event: CalendarEvent
): Promise<{ success: boolean; id?: string; meetingUrl?: string; error?: string }> {
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
        console.warn("[Google Calendar] Cannot sync: no valid token for user", userId);
        return { success: false, error: "Jeton d'accès invalide ou expiré" };
    }

    try {
        const googleEvent: any = {
            summary: event.title,
            description: event.description || undefined,
            start: {
                dateTime: safeISODate(event.startTime),
                timeZone: "Europe/Paris"
            },
            end: {
                dateTime: safeISODate(event.endTime),
                timeZone: "Europe/Paris"
            },
            location: event.location || undefined,
            attendees: event.prospect.email ? [{
                email: event.prospect.email,
                displayName: event.prospect.fullName || undefined
            }] : undefined,
            reminders: {
                useDefault: false,
                overrides: [
                    { method: "email", minutes: 24 * 60 },
                    { method: "popup", minutes: 60 }
                ]
            }
        };

        // If a meeting URL is active, use it. Otherwise request generation.
        if (event.meetingUrl) {
            googleEvent.conferenceData = {
                entryPoints: [{
                    entryPointType: "video",
                    uri: event.meetingUrl
                }]
            };
        } else {
            googleEvent.conferenceData = {
                createRequest: {
                    requestId: `${event.id}-${Date.now()}`,
                    conferenceSolutionKey: { type: "hangoutsMeet" }
                }
            };
        }

        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(googleEvent)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Google Calendar] Failed to create event:", errorText);

            let errorMessage = "Erreur API Google";
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorText;
            } catch (e) {
                errorMessage = errorText;
            }

            return { success: false, error: errorMessage };
        }

        const data = await response.json();
        console.log("[Google Calendar] Event created:", data.id);

        // Extract generated meet link if available
        const meetingUrl = data.hangoutLink ||
            data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri;

        return { success: true, id: data.id, meetingUrl };
    } catch (error) {
        console.error("[Google Calendar] Error creating event:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}

/**
 * Update an existing event in Google Calendar
 */
export async function updateGoogleEvent(
    userId: string,
    googleEventId: string,
    updates: Partial<CalendarEvent>
): Promise<boolean> {
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
        console.warn("[Google Calendar] Cannot update: no valid token");
        return false;
    }

    try {
        const googleUpdates: any = {};

        if (updates.title) googleUpdates.summary = updates.title;
        if (updates.description !== undefined) googleUpdates.description = updates.description;
        if (updates.location !== undefined) googleUpdates.location = updates.location;
        if (updates.startTime && updates.endTime) {
            googleUpdates.start = {
                dateTime: safeISODate(updates.startTime),
                timeZone: "Europe/Paris"
            };
            googleUpdates.end = {
                dateTime: safeISODate(updates.endTime),
                timeZone: "Europe/Paris"
            };
        }
        if (updates.meetingUrl) {
            googleUpdates.conferenceData = {
                entryPoints: [{
                    entryPointType: "video",
                    uri: updates.meetingUrl
                }]
            };
        }

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
            {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(googleUpdates)
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("[Google Calendar] Failed to update event:", error);
            return false;
        }

        console.log("[Google Calendar] Event updated:", googleEventId);
        return true;
    } catch (error) {
        console.error("[Google Calendar] Error updating event:", error);
        return false;
    }
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteGoogleEvent(
    userId: string,
    googleEventId: string
): Promise<boolean> {
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
        console.warn("[Google Calendar] Cannot delete: no valid token");
        return false;
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok && response.status !== 404) {
            const error = await response.text();
            console.error("[Google Calendar] Failed to delete event:", error);
            return false;
        }

        console.log("[Google Calendar] Event deleted:", googleEventId);
        return true;
    } catch (error) {
        console.error("[Google Calendar] Error deleting event:", error);
        return false;
    }
}
