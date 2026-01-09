import { MeetingsCalendar } from "@/components/sales/meetings-calendar";
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/schema";
import { gte, eq, and } from "drizzle-orm";

export default async function AgendaPage() {
    // Fetch all upcoming and recent calendar events
    const events = await db.query.calendarEvents.findMany({
        with: {
            prospect: true,
            createdBy: true
        },
        orderBy: [calendarEvents.startTime]
    });

    // Fetch active prospects for the event creation dialog
    const prospects = await db.query.profiles.findMany({
        where: (p, { and, eq, inArray }) => and(
            eq(p.role, "prospect"),
            inArray(p.prospectStatus, ["new", "contacted", "meeting", "proposal", "negotiation"])
        ),
        columns: {
            id: true,
            fullName: true,
            company: true,
        },
        orderBy: (p, { asc }) => [asc(p.fullName)]
    });

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">

            <div className="flex-1 min-h-0">
                <MeetingsCalendar events={events} prospects={prospects} />
            </div>
        </div>
    );
}
