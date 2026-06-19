import { useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  Avatar,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// Top-right account button: click the avatar/name to reveal the Log out action.
export default function UserMenu({ displayName }: { displayName: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Button
        color="inherit"
        data-testid="user-menu"
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{ textTransform: 'none', gap: 0.5 }}
      >
        <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: 'primary.main', fontSize: 14 }}>
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Typography fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' } }}>
          {displayName}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          data-testid="logout-button"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
