"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, authUsers } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function getSalesData() {
    const session = await auth();
    if (!session?.user) return { prospects: [], clients: [] };

    // Fetch prospects and clients with emails (JOIN with authUsers)
    const [prospects, clients] = await Promise.all([
        db
            .select({
                id: profiles.id,
                fullName: profiles.fullName,
                company: profiles.company,
                phone: profiles.phone,
                email: authUsers.email,
                createdAt: profiles.createdAt,
                meetingBookedAt: profiles.meetingBookedAt,
                prospectStatus: profiles.prospectStatus,
            })
            .from(profiles)
            .leftJoin(authUsers, eq(profiles.id, authUsers.id))
            .where(eq(profiles.role, "prospect"))
            .orderBy(desc(profiles.createdAt)),

        db
            .select({
                id: profiles.id,
                fullName: profiles.fullName,
                company: profiles.company,
                phone: profiles.phone,
                email: authUsers.email,
                createdAt: profiles.createdAt,
            })
            .from(profiles)
            .leftJoin(authUsers, eq(profiles.id, authUsers.id))
            .where(eq(profiles.role, "client"))
            .orderBy(desc(profiles.createdAt))
    ]);

    return { prospects, clients };
}
