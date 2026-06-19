import { createTheme } from '@mui/material/styles';

// Dark theme tuned to the Discord palette so MUI components match the app's look.
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#5865f2' }, // blurple
    success: { main: '#248046' },
    error: { main: '#da373c' },
    background: { default: '#1e1f22', paper: '#2b2d31' },
    text: { primary: '#dbdee1', secondary: '#949ba4' },
    divider: 'rgba(0,0,0,0.3)',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});

export default theme;
