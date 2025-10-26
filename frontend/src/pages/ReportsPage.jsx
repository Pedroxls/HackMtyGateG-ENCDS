// src/pages/ReportPage.jsx
import { Box, Typography, Divider } from '@mui/material'
import { useEffect, useState } from 'react'

export default function ReportPage() {
  const [reportText, setReportText] = useState('')

  useEffect(() => {
    const storedReport = localStorage.getItem('flight_report')
    if (storedReport) {
      setReportText(storedReport)
    }
  }, [])

  return (
    <Box sx={{ px: 3, py: 4, maxWidth: 900 }}>
      <Typography variant="h5" gutterBottom>
        Reporte de Predicción
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {reportText ? (
        reportText.split('\n').map((line, idx) => (
          <Typography
            key={idx}
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', mb: 2 }}
          >
            {line}
          </Typography>
        ))
      ) : (
        <Typography variant="body1">
          No hay reporte disponible. Por favor genera una predicción desde la sección correspondiente.
        </Typography>
      )}
    </Box>
  )
}
