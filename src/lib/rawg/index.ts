// Single owner of all RAWG API access + the API key (per project conventions).
// Server-only: the key is read from env here and never reaches the browser.
// Components/pages call this through the /api/games/search route, not directly.

const RAWG_BASE = 'https://api.rawg.io/api';

/** Clean, client-safe game shape mapped from a RAWG result row. */
export interface RawgGame {
  id: number;
  title: string;
  year: number | null;
  genre: string;
  imageUrl: string | null;
}

// Shape of the bits of a RAWG /games result row that we actually use.
export interface RawgResultRow {
  id: number;
  name: string;
  released: string | null;
  background_image: string | null;
  genres?: { name: string }[];
}

export interface RawgGamesResponse {
  results?: RawgResultRow[];
}

/** Map one raw RAWG row to our client-safe shape. */
export function toGame(row: RawgResultRow): RawgGame {
  return {
    id: row.id,
    title: row.name,
    // released is an ISO date like "2015-05-18"; take the year without TZ math.
    year: row.released ? Number(row.released.slice(0, 4)) : null,
    genre: row.genres?.[0]?.name ?? 'Unknown',
    imageUrl: row.background_image,
  };
}

/** Map a full RAWG /games response to mapped games (absent results → []). */
export function mapRawgResults(data: RawgGamesResponse): RawgGame[] {
  return (data.results ?? []).map(toGame);
}

/** Build the RAWG /games search URL for a (non-empty) query. */
function buildSearchUrl(key: string, query: string): string {
  return (
    `${RAWG_BASE}/games?key=${key}` +
    `&search=${encodeURIComponent(query)}&page_size=20`
  );
}

/**
 * Search RAWG by title. Returns up to 20 mapped games.
 * Throws if the key is missing or RAWG responds with an error.
 */
export async function searchGames(query: string): Promise<RawgGame[]> {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error('RAWG_API_KEY is not set');

  const q = query.trim();
  if (!q) return [];

  const res = await fetch(buildSearchUrl(key, q));
  if (!res.ok) {
    throw new Error(`RAWG request failed: ${res.status}`);
  }

  const data = (await res.json()) as RawgGamesResponse;
  return mapRawgResults(data);
}
