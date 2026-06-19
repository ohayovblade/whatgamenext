import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';

// The single way to read the authenticated user id on the server (AC-14).
// Never trust a client-supplied userId — always go through here.

type ApiCtx = { req: NextApiRequest; res: NextApiResponse };
type Ctx = ApiCtx | GetServerSidePropsContext;

/** Returns the session user id, or null if the request is unauthenticated. */
export async function getSessionUserId(ctx: Ctx): Promise<string | null> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  return session?.user?.id ?? null;
}
