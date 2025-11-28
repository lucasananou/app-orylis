import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, subscriptions } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { ServicesPageClient } from "@/components/services/services-page-client";
import { redirect } from "next/navigation";

export default async function ServicesPage() {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
        redirect("/login");
    }

    // Fetch user's profile to get the ID used in projects (ownerId is profile ID, not auth ID usually, but let's check schema)
    // Schema: ownerId references profiles.id. profiles.id references authUsers.id. So they are the same.

    // Fetch user's projects
    const userProjects = await db.query.projects.findMany({
        where: eq(projects.ownerId, user.id),
        columns: { id: true }
    });

    const projectIds = userProjects.map(p => p.id);

    let userSubscriptions: any[] = [];

    if (projectIds.length > 0) {
        userSubscriptions = await db.query.subscriptions.findMany({
            where: inArray(subscriptions.projectId, projectIds),
        });
    }

    // Transform dates to pass to client component if needed (Next.js handles Date serialization usually, but sometimes warns)
    // Drizzle returns Date objects for timestamps.

    return (
        <ServicesPageClient subscriptions={userSubscriptions as any} />
    );
}
