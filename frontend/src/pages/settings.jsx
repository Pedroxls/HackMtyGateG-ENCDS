// src/pages/Settings.jsx
// Ajustes simples: empresa + correo de alertas. Sin notificaciones.

import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Snackbar, Alert, Stack,
} from '@mui/material';

export default function Settings() {
  const [values, setValues] = useState({
    company: 'Smart Intelligence',
    alertEmail: 'alerts@empresa.com',
  });
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => setValues(s => ({ ...s, [k]: e.target.value }));

  const handleSave = () => {
    // Aquí iría el POST/PUT real a backend
    setSaved(true);
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Ajustes</Typography>

      <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, maxWidth: 600 }}>
        <Stack spacing={2}>
          <TextField
            label="Nombre de la empresa"
            value={values.company}
            onChange={set('company')}
            size="small"
          />
          <TextField
            label="Correo para alertas"
            value={values.alertEmail}
            onChange={set('alertEmail')}
            size="small"
            type="email"
          />
          <Box>
            <Button variant="contained" onClick={handleSave}>Guardar</Button>
          </Box>
        </Stack>
      </Paper>

      <Snackbar open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert onClose={() => setSaved(false)} severity="success" variant="filled">Ajustes guardados</Alert>
      </Snackbar>
    </Box>
  );
}
