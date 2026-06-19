import bcrypt from 'bcryptjs';

// bcrypt hash/compare helpers (AC-11). Plaintext passwords are never stored,
// compared by hand, or logged — only these two functions touch them.

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}
