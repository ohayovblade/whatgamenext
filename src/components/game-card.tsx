import { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Box,
  Typography,
  Select,
  MenuItem,
  IconButton,
  Popover,
  TextField,
  Stack,
  Tooltip,
  type SelectChangeEvent,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { BacklogEntry, BacklogPatch } from '@/lib/db/backlog';
import { BACKLOG_STATUSES, type BacklogStatus } from '@/lib/backlog/statuses';

function statusColor(status: string): string {
  if (status === 'Playing') return '#5865f2';
  if (status === 'Completed') return '#248046';
  if (status === 'Dropped') return '#80848e';
  return '#4e5058'; // Not Started
}

function dayspan(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 86_400_000) + 1;
}

interface Props {
  entry: BacklogEntry;
  onPatch: (id: number, patch: BacklogPatch) => void;
  onDelete: (id: number) => void;
}

export default function GameCard({ entry, onPatch, onDelete }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const span = dayspan(entry.startDate, entry.endDate);
  const hasDates = Boolean(entry.startDate || entry.endDate);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform .15s, box-shadow .15s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
      }}
    >
      {entry.cover ? (
        <CardMedia image={entry.cover} sx={{ height: 150 }} />
      ) : (
        <Box
          sx={{
            height: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(135deg,#5865f2,#404eed)',
          }}
        >
          {entry.title.charAt(0)}
        </Box>
      )}

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography
          fontWeight={700}
          title={entry.title}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 48,
            lineHeight: 1.2,
          }}
        >
          {entry.title}
        </Typography>

        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Select
            size="small"
            data-testid={`status-${entry.id}`}
            value={entry.status}
            onChange={(e: SelectChangeEvent) =>
              onPatch(entry.id, { status: e.target.value as BacklogStatus })
            }
            sx={{
              flex: 1,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              bgcolor: statusColor(entry.status),
              '& .MuiOutlinedInput-notchedOutline': { border: 0 },
              '& .MuiSvgIcon-root': { color: '#fff' },
            }}
          >
            {BACKLOG_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>

          <Tooltip title="Play timeline">
            <IconButton
              size="small"
              data-testid={`timeline-${entry.id}`}
              color={hasDates ? 'primary' : 'default'}
              onClick={(e) => setAnchor(e.currentTarget)}
            >
              <CalendarMonthIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Remove">
            <IconButton
              size="small"
              color="error"
              data-testid={`delete-${entry.id}`}
              aria-label={`Remove ${entry.title}`}
              onClick={() => onDelete(entry.id)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack spacing={2} sx={{ p: 2, width: 220 }}>
          <Typography variant="subtitle2">Play timeline</Typography>
          <TextField
            type="date"
            size="small"
            label="Started"
            InputLabelProps={{ shrink: true }}
            value={entry.startDate ?? ''}
            inputProps={{ max: entry.endDate ?? undefined, 'data-testid': `start-${entry.id}` }}
            onChange={(e) => onPatch(entry.id, { startDate: e.target.value || null })}
          />
          <TextField
            type="date"
            size="small"
            label="Finished"
            InputLabelProps={{ shrink: true }}
            value={entry.endDate ?? ''}
            inputProps={{ min: entry.startDate ?? undefined, 'data-testid': `end-${entry.id}` }}
            onChange={(e) => onPatch(entry.id, { endDate: e.target.value || null })}
          />
          {span !== null && (
            <Typography variant="body2" color="primary">
              {span} {span === 1 ? 'day' : 'days'} of play
            </Typography>
          )}
        </Stack>
      </Popover>
    </Card>
  );
}
