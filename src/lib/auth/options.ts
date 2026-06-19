import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByEmail } from '@/lib/db/users';
import { verifyPassword } from '@/lib/auth/password';
import { isValidPassword } from '@/lib/auth/validation';

// NextAuth Credentials configuration (AC-9, AC-11, AC-17). All auth logic stays
// in src/lib/auth. NEXTAUTH_SECRET is read from env, never hard-coded.

function requireSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set — refusing to start auth.');
  }
  return secret;
}

export const authOptions: NextAuthOptions = {
  secret: requireSecret(),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        // Reject out-of-bounds passwords before bcrypt.compare — an over-72-byte
        // input would be truncated and could match a colliding stored hash.
        if (!isValidPassword(password)) return null;

        const user = await findUserByEmail(email);
        // AC-10: return null for both "no such user" and "wrong password" so the
        // client only ever sees one generic error.
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // Only non-secret fields go into the token/session (AC-2).
        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    // Persist the user id onto the JWT, then expose it on the session so
    // getServerSession can read it (AC-14).
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      return session;
    },
  },
};
