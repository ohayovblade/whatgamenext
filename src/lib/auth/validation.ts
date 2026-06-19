// Shared input validation for the auth boundary (AC-4, AC-5). Kept tiny and
// dependency-free — validate at the API route before any DB write.

export const MIN_PASSWORD_LENGTH = 8;

// bcrypt only hashes the first 72 BYTES of input and silently drops the rest.
// Without an upper bound, two passwords sharing a 72-byte prefix collide to the
// same hash and authenticate interchangeably (credential-collision auth bypass).
// Enforce the limit at the boundary so input is never silently truncated.
export const MAX_PASSWORD_BYTES = 72;

// Pragmatic email check: one @, a dot in the domain, no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

export function isValidPassword(password: unknown): password is string {
  if (typeof password !== 'string') return false;
  if (password.length < MIN_PASSWORD_LENGTH) return false;
  // Use byte length — bcrypt's 72 limit is bytes, not characters.
  return Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_BYTES;
}
