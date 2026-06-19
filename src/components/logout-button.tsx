import { signOut } from 'next-auth/react';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

// AC-18: visible control that clears the session and redirects to /login.
export default function LogoutButton() {
  return (
    <Button
      size="small"
      color="inherit"
      variant="outlined"
      data-testid="logout-button"
      startIcon={<LogoutIcon />}
      onClick={() => signOut({ callbackUrl: '/login' })}
      sx={{ borderColor: 'rgba(255,255,255,0.25)' }}
    >
      Log out
    </Button>
  );
}
