import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function main() {
    try {
        console.log("Adding 'sales' to profile_role enum...");
        await db.execute(sql`ALTER TYPE "public"."profile_role" ADD VALUE IF NOT EXISTS 'sales'`);

        console.log("Adding 'meeting_booked_at' column to profiles table...");
        await db.execute(sql`ALTER TABLE "orylis_profiles" ADD COLUMN IF NOT EXISTS "meeting_booked_at" timestamp with time zone`);

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
    process.exit(0);
}

main();
