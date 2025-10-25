// src/pages/Register.jsx
// Registro simple: nombre completo, correo y contraseña.

import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert, Stack, Link,
} from '@mui/material';
import { useAuth } from '../context/authContext.jsx';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const set = (k) => (e) => setValues(s => ({ ...s, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(values);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo registrar');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f6f7fb', p: 2 }}>
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e5e7eb', borderRadius: 2, minWidth: 360 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Crear cuenta</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField label="Nombre completo" size="small" value={values.name} onChange={set('name')} required />
          <TextField label="Correo" type="email" size="small" value={values.email} onChange={set('email')} required />
          <TextField label="Contraseña" type="password" size="small" value={values.password} onChange={set('password')} required />
          <Button type="submit" variant="contained">Registrarse</Button>
        </Stack>

        <Typography variant="body2" sx={{ mt: 2 }}>
          ¿Ya tienes cuenta?{' '}
          <Link component={RouterLink} to="/login">Inicia sesión</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
