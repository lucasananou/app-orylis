import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    if (!process.env.DATABASE_URL) {
        process.exit(1);
    }
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT * FROM "user" WHERE email = $1', ['ebstudioparis@gmail.com']);
        console.log("User:", res.rows[0]);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}
main();
