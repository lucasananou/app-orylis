
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { randomUUID } from "crypto";
import "dotenv/config";
import * as schema from "../lib/schema";
import { authUsers, profiles, projects, userCredentials, onboardingResponses } from "../lib/schema";

async function debugOnboarding() {
    console.log("Starting debug onboarding...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("No DATABASE_URL");
        return;
    }

    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    const db = drizzle(pool, { schema });

    const userId = randomUUID();
    const projectId = randomUUID();
    const email = `test-${userId.substring(0, 8)}@debug.com`;

    try {
        console.log(`Attempting to insert user ${email}...`);

        await db.transaction(async (tx) => {
            // 1. Auth User
            console.log("Inserting authUser...");
            await tx.insert(authUsers).values({
                id: userId,
                email,
                emailVerified: new Date(),
            });

            // 2. Profile
            console.log("Inserting profile...");
            await tx.insert(profiles).values({
                id: userId,
                role: "prospect",
                fullName: "Debug User",
                company: "Debug Corp",
                phone: "+33600000000",
            });

            // 3. Credentials
            console.log("Inserting credentials...");
            await tx.insert(userCredentials).values({
                userId,
                passwordHash: "hash",
            });

            // 4. Project
            console.log("Inserting project...");
            await tx.insert(projects).values({
                id: projectId,
                ownerId: userId,
                name: "Debug Project",
                status: "demo_in_progress",
                progress: 10,
            });

            // 5. Onboarding Response
            console.log("Inserting onboarding response...");
            await tx.insert(onboardingResponses).values({
                projectId,
                payload: { debug: true },
                completed: true,
                type: "prospect",
            });
        });

        console.log("✅ Transaction successful!");

    } catch (error: any) {
        console.error("❌ Transaction failed!");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Detail:", error.detail);
        if (error.routine) console.error("Routine:", error.routine);
    } finally {
        await pool.end();
    }
}

debugOnboarding();
