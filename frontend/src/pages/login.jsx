// src/pages/Login.jsx
// Estilo "Glass Corporate" + fondo con fotografía
// - Card translúcido (opacidad 0.75) + blur
// - Mostrar/Ocultar contraseña + Recuérdame
// - Fade-in comentado (puedes quitarlo fácil)
// - Línea "TMDV" debajo del branding

import { useEffect, useState } from 'react'
import {
  Box, Paper, Typography, TextField, Button, Alert, Stack, Link,
  InputAdornment, IconButton, FormControlLabel, Checkbox,
} from '@mui/material'
import { useAuth } from '../context/authContext.jsx'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const remembered = localStorage.getItem('remember_me') === '1'
    const rememberedEmail = localStorage.getItem('remember_email') || ''
    if (remembered) {
      setRemember(true)
      setValues((s) => ({ ...s, email: rememberedEmail }))
    }
  }, [])

  const set = (k) => (e) => setValues((s) => ({ ...s, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (remember) {
        localStorage.setItem('remember_me', '1')
        localStorage.setItem('remember_email', values.email)
      } else {
        localStorage.removeItem('remember_me')
        localStorage.removeItem('remember_email')
      }
      await login(values)
      // NOTA: No agregamos fade al dashboard (pedido explícito)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        // Foto de fondo a pantalla completa
        backgroundImage: "url('/img/login-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',

        // ===== ANIMACIÓN FADE-IN (puedes quitarla) =====
        // Elimina 'animation' y el bloque '@keyframes' si no la quieres.
        animation: 'fadeInAuth 380ms ease-out',
        '@keyframes fadeInAuth': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        // ================================================
        padding: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          // Glass corporativo (opacidad 0.75 + blur)
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.20)',
        }}
      >
        <Typography variant="overline" sx={{ fontSize: '13px', letterSpacing: 1.5, color: '#000000ff' }}>
          GATEGROUP • SMART INTELLIGENCE
        </Typography>
        <Typography variant="overline" sx={{fontSize: '13px', letterSpacing: 1.5, color: '#000000ff', display: 'block'}}>
          EQUIPO TMDV
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, mb: 2 }}>
          Iniciar sesión
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="Correo"
            type="email"
            size="medium"
            value={values.email}
            onChange={set('email')}
            required
            InputLabelProps={{
                style: { color: '#000' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Contraseña"
            type={showPw ? 'text' : 'password'}
            size="medium"
            value={values.password}
            onChange={set('password')}
            required
            InputLabelProps={{
                style: { color: '#000' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="mostrar u ocultar contraseña"
                    onClick={() => setShowPw((v) => !v)}
                    edge="end"
                  >
                    {showPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} size="small" />}
            label="Recuérdame"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.2,
              fontWeight: 700,
              background: 'linear-gradient(180deg, #1652a3 0%, #0f3f83 100%)',
              boxShadow: '0 6px 18px rgba(22,82,163,0.35)',
              '&:hover': { background: 'linear-gradient(180deg, #144a93 0%, #0d376f 100%)' },
            }}
          >
            {loading ? 'Entrando…' : 'ENTRAR'}
          </Button>
        </Stack>

        <Typography variant="body2" sx={{ mt: 2 }}>
          ¿No tienes cuenta?{' '}
          <Link component={RouterLink} to="/register" underline="hover">
            Regístrate
          </Link>
        </Typography>
      </Paper>
    </Box>
  )
}
