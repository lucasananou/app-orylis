
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load .env manually to ensure DATABASE_URL is available
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function main() {
    console.log('Finding user...');
    const user = await db.query.authUsers.findFirst({
        where: eq(schema.authUsers.email, 'prospect-test-01@orylis.app'),
    });

    if (!user) {
        console.error('User not found!');
        process.exit(1);
    }

    console.log('User found:', user.id);

    const project = await db.query.projects.findFirst({
        where: eq(schema.projects.ownerId, user.id),
    });

    if (!project) {
        console.error('Project not found!');
        process.exit(1);
    }

    console.log('Project found:', project.name, project.status);

    console.log('Updating project with demoUrl...');
    // We keep status as demo_in_progress but adding demoUrl triggers logic in page.tsx
    await db.update(schema.projects)
        .set({
            demoUrl: 'https://demo.orylis.com/boulangerie-test',
            status: 'demo_in_progress'
        })
        .where(eq(schema.projects.id, project.id));

    console.log('Project updated successfully! User should now be redirected to /demo.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
