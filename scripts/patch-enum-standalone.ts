
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    console.log("Adding 'demo_sent' to prospect_status enum...");
    try {
        await pool.query(`ALTER TYPE "public"."prospect_status" ADD VALUE IF NOT EXISTS 'demo_sent'`);
        console.log("Success adding enum value!");
        // Update statuses that were 'demo_sent' if any? No, this is new.
    } catch (e: any) {
        console.error("Error patching enum:", e.message);
    }
    await pool.end();
}

main();
