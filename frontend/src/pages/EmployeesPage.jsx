// src/pages/EmployeesPage.jsx
import React, { useEffect, useState } from 'react'
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent, Snackbar,
  Alert, IconButton, Stack, Paper, CircularProgress
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import EmployeeForm from '../components/EmployeeForm'
import axios from 'axios'

const API_URL = '/employees'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(API_URL)
      setEmployees(res.data)
    } catch {
      setSnackbar({ open: true, message: 'Error al cargar empleados', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [])

  const handleSave = async (data) => {
    try {
      if (editEmployee) await axios.put(`${API_URL}/${editEmployee.id}`, data)
      else await axios.post(API_URL, data)
      setSnackbar({ open: true, message: 'Guardado con éxito', severity: 'success' })
      fetchEmployees()
      setOpenDialog(false)
      setEditEmployee(null)
    } catch {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar empleado?')) return
    try {
      await axios.delete(`${API_URL}/${id}`)
      setSnackbar({ open: true, message: 'Empleado eliminado', severity: 'info' })
      fetchEmployees()
    } catch {
      setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 920, py: 3 }}>
      <Typography variant="h5" gutterBottom>Empleados</Typography>
      <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenDialog(true)} sx={{ mb: 2 }}>
        Añadir empleado
      </Button>

      {loading ? (
        <Box mt={4} textAlign="center"><CircularProgress /></Box>
      ) : (
        employees.length === 0 ? (
          <Typography>No hay empleados.</Typography>
        ) : (
          employees.map(e => (
            <Paper 
              key={e.id} 
              sx={{ 
                p: 1.5, 
                mb: 2,
                '&:hover': {
                  border: '4px solid #00dc8fff'
                }
              }}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={600}>{e.name}</Typography>
                  <Typography variant="body2">Rol: {e.role}</Typography>
                  <Typography variant="body2">Email: {e.email}</Typography>
                </Box>
                <Box>
                  <IconButton onClick={() => { setEditEmployee(e); setOpenDialog(true) }}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(e.id)}><DeleteIcon /></IconButton>
                </Box>
              </Stack>
            </Paper>
          ))
        )
      )}

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditEmployee(null) }} maxWidth="sm" fullWidth>
        <DialogTitle>{editEmployee ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
        <DialogContent>
          <EmployeeForm employee={editEmployee} onSubmit={handleSave} onCancel={() => setOpenDialog(false)} />
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
