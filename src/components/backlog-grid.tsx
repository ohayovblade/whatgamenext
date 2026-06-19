import { Box, Paper, Avatar, Typography } from '@mui/material';
import type { BacklogEntry, BacklogPatch } from '@/lib/db/backlog';
import GameCard from '@/components/game-card';

// RAWG-style responsive card grid of the user's backlog.
interface Props {
  entries: BacklogEntry[];
  onPatch: (id: number, patch: BacklogPatch) => void;
  onDelete: (id: number) => void;
}

export default function BacklogGrid({ entries, onPatch, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <Paper
        data-testid="empty-backlog"
        variant="outlined"
        sx={{ borderStyle: 'dashed', py: 10, textAlign: 'center' }}
      >
        <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'rgba(88,101,242,0.2)' }}>🎮</Avatar>
        <Typography fontWeight={600}>No games here</Typography>
        <Typography variant="body2" color="text.secondary">
          Use the search bar above to find and add games.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      data-testid="backlog-grid"
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      }}
    >
      {entries.map((entry) => (
        <GameCard key={entry.id} entry={entry} onPatch={onPatch} onDelete={onDelete} />
      ))}
    </Box>
  );
}
