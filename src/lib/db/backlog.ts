import { pool, ensureSchema } from '@/lib/db';
import type { BacklogStatus } from '@/lib/backlog/statuses';

// Backlog queries — ALWAYS scoped by userId (the #1 invariant). A missing
// `WHERE "userId" = $1` would leak every user's data.

export interface BacklogEntry {
  id: number;
  userId: number;
  gameId: number;
  title: string;
  cover: string | null;
  platform: string | null;
  status: string;
  rating: number | null;
  notes: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Fields a user may patch on their own entry. */
export interface BacklogPatch {
  status?: BacklogStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface NewBacklogEntry {
  gameId: number;
  title: string;
  cover: string | null;
  status?: BacklogStatus;
}

/** List a single user's backlog. Never returns other users' rows. */
export async function listBacklogForUser(userId: number): Promise<BacklogEntry[]> {
  await ensureSchema();
  const { rows } = await pool.query<BacklogEntry>(
    'SELECT * FROM backlog WHERE "userId" = $1 ORDER BY "createdAt" DESC',
    [userId],
  );
  return rows;
}

/**
 * Add a game to a user's backlog. Throws the Postgres unique-violation (23505)
 * if the user already has this gameId — the route maps that to 409.
 */
export async function createBacklogEntry(
  userId: number,
  input: NewBacklogEntry,
): Promise<BacklogEntry> {
  await ensureSchema();
  const { rows } = await pool.query<BacklogEntry>(
    `INSERT INTO backlog ("userId", "gameId", title, cover, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, input.gameId, input.title, input.cover, input.status ?? 'Not Started'],
  );
  return rows[0];
}

/**
 * Patch one entry (status and/or play dates) — scoped by userId. Only the
 * provided fields change. null if the row isn't the user's.
 */
export async function updateBacklogEntry(
  userId: number,
  id: number,
  patch: BacklogPatch,
): Promise<BacklogEntry | null> {
  await ensureSchema();

  // Build SET from whitelisted fields only; values stay parameterized.
  const sets: string[] = [];
  const vals: unknown[] = [userId, id];
  if (patch.status !== undefined) {
    vals.push(patch.status);
    sets.push(`status = $${vals.length}`);
  }
  if (patch.startDate !== undefined) {
    vals.push(patch.startDate);
    sets.push(`"startDate" = $${vals.length}`);
  }
  if (patch.endDate !== undefined) {
    vals.push(patch.endDate);
    sets.push(`"endDate" = $${vals.length}`);
  }
  if (sets.length === 0) return null;

  sets.push('"updatedAt" = now()');
  const { rows } = await pool.query<BacklogEntry>(
    `UPDATE backlog SET ${sets.join(', ')} WHERE id = $2 AND "userId" = $1 RETURNING *`,
    vals,
  );
  return rows[0] ?? null;
}

/** Delete one entry — scoped by userId. false if nothing was the user's to delete. */
export async function deleteBacklogEntry(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await pool.query(
    'DELETE FROM backlog WHERE id = $2 AND "userId" = $1',
    [userId, id],
  );
  return (rowCount ?? 0) > 0;
}
