import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

const { authUsers, profiles, userCredentials } = schema;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

const SALES_EMAIL = "sales@orylis.fr";
const SALES_PASSWORD = "SalesPassword123!";
const SALES_NAME = "Commerciale Orylis";

async function main() {
    console.log("Creating/Updating Sales User...");

    // 1. Check if user exists
    const existingUser = await db.query.authUsers.findFirst({
        where: (u, { eq }) => eq(u.email, SALES_EMAIL),
    });

    let userId = existingUser?.id;

    if (!userId) {
        console.log("User not found. Creating new user.");
        userId = randomUUID();

        // Insert into authUsers
        await db.insert(authUsers).values({
            id: userId,
            email: SALES_EMAIL,
            name: SALES_NAME,
            emailVerified: new Date(),
        });

        // Insert into profiles
        await db.insert(profiles).values({
            id: userId,
            role: "sales",
            fullName: SALES_NAME,
            company: "Orylis",
        });
    } else {
        console.log(`User found (ID: ${userId}). Updating role to 'sales'.`);

        // Update profile role
        await db.update(profiles)
            .set({ role: "sales" })
            .where(eq(profiles.id, userId));
    }

    // 2. Set Password
    const passwordHash = await hash(SALES_PASSWORD, 12);

    const existingCreds = await db.query.userCredentials.findFirst({
        where: (c, { eq }) => eq(c.userId, userId!),
    });

    if (existingCreds) {
        console.log("Updating password...");
        await db.update(userCredentials)
            .set({ passwordHash })
            .where(eq(userCredentials.userId, userId!));
    } else {
        console.log("Setting password...");
        await db.insert(userCredentials).values({
            userId: userId!,
            passwordHash,
        });
    }

    console.log("------------------------------------------------");
    console.log("Sales User Ready!");
    console.log(`Email: ${SALES_EMAIL}`);
    console.log(`Password: ${SALES_PASSWORD}`);
    console.log("------------------------------------------------");

    process.exit(0);
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
