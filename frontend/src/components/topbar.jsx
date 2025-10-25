// src/components/Topbar.jsx
// Topbar con solo el botón de usuario -> menú "Cerrar sesión".

import { Toolbar, Typography, Box, IconButton, Menu, MenuItem } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useState } from 'react';
import { useAuth } from '../context/authContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title = 'Dashboard' }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const open = Boolean(anchorEl);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
        {title}
      </Typography>

      <Box>
        <IconButton size="small" aria-label="perfil" onClick={handleOpen}>
          <AccountCircleIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled>{user?.name || user?.email || 'Usuario'}</MenuItem>
          <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
        </Menu>
      </Box>
    </Toolbar>
  );
}
