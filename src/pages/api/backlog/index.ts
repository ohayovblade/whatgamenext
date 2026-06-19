import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUserId } from '@/lib/auth/session';
import {
  listBacklogForUser,
  createBacklogEntry,
  type BacklogEntry,
} from '@/lib/db/backlog';
import { isBacklogStatus } from '@/lib/backlog/statuses';

// /api/backlog
//   GET  — list the authenticated user's backlog
//   POST — add a game to it ({ gameId, title, cover?, status? })
// Protection invariant: reject before any DB access (AC-15), scope by the
// session user id (AC-14), never a client-supplied id.

type Response = BacklogEntry[] | BacklogEntry | { error: string };

interface CreateBody {
  gameId?: unknown;
  title?: unknown;
  cover?: unknown;
  status?: unknown;
}

// Postgres unique-violation — the per-user UNIQUE(userId, gameId) guard.
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
): Promise<void> {
  // 401 BEFORE touching the database.
  const userId = await getSessionUserId({ req, res });
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json(await listBacklogForUser(Number(userId)));
    return;
  }

  if (req.method === 'POST') {
    const { gameId, title, cover, status } = req.body as CreateBody;

    if (typeof gameId !== 'number' || !Number.isInteger(gameId)) {
      res.status(400).json({ error: 'A numeric gameId is required.' });
      return;
    }
    if (typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'A title is required.' });
      return;
    }
    if (status !== undefined && !isBacklogStatus(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }

    try {
      const entry = await createBacklogEntry(Number(userId), {
        gameId,
        title: title.trim(),
        cover: typeof cover === 'string' ? cover : null,
        status: isBacklogStatus(status) ? status : undefined,
      });
      res.status(201).json(entry);
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: 'That game is already in your backlog.' });
        return;
      }
      throw err;
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed' });
}
