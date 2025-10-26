import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha
} from '@mui/material'
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const durationOptions = Array.from({ length: 18 * 4 }, (_, idx) => {
  const hours = Math.floor(idx / 4) + 1
  const minutes = (idx % 4) * 15
  const hh = hours.toString().padStart(2, '0')
  const mm = minutes.toString().padStart(2, '0')
  return `${hh}:${mm}`
})

export default function ForecastPage() {
  const [loading, setLoading] = useState(false)
  const [forecastData, setForecastData] = useState([])
  const [originCountry, setOriginCountry] = useState('')
  const [flightDuration, setFlightDuration] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('')
  const [confirmedPassengers, setConfirmedPassengers] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('forecastData')
    if (saved) setForecastData(JSON.parse(saved))
  }, [])

  const handlePredict = async () => {
    if (!originCountry || !flightDuration || !timeOfDay || !confirmedPassengers) {
      setError('Por favor completa todos los campos antes de generar la predicción.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const params = {
        origin_country: originCountry,
        flight_duration: flightDuration,
        time_of_day: timeOfDay,
        confirmed_passengers: confirmedPassengers
      }
      const res = await axios.get('http://localhost:8000/predict', { params })
      setForecastData(res.data.predictions || [])
      localStorage.setItem('forecastData', JSON.stringify(res.data.predictions))
      localStorage.setItem('flight_report', res.data.report || '')
    } catch (err) {
      console.error('Error al obtener predicción:', err)
      setError('No pudimos obtener una predicción. Intenta de nuevo en unos minutos.')
    } finally {
      setLoading(false)
    }
  }

  const trendCopy = useMemo(
    () => ({
      up: { label: 'Tendencia al alza', color: 'success' },
      down: { label: 'Tendencia a la baja', color: 'error' },
      steady: { label: 'Tendencia estable', color: 'default' }
    }),
    []
  )

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Predicción de Demanda
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.main',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    <AutoGraphRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Parámetros del vuelo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ajusta las variables clave para anticipar consumos a bordo.
                    </Typography>
                  </Box>
                </Stack>
              }
            />
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="País de origen"
                  placeholder="Ej. México"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                />
                <TextField
                  select
                  label="Duración del vuelo (HH:MM)"
                  value={flightDuration}
                  onChange={(e) => setFlightDuration(e.target.value)}
                >
                  {durationOptions.map((val) => (
                    <MenuItem key={val} value={val}>
                      {val} hrs
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Momento del día"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                >
                  <MenuItem value="mañana">Mañana</MenuItem>
                  <MenuItem value="tarde">Tarde</MenuItem>
                  <MenuItem value="noche">Noche</MenuItem>
                </TextField>
                <TextField
                  type="number"
                  label="Pasajeros confirmados"
                  value={confirmedPassengers}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (val >= 1 && val <= 550) setConfirmedPassengers(val)
                  }}
                  inputProps={{ min: 1, max: 550 }}
                />

                {error && (
                  <Alert severity="warning" onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePredict}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Generar predicción'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Resultado del modelo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lista priorizada de productos con estimación de consumo y tendencia proyectada.
                    </Typography>
                  </Box>
                  {!!forecastData.length && (
                    <Chip
                      label={`${forecastData.length} productos sugeridos`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
              }
            />
            <CardContent>
              {forecastData.length ? (
                <Stack spacing={2}>
                  {forecastData.map((item, index) => {
                    const trend = trendCopy[item.trend] || trendCopy.steady
                    return (
                      <Stack
                        key={index}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent="space-between"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03)
                        }}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {item.product}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Demanda estimada: {item.predicted_demand} unidades
                          </Typography>
                        </Stack>
                        <Chip
                          icon={<TrendingUpRoundedIcon />}
                          label={trend.label}
                          color={trend.color}
                          variant={trend.color === 'default' ? 'outlined' : 'filled'}
                          sx={{ minWidth: 180 }}
                        />
                      </Stack>
                    )
                  })}

                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    onClick={() => navigate('/reports')}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
                    startIcon={<TimelineRoundedIcon />}
                  >
                    Ver reporte ejecutivo
                  </Button>
                </Stack>
              ) : (
                <EmptyState />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

function EmptyState() {
  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
        borderRadius: 4,
        p: 4,
        textAlign: 'center',
        color: 'text.secondary'
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Aún no has generado una predicción
      </Typography>
      <Typography variant="body2">
        Completa los parámetros del vuelo para anticipar el consumo a bordo y generar un reporte.
      </Typography>
    </Box>
  )
}
