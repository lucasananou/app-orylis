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
    ssl: {
      rejectUnauthorized: false
    },
    // Optimisations de performance et stabilité
    // Augmentation de la limite en dev pour éviter les blocages si une requête pend
    // En prod (serverless), on limite à 3 pour permettre quelques requêtes parallèles (dashboard)
    max: process.env.NODE_ENV === "production" ? 3 : 10,
    min: 0,
    idleTimeoutMillis: 5000, // Fermer les connexions inactives rapidement (5s)
    connectionTimeoutMillis: 2000, // Échouer rapidement si pas de connexion (2s)
    keepAlive: true // Maintenir la connexion active pour éviter les coupures silencieuses
  });

// Gestion des erreurs inattendues sur le pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Ne pas throw ici pour éviter de crasher l'app, laisser le pool gérer la reconnexion
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

