import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import MapChart from '../components/MapChart'

const STAT_CARDS = [
  {
    label: 'Pedidos procesados (24h)',
    value: '1,284',
    delta: '+12%',
    icon: <TrendingUpRoundedIcon />,
    color: '#1d4ed8'
  },
  {
    label: 'Ítems en almacén',
    value: '48,920',
    delta: '+4%',
    icon: <InventoryRoundedIcon />,
    color: '#0ea5e9'
  },
  {
    label: 'Exactitud Picking',
    value: '98.6%',
    delta: '+0.8%',
    icon: <InsightsRoundedIcon />,
    color: '#10b981'
  },
  {
    label: 'Productividad del turno',
    value: '86 pts',
    delta: '+6 pts',
    icon: <GroupsRoundedIcon />,
    color: '#f97316'
  }
]

const PERFORMANCE_INDICATORS = [
  { label: 'Nivel de inventario crítico', progress: 68, caption: 'Objetivo 70%' },
  { label: 'Tiempo medio de picking', progress: 82, caption: 'Objetivo <8 min' },
  { label: 'Órdenes on-time', progress: 93, caption: 'Objetivo 95%' }
]

export default function DashboardPage() {
  return (
    <Stack spacing={4}>
      <Card
        sx={{
          height: 520,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          background: 'linear-gradient(135deg, rgba(29,78,216,0.08) 0%, rgba(14,165,233,0.05) 100%)',
          border: '1px solid rgba(29,78,216,0.12)'
        }}
      >
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tendencias globales de consumo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
                Identifica variaciones de demanda por país y anticipa reabastecimientos críticos
                con indicadores geoespaciales en tiempo real.
              </Typography>
            </Box>
            <Chip label="Tiempo real" color="primary" size="small" />
          </Stack>
          <Box
            sx={{
              flexGrow: 1,
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(15,23,42,0.08)',
              backgroundColor: '#fff'
            }}
          >
           
            <MapChart />
          </Box>
        </CardContent>
      </Card>

      <Card
        sx={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.18), transparent 42%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12), transparent 55%)'
          }}
        />
        <CardContent sx={{ position: 'relative' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: '0.15em', opacity: 0.9 }}>
                GESTIÓN OPERATIVA
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Hola, equipo. Estas son las métricas clave de hoy.
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.88, maxWidth: 560 }}>
                Monitorea el desempeño operacional, la demanda proyectada y el estado de tu red
                logística en tiempo real para tomar decisiones proactivas.
              </Typography>
            </Box>
            <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip
                label="Nivel de servicio · 99.2%"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 600
                }}
              />
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Última actualización: hace 2 minutos
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {STAT_CARDS.map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            <Card
              sx={{
                height: '100%',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 3, 
                  flexGrow: 1,
                  height: '100%',
                  p: 2.5
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}1a`,
                      color: stat.color,
                      width: 48,
                      height: 48
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Chip
                    label={stat.delta}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ borderRadius: 999 }}
                  />
                </Stack>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      mb: 0.5,
                      fontSize: '0.875rem',
                      lineHeight: 1.4
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(
                    35,
                    Math.min(
                      100,
                      60 + (Number(stat.delta.replace(/[^0-9.-]/g, '')) || 0) * 8
                    )
                  )}
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    bgcolor: 'action.hover'
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ===== Operativa del día ===== */}
      <Grid container spacing={0}>
        <Grid item xs={12} sx={{ p: 0 }}>
          <Card
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              minHeight: 320,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(15,23,42,0.08)'
            }}
          >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Operativa del día
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
                    Indicadores diarios del rendimiento operativo en tiempo real para cada frente
                    del proceso logístico.
                  </Typography>
                </Box>
                <Chip label="Nivel óptimo" color="success" variant="outlined" />
              </Stack>

              <Grid container spacing={3} alignItems="stretch">
                {PERFORMANCE_INDICATORS.map((indicator) => (
                  <Grid item xs={12} md={4} key={indicator.label}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        backgroundColor: '#fff',
                        border: '1px solid rgba(15,23,42,0.06)',
                        boxShadow: '0 18px 48px rgba(15,23,42,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.75,
                        minHeight: 200,
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {indicator.label}
                      </Typography>
                      <LinearProgress variant="determinate" value={indicator.progress} sx={{ height: 10, borderRadius: 999 }} />
                      <Typography variant="caption" color="text.secondary">
                        {indicator.caption}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
