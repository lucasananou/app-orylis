
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load .env manually
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
    // Retrieve the test user
    const user = await db.query.authUsers.findFirst({
        where: eq(schema.authUsers.email, 'prospect-test-01@orylis.app'),
    });

    if (!user) {
        console.error('User not found!');
        process.exit(1);
    }

    console.log('User found:', user.id);

    // 1. Update Profile Role to 'client'
    console.log('Promoting user to client...');
    await db.update(schema.profiles)
        .set({ role: 'client' })
        .where(eq(schema.profiles.id, user.id));

    // 2. Find Project
    const project = await db.query.projects.findFirst({
        where: eq(schema.projects.ownerId, user.id),
    });

    if (!project) {
        console.error('Project not found!');
        process.exit(1);
    }

    // 3. Update Project Status to 'design' (or similar active status)
    // This simulates that the quote has been signed and the project is kicking off
    console.log('Updating project status to design...');
    await db.update(schema.projects)
        .set({ status: 'design' })
        .where(eq(schema.projects.id, project.id));

    console.log('Success! User promoted to client and project set to design.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
