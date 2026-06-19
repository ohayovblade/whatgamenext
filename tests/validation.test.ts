import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_BYTES,
} from '@/lib/auth/validation';

describe('isValidEmail', () => {
  it('accepts a well-formed email', () => {
    expect(isValidEmail('rian@example.com')).toBe(true);
  });

  it('trims surrounding whitespace before checking', () => {
    expect(isValidEmail('  rian@example.com  ')).toBe(true);
  });

  it('rejects an email with no @', () => {
    expect(isValidEmail('rian.example.com')).toBe(false);
  });

  it('rejects a domain with no dot', () => {
    expect(isValidEmail('rian@example')).toBe(false);
  });

  it('rejects internal spaces', () => {
    expect(isValidEmail('ri an@example.com')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts a password at exactly the minimum length', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBe(true);
  });

  it('rejects a password one char below the minimum', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidPassword(12345678)).toBe(false);
    expect(isValidPassword(null)).toBe(false);
  });

  // bcrypt truncates input at 72 bytes — reject longer so two passwords sharing
  // a 72-byte prefix can't collide to the same hash (auth-bypass guard).
  it('accepts a password at exactly the 72-byte maximum', () => {
    expect(isValidPassword('a'.repeat(MAX_PASSWORD_BYTES))).toBe(true);
  });

  it('rejects a password one byte over the 72-byte maximum', () => {
    expect(isValidPassword('a'.repeat(MAX_PASSWORD_BYTES + 1))).toBe(false);
  });

  it('measures the limit in bytes, not characters (multi-byte aware)', () => {
    // '€' is 3 UTF-8 bytes; 25 of them = 75 bytes > 72, though only 25 chars.
    expect(isValidPassword('€'.repeat(25))).toBe(false);
  });
});
