// src/layouts/DashboardLayout.jsx
// Layout principal: Sidebar (Drawer) + Topbar (AppBar) + Contenido (Outlet)

import { Outlet, useLocation, Link as RouterLink } from 'react-router-dom'
import { useMemo } from 'react'
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import Sidebar from '../components/sidebar.jsx'
import Topbar from '../components/topbar.jsx'

const drawerWidth = 240

export default function DashboardLayout() {
  const { pathname } = useLocation()

  // Menú lateral (puedes ampliarlo después)
  const navItems = useMemo(
    () => [
      { label: 'Dashboard', to: '/dashboard', icon: <DashboardRoundedIcon /> },
      { label: 'Reportes', to: '/reports', icon: <AssessmentRoundedIcon /> },
      { label: 'Predicción', to: '/forecast', icon: <TimelineRoundedIcon /> },
      { label: 'Ajustes', to: '/settings', icon: <SettingsRoundedIcon /> },
    ],
    []
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f6f7fb' }}>
      <CssBaseline />

      {/* Topbar fija */}
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, bgcolor: '#fff', color: '#111', boxShadow: 'none', borderBottom: '1px solid #e5e7eb' }}
      >
        <Topbar title={getTitleFromPath(pathname)} />
      </AppBar>

      {/* Sidebar fija a la izquierda */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid #e5e7eb' },
        }}
        open
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: 1 }}>
            SMART INTELLIGENCE
          </Typography>
        </Toolbar>
        <Divider />
        {/* Sidebar reutilizable (lista de navegación) */}
        <Sidebar items={navItems} />
      </Drawer>

      {/* Contenido: deja espacio para AppBar (Toolbar) */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
        <Toolbar /> {/* empuja el contenido debajo del Topbar */}
        <Outlet />
      </Box>
    </Box>
  )
}

// Utilidad pequeña para mostrar el título en el Topbar según la ruta
function getTitleFromPath(path) {
  if (path.startsWith('/forecast')) return 'Predicción'
  if (path.startsWith('/reports')) return 'Reportes'
  if (path.startsWith('/settings')) return 'Ajustes'
  return 'Dashboard'
}
