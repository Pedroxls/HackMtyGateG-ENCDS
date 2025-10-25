// src/components/Sidebar.jsx
// Sidebar: lista simple de navegación con íconos y estado "activo".

import { useLocation, Link as RouterLink } from 'react-router-dom'
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'

export default function Sidebar({ items = [] }) {
  const { pathname } = useLocation()

  return (
    <List sx={{ py: 1 }}>
      {items.map((item) => {
        const selected = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))
        return (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={selected}
            sx={{
              borderRadius: 1,
              mx: 1,
              my: 0.25,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        )
      })}
    </List>
  )
}
