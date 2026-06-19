import { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  Avatar,
  Box,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { RawgGame } from '@/lib/rawg';
import type { BacklogEntry } from '@/lib/db/backlog';

// Inline search-as-you-type: types into the bar, RAWG results drop down, picking
// one adds it to the backlog (no modal). Debounced ~400ms to respect the quota.

interface Props {
  onAdded: (entry: BacklogEntry) => void;
  existingGameIds: Set<number>;
}

const DEBOUNCE_MS = 400;
const MIN_CHARS = 2;

export default function GameSearchBar({ onAdded, existingGameIds }: Props) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<RawgGame[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0); // guards against out-of-order responses

  useEffect(() => {
    const q = input.trim();
    if (q.length < MIN_CHARS) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { results?: RawgGame[] };
        if (id !== reqId.current) return;
        setOptions(data.results ?? []);
      } catch {
        if (id === reqId.current) setOptions([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  async function addGame(game: RawgGame) {
    const res = await fetch('/api/backlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: game.id, title: game.title, cover: game.imageUrl }),
    });
    if (res.status === 201) onAdded((await res.json()) as BacklogEntry);
    // 409 (already in library) is a no-op.
  }

  return (
    <Autocomplete
      sx={{ flex: 1, maxWidth: 720 }}
      options={options}
      loading={loading}
      value={null}
      blurOnSelect
      clearOnBlur
      filterOptions={(x) => x} // results are server-filtered; don't re-filter locally
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.title)}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      getOptionDisabled={(o) => existingGameIds.has(o.id)}
      onChange={(_, val) => {
        if (val && typeof val !== 'string') {
          addGame(val);
          setInput('');
        }
      }}
      noOptionsText={
        input.trim().length < MIN_CHARS ? 'Type to search games…' : 'No games found'
      }
      renderOption={(props, game) => (
        <Box component="li" {...props} key={game.id} sx={{ gap: 1.5 }}>
          <Avatar variant="rounded" src={game.imageUrl ?? undefined} sx={{ width: 36, height: 36 }}>
            {game.title.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap>{game.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {game.year ?? '—'} · {game.genre}
              {existingGameIds.has(game.id) ? ' · in library' : ''}
            </Typography>
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search games to add…"
          inputProps={{ ...params.inputProps, 'data-testid': 'game-search' }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
            sx: { borderRadius: 2, bgcolor: '#2b2d31' },
          }}
        />
      )}
    />
  );
}
