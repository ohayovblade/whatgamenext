import createCache, { type EmotionCache } from '@emotion/cache';

// Shared emotion cache. `prepend` keeps MUI's styles first in <head> so other
// styles (e.g. Tailwind on the auth pages) can still win specificity ties.
export default function createEmotionCache(): EmotionCache {
  return createCache({ key: 'mui', prepend: true });
}
