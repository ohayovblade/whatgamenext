import {
  Box,
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import type { BacklogEntry } from '@/lib/db/backlog';
import { BACKLOG_STATUSES } from '@/lib/backlog/statuses';

// "All" plus each status — the left-nav filters (RAWG-style category list).
export type BacklogFilter = 'All' | (typeof BACKLOG_STATUSES)[number];
const FILTERS: BacklogFilter[] = ['All', ...BACKLOG_STATUSES];

interface Props {
  entries: BacklogEntry[];
  filter: BacklogFilter;
  onFilter: (f: BacklogFilter) => void;
}

function countFor(entries: BacklogEntry[], f: BacklogFilter): number {
  return f === 'All' ? entries.length : entries.filter((e) => e.status === f).length;
}

export default function DashboardSidebar({ entries, filter, onFilter }: Props) {
  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: '#111214',
        borderRight: 1,
        borderColor: 'divider',
        p: 2,
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4, px: 1, minWidth: 0 }}>
        <SportsEsportsIcon color="primary" sx={{ flexShrink: 0 }} />
        <Typography
          noWrap
          fontWeight={800}
          sx={{ fontSize: '1.05rem', letterSpacing: 0.3, minWidth: 0 }}
        >
          WhatGameNext
        </Typography>
      </Stack>

      <Typography
        variant="overline"
        sx={{ px: 1, display: 'block', color: 'text.secondary', fontWeight: 700 }}
      >
        Library
      </Typography>
      <List disablePadding>
        {FILTERS.map((f) => (
          <ListItemButton
            key={f}
            selected={filter === f}
            onClick={() => onFilter(f)}
            data-testid={`filter-${f}`}
            sx={{ borderRadius: 1, mb: 0.25 }}
          >
            <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>{f}</ListItemText>
            <Typography variant="caption" color="text.secondary">
              {countFor(entries, f)}
            </Typography>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
