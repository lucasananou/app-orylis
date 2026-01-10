import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

async function main() {
    console.log("🔍 Recherche de projets avec googlePropertyId configuré...\n");

    const projects = await db.query.projects.findMany({
        columns: {
            id: true,
            name: true,
            googlePropertyId: true,
            ownerId: true
        },
        limit: 10
    });

    console.log(`Nombre de projets trouvés: ${projects.length}\n`);

    const projectsWithGA = projects.filter(p => p.googlePropertyId);

    if (projectsWithGA.length === 0) {
        console.log("❌ Aucun projet n'a de googlePropertyId configuré");
        console.log("\n💡 Pour tester l'API analytics:");
        console.log("  1. Allez dans Admin > Clients");
        console.log("  2. Éditez un projet");
        console.log("  3. Ajoutez le Property ID (le numéro, pas le G-XXX)");
    } else {
        console.log(`✅ ${projectsWithGA.length} projet(s) avec googlePropertyId:\n`);
        projectsWithGA.forEach(p => {
            console.log(`  • ${p.name}`);
            console.log(`    ID: ${p.id}`);
            console.log(`    Property ID: ${p.googlePropertyId}`);
            console.log(`    URL de test: http://localhost:3000/api/projects/${p.id}/analytics\n`);
        });
    }

    process.exit(0);
}

main().catch((err) => {
    console.error("Erreur:", err);
    process.exit(1);
});
