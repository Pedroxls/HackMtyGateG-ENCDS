import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Stack,
  Typography,
  Button,
  alpha
} from '@mui/material'
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'

export default function ReportsPage() {
  const [reportText, setReportText] = useState('')

  useEffect(() => {
    const storedReport = localStorage.getItem('flight_report')
    if (storedReport) setReportText(storedReport)
  }, [])

  const reportParagraphs = useMemo(
    () => reportText.split('\n').filter((line) => line.trim().length > 0),
    [reportText]
  )

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Reportes Ejecutivos
      </Typography>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main'
                }}
              >
                <TimelineRoundedIcon />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Resumen estratégico
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Demanda y operaciones
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Visualiza los hallazgos clave derivados del modelo de predicción y las métricas
              operativas asociadas al desempeño de tu red logística.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ width: { xs: '100%', lg: 320 } }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Próximas acciones recomendadas
              </Typography>
              <ActionBadge
                label="Reforzar inventario US & MX"
                detail="Incrementa stock en hubs con tendencia al alza."
              />
              <ActionBadge
                label="Optimizar turnos nocturnos"
                detail="Demanda sostenida entre 22:00 - 02:00 hrs."
              />
              <ActionBadge
                label="Ajustar mix de productos"
                detail="Disminuye perecederos con rotación baja."
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card>
        <CardHeader
          title={
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Reporte de predicción
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generado con base en los parámetros de demanda y últimos vuelos analizados.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Chip label="Versión 1.3 · Beta" size="small" />
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfRoundedIcon />}
                  disabled={!reportParagraphs.length}
                >
                  Exportar PDF
                </Button>
              </Stack>
            </Stack>
          }
        />
        <CardContent>
          {reportParagraphs.length ? (
            <Stack spacing={2.5}>
              {reportParagraphs.map((line, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{ textAlign: 'justify', lineHeight: 1.7 }}
                >
                  {line}
                </Typography>
              ))}
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} alignItems="center">
                <BoltRoundedIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Insights generados automáticamente · Puedes regenerar el reporte desde la sección
                  de predicción con nuevos parámetros.
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <EmptyReportState />
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

function ActionBadge({ label, detail }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
        p: 2,
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04)
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {detail}
      </Typography>
    </Box>
  )
}

function EmptyReportState() {
  return (
    <Box
      sx={{
        py: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Aún no hay reporte disponible
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
          Genera una nueva predicción para obtener recomendaciones y resultados operativos en esta
          sección.
        </Typography>
      </Box>
    </Box>
  )
}
