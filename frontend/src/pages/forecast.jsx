// src/pages/Forecast.jsx
// Vista de Predicción: línea de demanda con filtros de días y categoría.

import { useEffect, useMemo, useState } from 'react'
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,
} from 'chart.js'
import { generateDemand } from '../services/mockForecast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function Forecast() {
  const [days, setDays] = useState(30)
  const [category, setCategory] = useState('General')
  const [series, setSeries] = useState({ labels: [], data: [] })

  useEffect(() => {
    // Carga/genera datos cuando cambian filtros
    const out = generateDemand({ days, category })
    setSeries(out)
  }, [days, category])

  const chartData = useMemo(() => ({
    labels: series.labels,
    datasets: [
      {
        label: `Demanda (${category})`,
        data: series.data,
        borderWidth: 2,
        tension: 0.25,
        // no especificamos color para mantener el theme por defecto
      },
    ],
  }), [series, category])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} uds` } },
    },
    scales: {
      y: { ticks: { callback: v => `${v} uds` } },
    },
  }), [])

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Predicción</Typography>

      {/* Filtros */}
      <Stack direction="row" spacing={2} sx={{ maxWidth: 600 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Rango</InputLabel>
          <Select label="Rango" value={days} onChange={e => setDays(e.target.value)}>
            <MenuItem value={7}>Últimos 7 días</MenuItem>
            <MenuItem value={30}>Últimos 30 días</MenuItem>
            <MenuItem value={90}>Últimos 90 días</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Categoría</InputLabel>
          <Select label="Categoría" value={category} onChange={e => setCategory(e.target.value)}>
            <MenuItem value="General">General</MenuItem>
            <MenuItem value="Electrónica">Electrónica</MenuItem>
            <MenuItem value="Refacciones">Refacciones</MenuItem>
            <MenuItem value="Ferretería">Ferretería</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Gráfica */}
      <Paper elevation={0} sx={{ p: 2, height: 420, border: '1px solid #e5e7eb', borderRadius: 2 }}>
        <Line data={chartData} options={chartOptions} />
      </Paper>
    </Box>
  )
}
