
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

    const targetEmail = "orylisfrance@gmail.com";

    try {
        console.log(`Searching for user with email: ${targetEmail}`);

        // 1. Find User ID
        const userResult = await db.execute(sql`
      SELECT id FROM "user" WHERE email = ${targetEmail}
    `);

        if (userResult.rowCount === 0) {
            console.error("User not found.");
            process.exit(1);
        }
        const userId = userResult.rows[0].id as string;
        console.log(`Found User ID: ${userId}`);

        // 2. Find Profile ID (should be same/linked)
        // The schema says profiles.id references authUsers.id, so typically they are the same UUID/String.
        // Let's verify if a project exists for this owner.

        // 3. Update Project
        console.log("Updating project status to 'delivered'...");

        // We update the most recent project if multiple exist, or just the active one?
        // Let's assume one active project for now or update all non-delivered ones?
        // Safest: Update the active project.

        const updateResult = await db.execute(sql`
        UPDATE "orylis_projects" 
        SET 
            status = 'delivered',
            progress = 100,
            delivered_at = NOW(),
            maintenance_active = true
        WHERE owner_id = ${userId}
        RETURNING id, name, status
    `);

        if (updateResult.rowCount === 0) {
            console.log("No projects found for this user.");
        } else {
            console.log("Updated projects:", updateResult.rows);
        }

    } catch (error) {
        console.error("Error updating project:", error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
