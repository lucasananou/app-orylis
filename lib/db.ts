import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var __dbPool: Pool | undefined;
  // eslint-disable-next-line no-var, vars-on-top
  var __db: NodePgDatabase<typeof schema> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Define it in your environment.");
}

const pool =
  globalThis.__dbPool ??
  new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false
          }
        : undefined
  });

const dbInstance =
  globalThis.__db ??
  drizzle(pool, {
    schema,
    logger: process.env.NODE_ENV === "development"
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__dbPool = pool;
  globalThis.__db = dbInstance;
}

export const db = dbInstance;
export { schema };

