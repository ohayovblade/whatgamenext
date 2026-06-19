import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser, findUserByEmail } from '@/lib/db/users';
import { hashPassword } from '@/lib/auth/password';
import { isValidEmail, isValidPassword, MAX_PASSWORD_BYTES } from '@/lib/auth/validation';
import { toSafeUser, type SafeUser } from '@/types/user';

// POST /api/auth/register — create a credentials user (AC-3..AC-7, AC-20).

interface RegisterBody {
  email?: unknown;
  password?: unknown;
  name?: unknown;
}

type RegisterResponse = SafeUser | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email, password, name } = req.body as RegisterBody;

  // AC-5: valid email format required.
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'A valid email is required.' });
    return;
  }

  // AC-4: password must be at least 8 characters, and at most 72 bytes so bcrypt
  // never silently truncates it (see validation.ts — credential-collision bypass).
  if (!isValidPassword(password)) {
    const tooLong =
      typeof password === 'string' &&
      Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES;
    res.status(400).json({
      error: tooLong
        ? 'Password must be at most 72 bytes.'
        : 'Password must be at least 8 characters.',
    });
    return;
  }

  const displayName =
    typeof name === 'string' && name.trim() !== '' ? name.trim() : null;

  // AC-6: reject duplicate email before attempting the insert.
  if (await findUserByEmail(email)) {
    res.status(409).json({ error: 'An account with that email already exists.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, name: displayName });

  // AC-7 / AC-2: return 201 with the SAFE user shape only — never the hash.
  res.status(201).json(toSafeUser(user));
}
