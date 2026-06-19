import { useMemo, useState } from 'react';
import type { GetServerSideProps } from 'next';
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from '@mui/material';
import { getSessionUserId } from '@/lib/auth/session';
import {
  listBacklogForUser,
  type BacklogEntry,
  type BacklogPatch,
} from '@/lib/db/backlog';
import { findUserById } from '@/lib/db/users';
import UserMenu from '@/components/user-menu';
import GameSearchBar from '@/components/game-search-bar';
import BacklogGrid from '@/components/backlog-grid';
import DashboardSidebar, { type BacklogFilter } from '@/components/dashboard-sidebar';

interface DashboardProps {
  displayName: string;
  backlog: BacklogEntry[];
}

type SortKey = 'recent' | 'title' | 'status';

// A little personality under the page title, per active filter.
const QUIPS: Record<BacklogFilter, string> = {
  All: 'the whole pile of shame',
  'Not Started': 'someday… probably',
  Playing: 'good luck with these',
  Completed: 'look at you go',
  Dropped: "we don't talk about these",
};

// AC-16: unauthenticated visitors are redirected to /login before render.
export const getServerSideProps: GetServerSideProps<DashboardProps> = async (
  ctx,
) => {
  const userId = await getSessionUserId(ctx);
  if (!userId) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const user = await findUserById(Number(userId));
  // Prefer the chosen name; fall back to the email local-part if name is null.
  const displayName = user?.name?.trim() || user?.email.split('@')[0] || 'there';

  return {
    props: { displayName, backlog: await listBacklogForUser(Number(userId)) },
  };
};

export default function Dashboard({ displayName, backlog }: DashboardProps) {
  const [filter, setFilter] = useState<BacklogFilter>('All');
  const [sort, setSort] = useState<SortKey>('recent');
  // SSR provides the initial list; CRUD mutates it client-side from here on.
  const [entries, setEntries] = useState<BacklogEntry[]>(backlog);

  const existingGameIds = useMemo(
    () => new Set(entries.map((e) => e.gameId)),
    [entries],
  );

  // Apply the sidebar status filter, then the "Order by" sort.
  const visible = useMemo(() => {
    const filtered =
      filter === 'All' ? entries : entries.filter((e) => e.status === filter);
    const sorted = [...filtered];
    if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'status') sorted.sort((a, b) => a.status.localeCompare(b.status));
    // 'recent' keeps the DB order (createdAt desc).
    return sorted;
  }, [entries, filter, sort]);

  function handleAdded(entry: BacklogEntry) {
    setEntries((prev) => [entry, ...prev]);
  }

  async function handlePatch(id: number, patch: BacklogPatch) {
    const prev = entries; // optimistic; revert on failure
    setEntries((cur) => cur.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const res = await fetch(`/api/backlog/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) return;
    // Row is gone for this user — drop it instead of showing a stale card.
    if (res.status === 404) setEntries((cur) => cur.filter((e) => e.id !== id));
    else setEntries(prev); // real failure — revert
  }

  async function handleDelete(id: number) {
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.id !== id));
    const res = await fetch(`/api/backlog/${id}`, { method: 'DELETE' });
    // 204 = deleted, 404 = already gone for this user — both mean "stay removed".
    // Only revert on real failures (network / 5xx).
    if (!res.ok && res.status !== 404) setEntries(prev);
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardSidebar entries={entries} filter={filter} onFilter={setFilter} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Top bar: RAWG-style search that opens the add-game modal */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ px: { xs: 2, md: 4 }, py: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <GameSearchBar onAdded={handleAdded} existingGameIds={existingGameIds} />
          <Box sx={{ flex: 1 }} />
          <UserMenu displayName={displayName} />
        </Stack>

        <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={2}
            sx={{ mb: 4 }}
          >
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: -1 }}>
                {filter === 'All' ? 'Your library' : filter}
              </Typography>
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {QUIPS[filter]}
              </Typography>
            </Box>

            <Select
              size="small"
              value={sort}
              onChange={(e: SelectChangeEvent) => setSort(e.target.value as SortKey)}
              sx={{ bgcolor: '#2b2d31', '& .MuiOutlinedInput-notchedOutline': { border: 0 } }}
            >
              <MenuItem value="recent">Order by: Recently added</MenuItem>
              <MenuItem value="title">Order by: Title</MenuItem>
              <MenuItem value="status">Order by: Status</MenuItem>
            </Select>
          </Stack>

          <BacklogGrid entries={visible} onPatch={handlePatch} onDelete={handleDelete} />
        </Box>
      </Box>

      {/* Standout games count — floating bottom-right */}
      <Box
        data-testid="game-count"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          px: 2.5,
          py: 1.25,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: '#fff',
          textAlign: 'center',
          minWidth: 92,
          boxShadow: 6,
          zIndex: (t) => t.zIndex.fab,
        }}
      >
        <Typography variant="h5" fontWeight={800} lineHeight={1}>
          {visible.length}
        </Typography>
        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {visible.length === 1 ? 'game' : 'games'}
        </Typography>
      </Box>
    </Box>
  );
}
