import { Pool, types } from 'pg';

// Single owner of the Postgres connection pool (AC-21: DB access only through
// src/lib/db). Schema lives in one idempotent init block so the DB shape stays
// self-documenting (AC-1). Connection details come from DATABASE_URL (env),
// never hard-coded.

// Return DATE/TIMESTAMP columns as raw strings instead of JS Date objects, so
// rows are JSON-serializable for getServerSideProps and DATE values round-trip
// cleanly to <input type="date"> ("YYYY-MM-DD").
types.setTypeParser(1082, (v) => v); // date
types.setTypeParser(1114, (v) => v); // timestamp (no tz)
types.setTypeParser(1184, (v) => v); // timestamptz

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — cannot connect to Postgres.');
}

// Reuse the pool across Next.js dev hot-reloads (module re-evaluation would
// otherwise leak a new pool each time).
const globalForDb = globalThis as unknown as {
  __pgPool?: Pool;
  __schemaReady?: Promise<void>;
};

export const pool = globalForDb.__pgPool ?? new Pool({ connectionString });
if (!globalForDb.__pgPool) globalForDb.__pgPool = pool;

async function initSchema(): Promise<void> {
  // Column names are quoted to preserve camelCase so rows map directly onto the
  // TypeScript types (Postgres folds unquoted identifiers to lowercase).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id             SERIAL PRIMARY KEY,
      email          TEXT NOT NULL UNIQUE,
      name           TEXT,
      "passwordHash" TEXT NOT NULL,
      "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS backlog (
      id          SERIAL PRIMARY KEY,
      "userId"    INTEGER NOT NULL REFERENCES users(id),
      "gameId"    INTEGER NOT NULL,
      title       TEXT NOT NULL,
      cover       TEXT,
      platform    TEXT,
      status      TEXT NOT NULL DEFAULT 'Not Started',
      rating      INTEGER,
      notes       TEXT,
      "startDate" DATE,
      "endDate"   DATE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE("userId", "gameId")
    );
  `);

  // Backfill the timeline columns on databases created before they existed.
  await pool.query('ALTER TABLE backlog ADD COLUMN IF NOT EXISTS "startDate" DATE;');
  await pool.query('ALTER TABLE backlog ADD COLUMN IF NOT EXISTS "endDate" DATE;');
}

/** Ensure the schema exists. Runs once per process; safe to await everywhere. */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.__schemaReady) globalForDb.__schemaReady = initSchema();
  return globalForDb.__schemaReady;
}
