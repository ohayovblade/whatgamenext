import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUserId } from '@/lib/auth/session';
import {
  updateBacklogEntry,
  deleteBacklogEntry,
  type BacklogEntry,
  type BacklogPatch,
} from '@/lib/db/backlog';
import { isBacklogStatus } from '@/lib/backlog/statuses';

// Accept null (clear the date) or a plain calendar date string "YYYY-MM-DD".
function isDateOrNull(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v));
}

// /api/backlog/[id]
//   PATCH  — update an entry's status ({ status })
//   DELETE — remove an entry
// Every query is scoped by the session userId, so a user can only touch their
// own rows (404 otherwise — never reveal another user's entry exists).

type Response = BacklogEntry | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
): Promise<void> {
  const userId = await getSessionUserId({ req, res });
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id.' });
    return;
  }

  if (req.method === 'PATCH') {
    const body = req.body as {
      status?: unknown;
      startDate?: unknown;
      endDate?: unknown;
    };
    const patch: BacklogPatch = {};

    if ('status' in body) {
      if (!isBacklogStatus(body.status)) {
        res.status(400).json({ error: 'Invalid status.' });
        return;
      }
      patch.status = body.status;
    }
    if ('startDate' in body) {
      if (!isDateOrNull(body.startDate)) {
        res.status(400).json({ error: 'Invalid startDate.' });
        return;
      }
      patch.startDate = body.startDate;
    }
    if ('endDate' in body) {
      if (!isDateOrNull(body.endDate)) {
        res.status(400).json({ error: 'Invalid endDate.' });
        return;
      }
      patch.endDate = body.endDate;
    }
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    const entry = await updateBacklogEntry(Number(userId), id, patch);
    if (!entry) {
      res.status(404).json({ error: 'Not found.' });
      return;
    }
    res.status(200).json(entry);
    return;
  }

  if (req.method === 'DELETE') {
    const ok = await deleteBacklogEntry(Number(userId), id);
    if (!ok) {
      res.status(404).json({ error: 'Not found.' });
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  res.status(405).json({ error: 'Method not allowed' });
}
