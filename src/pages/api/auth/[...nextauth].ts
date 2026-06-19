import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/options';

// NextAuth handler (AC-17). Config lives in src/lib/auth/options.ts.
export default NextAuth(authOptions);
