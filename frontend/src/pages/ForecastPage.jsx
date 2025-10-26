// src/pages/ForecastPage.jsx
import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Paper, Stack, CircularProgress, Chip,
  TextField, MenuItem
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function ForecastPage() {
  const [loading, setLoading] = useState(false)
  const [forecastData, setForecastData] = useState([])
  const [originCountry, setOriginCountry] = useState('')
  const [flightDuration, setFlightDuration] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('')
  const [confirmedPassengers, setConfirmedPassengers] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem("forecastData")
    if (saved) {
      setForecastData(JSON.parse(saved))
    }
  }, [])

  const durationOptions = []
  for (let h = 1; h <= 18; h++) {
    for (let m of [0, 15, 30, 45]) {
      const hh = h.toString().padStart(2, '0')
      const mm = m.toString().padStart(2, '0')
      durationOptions.push(`${hh}:${mm}`)
    }
  }

  const handlePredict = async () => {
    if (!originCountry || !flightDuration || !timeOfDay || !confirmedPassengers) {
      alert('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    try {
      const params = {
        origin_country: originCountry,
        flight_duration: flightDuration,
        time_of_day: timeOfDay,
        confirmed_passengers: confirmedPassengers
      }
      const res = await axios.get(`http://localhost:8000/predict`, { params })
      setForecastData(res.data.predictions || [])
      localStorage.setItem("forecastData", JSON.stringify(res.data.predictions))
      localStorage.setItem("flight_report", res.data.report || '')
    } catch (err) {
      console.error('Error al obtener predicción:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'success'
      case 'down': return 'error'
      case 'steady': return 'default'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 920, py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Predicción de Demanda
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField
          label="País de Origen"
          fullWidth
          value={originCountry}
          onChange={(e) => setOriginCountry(e.target.value)}
        />
        <TextField
          select
          label="Duración del Vuelo (HH:MM)"
          fullWidth
          value={flightDuration}
          onChange={(e) => setFlightDuration(e.target.value)}
        >
          {durationOptions.map((val, i) => (
            <MenuItem key={i} value={val}>{val} hrs</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Hora del Día"
          fullWidth
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value)}
        >
          <MenuItem value="mañana">Mañana</MenuItem>
          <MenuItem value="tarde">Tarde</MenuItem>
          <MenuItem value="noche">Noche</MenuItem>
        </TextField>
        <TextField
          type="number"
          label="Pasajeros Confirmados"
          fullWidth
          inputProps={{ min: 1, max: 550 }}
          value={confirmedPassengers}
          onChange={(e) => {
            const val = Number(e.target.value)
            if (val >= 1 && val <= 550) setConfirmedPassengers(val)
          }}
        />
      </Stack>

      <Button variant="contained" onClick={handlePredict} disabled={loading}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Generar Predicción'}
      </Button>

      {forecastData.length > 0 && (
        <>
          <Box mt={3}>
            {forecastData.map((item, i) => (
              <Paper
                sx={{
                  p: 2,
                  mb: 2,
                  '&:hover': {
                    border: '4px solid #00dc8fff'
                  }
                }}
                key={i}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{item.product}</Typography>
                    <Typography variant="body2">Demanda Estimada: {item.predicted_demand}</Typography>
                  </Box>
                  <Chip
                    label={
                      item.trend === 'up'
                        ? '↑ Tendencia al alza'
                        : item.trend === 'down'
                          ? '↓ Tendencia a la baja'
                          : '→ Tendencia estable'
                    }
                    color={getTrendColor(item.trend)}
                    variant="outlined"
                  />
                </Stack>
              </Paper>
            ))}
          </Box>

          <Button
            variant="contained"
            color="secondary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/reports')}
          >
            Ver Reporte
          </Button>
        </>
      )}
    </Box>
  )
}
