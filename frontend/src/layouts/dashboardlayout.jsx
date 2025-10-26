// src/layouts/DashboardLayout.jsx
// Layout principal: Sidebar (Drawer) + Topbar (AppBar) + Contenido (Outlet)

import { Outlet, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Divider,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import FlightTakeoffRoundedIcon from '@mui/icons-material/FlightTakeoffRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import Sidebar from '../components/sidebar.jsx'
import Topbar from '../components/topbar.jsx'

const drawerWidth = 240

export default function DashboardLayout() {
  const { pathname } = useLocation()

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', to: '/dashboard', icon: <DashboardRoundedIcon /> },
      { label: 'Reportes', to: '/reports', icon: <AssessmentRoundedIcon /> },
      { label: 'Predicción', to: '/forecast', icon: <TimelineRoundedIcon /> },
      { label: 'Productos', to: '/products', icon: <Inventory2RoundedIcon /> },
      { label: 'Vuelos', to: '/flights', icon: <FlightTakeoffRoundedIcon /> },
      { label: 'Empleados', to: '/employees', icon: <GroupsRoundedIcon /> },
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
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: '#fff',
          color: '#111',
          boxShadow: 'none',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <Topbar title={getTitleFromPath(pathname)} />
      </AppBar>

      {/* Sidebar fija a la izquierda */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e5e7eb'
          },
        }}
        open
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: 1 }}>
            SMART INTELLIGENCE
          </Typography>
        </Toolbar>
        <Divider />
        <Sidebar items={navItems} />
      </Drawer>

      {/* Contenido: deja espacio para AppBar (Toolbar) */}
      <Box component="main" sx={{ flexGrow: 1, ml: `${drawerWidth}px`, py: 4 }}>
        <Toolbar />
        <Box sx={{ maxWidth: '1200px', px: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

// Utilidad pequeña para mostrar el título en el Topbar según la ruta
function getTitleFromPath(path) {
  if (path.startsWith('/forecast')) return 'Predicción'
  if (path.startsWith('/reports')) return 'Reportes'
  if (path.startsWith('/settings')) return 'Ajustes'
  if (path.startsWith('/products')) return 'Productos'
  if (path.startsWith('/flights')) return 'Vuelos'
  if (path.startsWith('/employees')) return 'Empleados'
  return 'Dashboard'
}
