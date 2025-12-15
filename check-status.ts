import { db } from "./lib/db";
import { projects } from "./lib/schema";
import { ilike } from "drizzle-orm";

async function main() {
    const result = await db
        .select({
            id: projects.id,
            name: projects.name,
            status: projects.status,
            progress: projects.progress
        })
        .from(projects)
        .where(ilike(projects.name, "%Boulangerie%"));

    console.log("Projects found:", JSON.stringify(result, null, 2));
    process.exit(0);
}

main().catch(console.error);
