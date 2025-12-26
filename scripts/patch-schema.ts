import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import "dotenv/config";

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not defined");
    }

    const pool = new Pool({ connectionString });
    const db = drizzle(pool);

    try {
        console.log("Adding google_property_id column...");
        await db.execute(sql`ALTER TABLE "orylis_projects" ADD COLUMN IF NOT EXISTS "google_property_id" text;`);
        console.log("Column added successfully or already exists.");
    } catch (error) {
        console.error("Error updating schema:", error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
