import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        await client.query('ALTER TABLE "orylis_profiles" ADD COLUMN IF NOT EXISTS "internal_notes" text;');
        console.log("Success: Added internal_notes column.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}
main();
