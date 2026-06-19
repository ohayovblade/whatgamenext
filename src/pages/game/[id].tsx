import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { Container, Stack, Typography, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getSessionUserId } from '@/lib/auth/session';
import LogoutButton from '@/components/logout-button';

interface GamePageProps {
  gameId: string;
}

// AC-16: protected page — redirect unauthenticated visitors to /login.
export const getServerSideProps: GetServerSideProps<GamePageProps> = async (
  ctx,
) => {
  const userId = await getSessionUserId(ctx);
  if (!userId) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const gameId = typeof ctx.params?.id === 'string' ? ctx.params.id : '';
  return { props: { gameId } };
};

export default function GamePage({ gameId }: GamePageProps) {
  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Game #{gameId}
        </Typography>
        <LogoutButton />
      </Stack>

      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography color="text.secondary">
          Game detail / status / notes would render here.
        </Typography>
        <Button
          component={NextLink}
          href="/dashboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 3 }}
        >
          Back to backlog
        </Button>
      </Paper>
    </Container>
  );
}
