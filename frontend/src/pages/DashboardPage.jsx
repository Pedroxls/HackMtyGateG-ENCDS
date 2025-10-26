// src/pages/DashboardPage.jsx
import MapChart from '../components/MapChart'
import { Box, Typography } from '@mui/material'

export default function DashboardPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>

      {/* Estadísticas existentes */}
      {/* ... */}

      <Typography variant="h6" sx={{ mt: 4 }}>
        Mapa Global de Tendencias de Consumo
      </Typography>
      <MapChart />
    </Box>
  )
}

