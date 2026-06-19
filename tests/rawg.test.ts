import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  toGame,
  mapRawgResults,
  searchGames,
  type RawgResultRow,
} from '@/lib/rawg';

const fullRow: RawgResultRow = {
  id: 1,
  name: 'Bloodborne',
  released: '2015-03-24',
  background_image: 'https://media.rawg.io/bb.jpg',
  genres: [{ name: 'Action RPG' }, { name: 'Adventure' }],
};

describe('toGame', () => {
  it('maps a full row to the client-safe shape', () => {
    expect(toGame(fullRow)).toEqual({
      id: 1,
      title: 'Bloodborne',
      year: 2015,
      genre: 'Action RPG',
      imageUrl: 'https://media.rawg.io/bb.jpg',
    });
  });

  it('parses the year from the leading 4 chars of released', () => {
    expect(toGame({ ...fullRow, released: '1998-11-20' }).year).toBe(1998);
  });

  it('returns null year when released is null', () => {
    expect(toGame({ ...fullRow, released: null }).year).toBeNull();
  });

  it('falls back to "Unknown" when genres is missing', () => {
    expect(toGame({ ...fullRow, genres: undefined }).genre).toBe('Unknown');
  });

  it('falls back to "Unknown" when genres is empty', () => {
    expect(toGame({ ...fullRow, genres: [] }).genre).toBe('Unknown');
  });

  it('keeps a null background_image as null imageUrl', () => {
    expect(toGame({ ...fullRow, background_image: null }).imageUrl).toBeNull();
  });
});

describe('mapRawgResults', () => {
  it('maps every result row', () => {
    const out = mapRawgResults({ results: [fullRow, { ...fullRow, id: 2 }] });
    expect(out.map((g) => g.id)).toEqual([1, 2]);
  });

  it('returns [] when results is absent', () => {
    expect(mapRawgResults({})).toEqual([]);
  });
});

describe('searchGames', () => {
  beforeEach(() => {
    process.env.RAWG_API_KEY = 'test-key';
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.RAWG_API_KEY;
  });

  it('throws when the API key is missing', async () => {
    delete process.env.RAWG_API_KEY;
    await expect(searchGames('zelda')).rejects.toThrow('RAWG_API_KEY is not set');
  });

  it('returns [] for an empty/whitespace query without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await searchGames('   ')).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('builds the correct URL (search encoded, page_size=20)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), { status: 200 }),
      );
    await searchGames('mario kart');
    const calledUrl = String(fetchSpy.mock.calls[0][0]);
    expect(calledUrl).toContain('key=test-key');
    expect(calledUrl).toContain('search=mario%20kart');
    expect(calledUrl).toContain('page_size=20');
  });

  it('maps results on a successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ results: [fullRow] }), { status: 200 }),
    );
    const games = await searchGames('bloodborne');
    expect(games).toHaveLength(1);
    expect(games[0].title).toBe('Bloodborne');
  });

  it('throws with the status when RAWG responds non-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('nope', { status: 503 }),
    );
    await expect(searchGames('zelda')).rejects.toThrow('RAWG request failed: 503');
  });
});
