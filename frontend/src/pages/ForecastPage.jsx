import { Box, Typography, Divider } from '@mui/material'
import { useEffect, useState } from 'react'

export default function ReportPage() {
  const [reportText, setReportText] = useState('')

  useEffect(() => {
    const storedReport = localStorage.getItem('flight_report')
    if (storedReport) {
      const cleaned = storedReport
        .replace(/^"(.*)"$/, '$1')         // quita comillas exteriores si las hay
        .replace(/\\n/g, '\n')             // convierte \n en saltos reales
        .replace(/\\"/g, '"')              // quita escape de comillas dobles
        .trim()
      setReportText(cleaned)
    }
  }, [])

  const groupByChunks = (text, linesPerGroup = 8) => {
    const lines = text.split('\n').filter(l => l.trim() !== '')
    const chunks = []
    for (let i = 0; i < lines.length; i += linesPerGroup) {
      chunks.push(lines.slice(i, i + linesPerGroup).join(' '))
    }
    return chunks
  }

  return (
    <Box sx={{ px: 3, py: 4, maxWidth: 900 }}>
      <Typography variant="h5" gutterBottom>
        Reporte de Predicción
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {reportText ? (
        groupByChunks(reportText).map((paragraph, idx) => (
          <Typography
            key={idx}
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', mb: 2 }}
          >
            {paragraph}
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

