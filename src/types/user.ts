// Domain types for the auth feature. The DB row carries the secret hash;
// the "safe" shape is the only thing that ever crosses an API/session boundary.

/** A full user row as stored in SQLite. Server-side only. */
export interface UserRow {
  id: number;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: string;
}

/** AC-2 / AC-7: the only user shape allowed to leave the server. No hash. */
export interface SafeUser {
  id: number;
  email: string;
  name: string | null;
}

/** Strip the hash (and any other secret column) from a row. */
export function toSafeUser(row: UserRow): SafeUser {
  return { id: row.id, email: row.email, name: row.name };
}
