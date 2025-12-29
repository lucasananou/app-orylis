import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        // Add internal_notes column
        await db.execute(sql`ALTER TABLE "orylis_profiles" ADD COLUMN IF NOT EXISTS "internal_notes" text;`);
        console.log("Successfully added internal_notes column.");
    } catch (err) {
        console.error("Error executing migration:", err);
    }
    process.exit(0);
}

main();
