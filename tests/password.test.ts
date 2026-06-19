import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('password hashing (AC-11)', () => {
  it('hashes to a bcrypt string, not the plaintext', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).not.toBe('correct horse');
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
  });

  it('verifies a matching password', async () => {
    const hash = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse');
    expect(await verifyPassword('wrong horse', hash)).toBe(false);
  });

  // Documents bcrypt's 72-byte truncation — the root cause that MAX_PASSWORD_BYTES
  // (in validation.ts) guards against: two distinct passwords sharing a 72-byte
  // prefix verify against the SAME hash. This is why length is capped before hashing.
  it('treats inputs sharing a 72-byte prefix as identical (truncation, hence the cap)', async () => {
    const prefix72 = 'A'.repeat(72);
    const hash = await hashPassword(prefix72);
    expect(await verifyPassword(prefix72 + 'DIFFERENT_TAIL', hash)).toBe(true);
  });
});
