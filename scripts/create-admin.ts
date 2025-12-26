
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import * as schema from "../lib/schema";
import { authUsers, profiles, userCredentials } from "../lib/schema";
import { randomUUID } from "node:crypto";
import "dotenv/config"; // Ensure .env is loaded

const ADMIN_EMAIL = "admin@orylis.app";
const ADMIN_PASSWORD = "AdminSecret123!";

async function createAdmin() {
    console.log(`Creating admin user: ${ADMIN_EMAIL}...`);

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in .env");
        process.exit(1);
    }

    // Create local db connection to bypass server-only restriction in lib/db.ts
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool, { schema });

    try {
        // 1. Check if user exists
        const existingUser = await db.query.authUsers.findFirst({
            where: (u, { eq }) => eq(u.email, ADMIN_EMAIL),
        });

        let userId;

        if (existingUser) {
            console.log("User already exists, updating...");
            userId = existingUser.id;
        } else {
            userId = randomUUID();
            await db.insert(authUsers).values({
                id: userId,
                email: ADMIN_EMAIL,
                name: "Super Admin",
                emailVerified: new Date(),
            });
            console.log("User created.");
        }

        // 2. Ensure Profile with STAFF role
        const existingProfile = await db.query.profiles.findFirst({
            where: (p, { eq }) => eq(p.id, userId),
        });

        if (existingProfile) {
            await db.update(profiles).set({ role: "staff" }).where(eq(profiles.id, userId));
            console.log("Profile updated to STAFF.");
        } else {
            await db.insert(profiles).values({
                id: userId,
                role: "staff",
                fullName: "Super Admin"
            });
            console.log("Profile created with STAFF role.");
        }

        // 3. Set Password
        const passwordHash = await hash(ADMIN_PASSWORD, 12);

        const existingCreds = await db.query.userCredentials.findFirst({
            where: (c, { eq }) => eq(c.userId, userId),
        });

        if (existingCreds) {
            await db.update(userCredentials).set({ passwordHash }).where(eq(userCredentials.userId, userId));
            console.log("Password updated.");
        } else {
            await db.insert(userCredentials).values({
                userId,
                passwordHash
            });
            console.log("Password set.");
        }

        console.log("✅ Admin user setup complete.");
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error("❌ Error creating admin user:", error);
        await pool.end();
        process.exit(1);
    }
}

createAdmin();
