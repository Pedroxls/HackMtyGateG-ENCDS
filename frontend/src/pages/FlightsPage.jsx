// src/pages/FlightsPage.jsx
import React, { useEffect, useState } from 'react'
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent, Snackbar,
  Alert, IconButton, Stack, Paper, CircularProgress
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import FlightForm from '../components/FlightForm'
import axios from 'axios'

const API_URL = '/flights'

export default function FlightsPage() {
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editFlight, setEditFlight] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const fetchFlights = async () => {
    try {
      const res = await axios.get(API_URL)
      setFlights(res.data)
    } catch {
      setSnackbar({ open: true, message: 'Error al cargar vuelos', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFlights() }, [])

  const handleSave = async (data) => {
    try {
      if (editFlight) await axios.put(`${API_URL}/${editFlight.id}`, data)
      else await axios.post(API_URL, data)
      setSnackbar({ open: true, message: 'Guardado con éxito', severity: 'success' })
      fetchFlights()
      setOpenDialog(false)
      setEditFlight(null)
    } catch {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar vuelo?')) return
    try {
      await axios.delete(`${API_URL}/${id}`)
      setSnackbar({ open: true, message: 'Vuelo eliminado', severity: 'info' })
      fetchFlights()
    } catch {
      setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 920, px: 2, py: 3 }}>
      <Typography variant="h5" gutterBottom>Vuelos</Typography>
      <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenDialog(true)} sx={{ mb: 2 }}>
        Añadir vuelo
      </Button>

      {loading ? (
        <Box mt={4} textAlign="center"><CircularProgress /></Box>
      ) : (
        flights.length === 0 ? (
          <Typography>No hay vuelos.</Typography>
        ) : (
          flights.map(f => (
            <Paper key={f.id} sx={{ p: 1.5, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={600}>{f.code}</Typography>
                  <Typography variant="body2">Destino: {f.destination}</Typography>
                  <Typography variant="body2">Fecha: {f.date}</Typography>
                </Box>
                <Box>
                  <IconButton onClick={() => { setEditFlight(f); setOpenDialog(true) }}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(f.id)}><DeleteIcon /></IconButton>
                </Box>
              </Stack>
            </Paper>
          ))
        )
      )}

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditFlight(null) }} maxWidth="sm" fullWidth>
        <DialogTitle>{editFlight ? 'Editar vuelo' : 'Nuevo vuelo'}</DialogTitle>
        <DialogContent>
          <FlightForm flight={editFlight} onSubmit={handleSave} onCancel={() => setOpenDialog(false)} />
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
