import { pool, ensureSchema } from '@/lib/db';
import type { UserRow } from '@/types/user';

// All user-row queries live here (AC-21). Callers that need a client-safe
// object must pass rows through toSafeUser() — this layer returns full rows
// for server-side auth checks (password comparison needs the hash).

export interface NewUser {
  email: string;
  passwordHash: string;
  name: string | null;
}

/** Look up a user by email (stored lower-cased). Returns the full row or null. */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await pool.query<UserRow>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()],
  );
  return rows[0] ?? null;
}

/** Look up a user by id. Returns the full row or null. */
export async function findUserById(id: number): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await pool.query<UserRow>(
    'SELECT * FROM users WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Insert a new user. Throws Postgres unique-violation (code 23505) if the email
 * already exists — callers map that to 409 (AC-6).
 */
export async function createUser(input: NewUser): Promise<UserRow> {
  await ensureSchema();
  const { rows } = await pool.query<UserRow>(
    'INSERT INTO users (email, name, "passwordHash") VALUES ($1, $2, $3) RETURNING *',
    [input.email.toLowerCase(), input.name, input.passwordHash],
  );
  return rows[0];
}
