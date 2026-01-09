import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, types } from "pg";
import * as schema from "./schema";

// Force PG to parse timestamps as Date objects
types.setTypeParser(1114, (str) => new Date(str)); // timestamp
types.setTypeParser(1184, (str) => new Date(str)); // timestamptz

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var __dbPool_v6: Pool | undefined;
  // eslint-disable-next-line no-var, vars-on-top
  var __db_v6: NodePgDatabase<typeof schema> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Define it in your environment.");
}

const pool =
  globalThis.__dbPool_v6 ??
  new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    // Optimisations de performance et stabilité
    // Augmentation de la limite en dev pour éviter les blocages si une requête pend
    // En prod (serverless), on limite à 3 pour permettre quelques requêtes parallèles (dashboard)
    max: process.env.NODE_ENV === "production" ? 3 : 10,
    min: 0,
    idleTimeoutMillis: 20000, // Fermer les connexions inactives (20s)
    connectionTimeoutMillis: 10000, // Augmenter le timeout de connexion à 10s pour éviter les erreurs
    keepAlive: true // Maintenir la connexion active pour éviter les coupures silencieuses
  });

// Gestion des erreurs inattendues sur le pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Ne pas throw ici pour éviter de crasher l'app, laisser le pool gérer la reconnexion
});

const dbInstance =
  globalThis.__db_v6 ??
  drizzle(pool, {
    schema,
    logger: process.env.NODE_ENV === "development"
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__dbPool_v6 = pool;
  globalThis.__db_v6 = dbInstance;
}

export const db = dbInstance;
export { schema };

