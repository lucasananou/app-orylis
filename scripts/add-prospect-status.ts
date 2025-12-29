import "dotenv/config";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const client = new Client({
    connectionString,
});

async function main() {
    await client.connect();
    console.log("Connected to database");

    try {
        // Create Enum Type if not exists
        // Note: 'CREATE TYPE IF NOT EXISTS' is not standard SQL in some versions, but we can catch error
        try {
            await client.query(`
                CREATE TYPE "prospect_status" AS ENUM ('new', 'contacted', 'offer_sent', 'negotiation', 'lost');
            `);
            console.log("Created enum type 'prospect_status'");
        } catch (e: any) {
            if (e.code === '42710') {
                console.log("Enum type 'prospect_status' already exists");
            } else {
                throw e;
            }
        }

        // Add column to profiles table
        await client.query(`
            ALTER TABLE "orylis_profiles" 
            ADD COLUMN IF NOT EXISTS "prospect_status" "prospect_status" DEFAULT 'new';
        `);
        console.log("Added column 'prospect_status' to 'orylis_profiles'");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.end();
    }
}

main();
