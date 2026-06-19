import type { GetServerSideProps } from 'next';
import { getSessionUserId } from '@/lib/auth/session';

// `/` is a router, not a page: logged-in users go to their dashboard, everyone
// else lands on /login. (Replaces the old landing page with the sign-up/log-in
// buttons.) The redirect happens server-side so visitors never see a flash.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const userId = await getSessionUserId(ctx);
  return {
    redirect: {
      destination: userId ? '/dashboard' : '/login',
      permanent: false,
    },
  };
};

export default function Index() {
  return null;
}
