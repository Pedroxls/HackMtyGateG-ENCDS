import React, { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Stack
} from '@mui/material'

const initialState = {
  name: '',
  email: '',
  position: ''
}

export default function EmployeeForm({ employee, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    if (employee) setForm(employee)
    else setForm(initialState)
  }, [employee])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.position) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} mt={1}>
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
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
          <Button variant="outlined" onClick={onCancel}>Cancelar</Button>
          <Button variant="contained" type="submit">Guardar</Button>
        </Stack>
      </Stack>
    </form>
  )
}
