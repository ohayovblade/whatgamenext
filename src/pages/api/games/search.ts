import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUserId } from '@/lib/auth/session';
import { searchGames, type RawgGame } from '@/lib/rawg';

// GET /api/games/search?q=... — proxy game search to RAWG.
// Session-gated (401 before any external call) so anonymous traffic can't burn
// the RAWG quota. The key stays server-side inside @/lib/rawg.

type Response = { results: RawgGame[] } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
): Promise<void> {
  const userId = await getSessionUserId({ req, res });
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (q.trim() === '') {
    res.status(200).json({ results: [] });
    return;
  }

  try {
    res.status(200).json({ results: await searchGames(q) });
  } catch {
    res.status(502).json({ error: 'Game search is unavailable right now.' });
  }
}
