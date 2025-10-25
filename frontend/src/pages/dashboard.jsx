// src/pages/Dashboard.jsx
// Página base del Dashboard. Por ahora con KPIs dummy y estructura limpia.

import { Grid, Paper, Typography, Box } from '@mui/material'

function KpiCard({ label, value, hint }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="success.main">{hint}</Typography>}
    </Paper>
  )
}

export default function Dashboard() {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* KPIs superiores */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><KpiCard label="Ingresos (30d)" value="$ 352,000" hint="+4.2% vs 30d" /></Grid>
        <Grid item xs={12} md={3}><KpiCard label="Órdenes" value="1,240" hint="+2.1% vs 30d" /></Grid>
        <Grid item xs={12} md={3}><KpiCard label="Fill Rate" value="94.1%" hint="+0.8 pp" /></Grid>
        <Grid item xs={12} md={3}><KpiCard label="Lead Time" value="3.1 d" hint="-0.4 d" /></Grid>
      </Grid>

      {/* Área para charts / tablas (placeholder) */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Demanda reciente
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aquí irá la gráfica de demanda (próximo paso).
        </Typography>
      </Paper>
    </Box>
  )
}
