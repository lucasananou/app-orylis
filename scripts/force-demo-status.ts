
import { db } from "../lib/db";
import { projects, authUsers } from "../lib/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
    console.log("Forcing demo_in_progress status...");

    // 1. Get demo user
    const demoUser = await db.query.authUsers.findFirst({
        where: eq(authUsers.email, "demo@orylis.app")
    });

    if (!demoUser) {
        console.error("Demo user not found");
        process.exit(1);
    }

    // 2. Get project
    const project = await db.query.projects.findFirst({
        where: eq(projects.ownerId, demoUser.id)
    });

    if (project) {
        await db.update(projects)
            .set({ status: "demo_in_progress", demoUrl: null })
            .where(eq(projects.id, project.id));
        console.log("Project updated to demo_in_progress");
    } else {
        console.error("Project not found for demo user");
    }

    process.exit(0);
}

main();
