import { useState } from 'react'
import {
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Button,
  Chip,
  alpha
} from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import { useAuth } from '../context/authContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ title = 'Dashboard' }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const open = Boolean(anchorEl)
  const handleOpen = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleLogout = () => {
    handleClose()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Toolbar
      disableGutters
      sx={{
        px: { xs: 3, md: 5 },
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 3
      }}
    >
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: 'text.secondary',
            letterSpacing: '0.12em'
          }}
        >
          Panel Ejecutivo
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          <Chip
            label="Actualizado hace 2 min"
            size="small"
            sx={{
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              fontWeight: 600
            }}
          />
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton size="small" aria-label="notificaciones">
          <NotificationsNoneRoundedIcon />
        </IconButton>
        <IconButton size="small" aria-label="ayuda">
          <HelpOutlineRoundedIcon />
        </IconButton>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          sx={{ borderRadius: 14 }}
          onClick={() => navigate('/reports')}
        >
          Generar reporte
        </Button>
        <IconButton size="small" aria-label="perfil" onClick={handleOpen}>
          <AccountCircleIcon />
        </IconButton>
      </Stack>

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
    </Toolbar>
  )
}
