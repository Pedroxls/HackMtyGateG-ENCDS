import { Outlet, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Stack,
  Avatar,
  Divider
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import Sidebar from '../components/sidebar.jsx'
import Topbar from '../components/topbar.jsx'
import { useAuth } from '../context/authContext.jsx'

const drawerWidth = 280

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', to: '/dashboard', icon: <DashboardRoundedIcon /> },
      { label: 'Reportes', to: '/reports', icon: <AssessmentRoundedIcon /> },
      { label: 'Predicción', to: '/forecast', icon: <TimelineRoundedIcon /> },
      { label: 'Productos', to: '/products', icon: <Inventory2RoundedIcon /> },
      { label: 'Empleados', to: '/employees', icon: <GroupsRoundedIcon /> },
      { label: 'Ajustes', to: '/settings', icon: <SettingsRoundedIcon /> }
    ],
    []
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', width: '100%' }}>
      <CssBaseline />

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            padding: 3,
            borderRadius: 0,
            borderRight: '1px solid rgba(15, 23, 42, 0.08)',
            background: 'linear-gradient(180deg, #111827 0%, #1f2937 100%)',
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }
        }}
        open
      >
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.85) 0%, rgba(14,165,233,0.75) 100%)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '0.06em'
              }}
            >
              GI
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700 }}>
                Gate Intelligence
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(226,232,240,0.65)' }}>
                Control Center
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 1.5, py: 1.25, borderRadius: 2, backgroundColor: 'rgba(15,23,42,0.45)' }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background:
                  'linear-gradient(135deg, rgba(96,165,250,0.6) 0%, rgba(59,130,246,0.8) 100%)'
              }}
            >
              {(user?.name || user?.email || 'U').substring(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                {user?.name || user?.email || 'Operador'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(226,232,240,0.6)' }}>
                Gestión y análisis
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Sidebar items={navItems} />

        <Box sx={{ flexGrow: 1 }} />

        <Divider sx={{ borderColor: 'rgba(226,232,240,0.08)' }} />
        <Typography variant="caption" sx={{ color: 'rgba(226,232,240,0.6)' }}>
          © {new Date().getFullYear()} Gate Intelligence · Optimización de Supply Chain
        </Typography>
      </Drawer>

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          left: `${drawerWidth}px`,
          background: 'rgba(255,255,255,0.85)',
          color: 'text.primary',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(15,23,42,0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Topbar title={getTitleFromPath(pathname)} />
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '104px',
          pb: 6,
          px: { xs: 4, md: 6, lg: 8 },
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

function getTitleFromPath(path) {
  if (path.startsWith('/forecast')) return 'Predicción de Demanda'
  if (path.startsWith('/reports')) return 'Reportes Ejecutivos'
  if (path.startsWith('/settings')) return 'Configuración'
  if (path.startsWith('/products')) return 'Catálogo de Productos'
  if (path.startsWith('/employees')) return 'Talento & Equipo'
  return 'Visión General'
}
