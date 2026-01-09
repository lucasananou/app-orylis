import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

const SALES_EMAIL = "sales@orylis.fr";

async function main() {
    console.log(`Checking role for ${SALES_EMAIL}...`);

    const user = await db.query.authUsers.findFirst({
        where: (u, { eq }) => eq(u.email, SALES_EMAIL),
        with: {
            profile: true
        }
    });

    if (!user) {
        console.log("User NOT FOUND in authUsers");
    } else {
        console.log("User FOUND:");
        console.log(`ID: ${user.id}`);
        console.log(`Name: ${user.name}`);
        if (user.profile) {
            console.log(`Profile Role: ${user.profile.role}`);
            console.log(`Profile ID: ${user.profile.id}`);
        } else {
            console.log("Profile NOT FOUND");
        }
    }

    process.exit(0);
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
