import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha
} from '@mui/material'
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded'

export default function Settings() {
  const [values, setValues] = useState({
    company: 'Gate Intelligence',
    alertEmail: 'alerts@gateintelligence.com',
    weeklyDigest: true,
    anomalyAlerts: true,
    experimentalFeatures: false
  })
  const [saved, setSaved] = useState(false)

  const handleChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // TODO: Integrar con endpoint real
    setSaved(true)
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Configuración
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader
              title={
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      display: 'grid',
                      placeItems: 'center',
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText'
                    }}
                  >
                    <SettingsSuggestRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Identidad corporativa
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mantén actualizados los datos de tu organización para personalizar reportes y
                      comunicaciones.
                    </Typography>
                  </Box>
                </Stack>
              }
            />
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="Nombre de la empresa"
                  value={values.company}
                  onChange={handleChange('company')}
                />
                <TextField
                  label="Correo para alertas"
                  type="email"
                  value={values.alertEmail}
                  onChange={handleChange('alertEmail')}
                />
                <Box>
                  <Button variant="contained" size="large" onClick={handleSave}>
                    Guardar cambios
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader
              title={
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Notificaciones y automatización
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Define qué eventos generarían alertas automáticas para tu equipo operativo.
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              <Stack spacing={3}>
                <SettingToggle
                  label="Resumen semanal"
                  description="Recibe cada lunes un digest con KPIs, alertas y desempeño por unidad de negocio."
                  checked={values.weeklyDigest}
                  onChange={handleChange('weeklyDigest')}
                />
                <SettingToggle
                  label="Alertas por anomalías"
                  description="Notifica inmediatamente cuando el modelo detecte un patrón fuera de lo esperado."
                  checked={values.anomalyAlerts}
                  onChange={handleChange('anomalyAlerts')}
                />
                <SettingToggle
                  label="Funciones experimentales"
                  description="Accede a visualizaciones beta y nuevas capacidades de predicción."
                  checked={values.experimentalFeatures}
                  onChange={handleChange('experimentalFeatures')}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Ambiente actual
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label="Workspace · Productivo" color="primary" />
                  <Chip label="API v2.1" variant="outlined" />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Puedes solicitar una instancia sandbox para pruebas avanzadas de predicción.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={2800}
        onClose={() => setSaved(false)}
      >
        <Alert severity="success" onClose={() => setSaved(false)}>
          Cambios guardados correctamente
        </Alert>
      </Snackbar>
    </Stack>
  )
}

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent="space-between"
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.08),
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03)
      }}
    >
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
          {description}
        </Typography>
      </Box>
      <Switch checked={checked} onChange={onChange} />
    </Stack>
  )
}
