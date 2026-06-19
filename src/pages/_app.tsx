import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { CacheProvider, type EmotionCache } from '@emotion/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import createEmotionCache from '@/lib/mui/create-emotion-cache';
import theme from '@/lib/mui/theme';
import '@/styles/globals.css';

const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

// SessionProvider exposes useSession(); CacheProvider + ThemeProvider wire up MUI
// with the dark theme. CssBaseline applies the themed background + sensible resets.
export default function App({
  Component,
  emotionCache = clientSideEmotionCache,
  pageProps: { session, ...pageProps },
}: MyAppProps) {
  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
