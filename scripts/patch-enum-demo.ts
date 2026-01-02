
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Adding 'demo_sent' to prospect_status enum...");
    try {
        // Warning: This cannot be rolled back easily in a transaction for Enums in some PG versions, 
        // but 'ADD VALUE' is generally safe to run even if it exists (it throws specific error).
        await db.execute(sql`ALTER TYPE "public"."prospect_status" ADD VALUE IF NOT EXISTS 'demo_sent'`);
        console.log("Success!");
    } catch (e: any) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}

main();
