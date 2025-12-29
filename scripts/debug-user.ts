import { db } from "@/lib/db";
import { authUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function main() {
    try {
        const user = await db.query.authUsers.findFirst({
            where: eq(authUsers.email, 'ebstudioparis@gmail.com')
        });
        console.log("User found:", user);
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}
main();
