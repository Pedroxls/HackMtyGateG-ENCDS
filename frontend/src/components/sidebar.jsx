import { useLocation, Link as RouterLink } from 'react-router-dom'
import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

export default function Sidebar({ items = [] }) {
  const { pathname } = useLocation()

  return (
    <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1 }}>
      {items.map((item) => {
        const selected =
          pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))

        return (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={selected}
            sx={{
              color: selected ? '#fff' : alpha('#e2e8f0', 0.85),
              transition: 'transform 220ms ease, background 220ms ease',
              '&:hover': {
                transform: 'translateX(4px)',
                backgroundColor: alpha('#fff', 0.04)
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 42,
                color: selected ? '#fff' : alpha('#e2e8f0', 0.85)
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: selected ? 600 : 500 }}>
                  {item.label}
                </Typography>
              }
            />
          </ListItemButton>
        )
      })}
    </List>
  )
}
