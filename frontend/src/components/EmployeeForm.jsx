import React, { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

const initialState = {
  name: '',
  email: '',
  position: '',
  password: ''
}

export default function EmployeeForm({ employee, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialState)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (employee) {
      const { name, email, position } = employee
      setForm({ name: name || '', email: email || '', position: position || '', password: '' })
    } else {
      setForm(initialState)
    }
  }, [employee])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.position) return
    if (!employee && !form.password) return

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      position: form.position.trim(),
    }

    if (form.password) {
      payload.password = form.password
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} mt={1} sx={{ width: '100%' }}>
        <TextField
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Correo electrónico"
          name="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          required
          type="email"
        />
        <TextField
          label="Puesto"
          name="position"
          value={form.position}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Contraseña"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={handleChange}
          fullWidth
          required={!employee}
          helperText={employee ? 'Déjalo vacío para conservar la contraseña actual' : ''}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1} width="100%">
          <Button variant="outlined" onClick={onCancel}>Cancelar</Button>
          <Button variant="contained" type="submit">Guardar</Button>
        </Stack>
      </Stack>
    </form>
  )
}
