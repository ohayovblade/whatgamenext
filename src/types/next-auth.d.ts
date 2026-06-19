import type { DefaultSession } from 'next-auth';

// Augment NextAuth's Session/JWT so `session.user.id` is typed everywhere.
// AC-14: the user id is read from the session, never from the client.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
