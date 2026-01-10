import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
    // Rechercher le projet pour yoobi.coorporation@gmail.com
    const user = await db.query.authUsers.findFirst({
        where: (u, { eq }) => eq(u.email, "yoobi.coorporation@gmail.com"),
        with: {
            projects: {
                columns: {
                    id: true,
                    name: true,
                    googlePropertyId: true
                }
            }
        }
    });

    if (!user) {
        console.log("❌ Utilisateur non trouvé");
        process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`);
    console.log(`   ID: ${user.id}\n`);

    if (user.projects.length === 0) {
        console.log("❌ Aucun projet trouvé pour cet utilisateur");
        process.exit(1);
    }

    console.log(`Projets (${user.projects.length}):`);
    user.projects.forEach(p => {
        console.log(`\n  • ${p.name}`);
        console.log(`    ID: ${p.id}`);
        console.log(`    Google Property ID: ${p.googlePropertyId || "❌ NON CONFIGURÉ"}`);

        if (p.googlePropertyId) {
            console.log(`    ✅ URL de test: http://localhost:3000/api/projects/${p.id}/analytics`);
        }
    });

    process.exit(0);
}

main().catch((err) => {
    console.error("Erreur:", err);
    process.exit(1);
});
