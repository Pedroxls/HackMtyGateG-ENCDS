import React, { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Stack
} from '@mui/material'

const initialState = {
  code: '',
  destination: '',
  date: ''
}

export default function FlightForm({ flight, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    if (flight) setForm(flight)
    else setForm(initialState)
  }, [flight])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.code || !form.destination || !form.date) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} mt={1}>
        <TextField
          label="Código de vuelo"
          name="code"
          value={form.code}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Destino"
          name="destination"
          value={form.destination}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Fecha"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
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
