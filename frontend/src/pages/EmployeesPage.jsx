import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
  alpha
} from '@mui/material'
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import EmployeeForm from '../components/EmployeeForm'
import axios from 'axios'

const API_URL = '/employees'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(API_URL)
      const items = Array.isArray(res.data) ? res.data : []
      setEmployees(items)
    } catch (error) {
      console.error(error)
      setSnackbar({
        open: true,
        message: 'No fue posible cargar el equipo',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleSave = async (data) => {
    try {
      const payload = { ...data }

      if (!payload.password) {
        delete payload.password
      }

      if (editEmployee?.id) {
        await axios.put(`${API_URL}/${editEmployee.id}`, payload)
        setSnackbar({ open: true, message: 'Empleado actualizado', severity: 'success' })
      } else {
        await axios.post(API_URL, payload)
        setSnackbar({ open: true, message: 'Empleado creado', severity: 'success' })
      }
      setLoading(true)
      fetchEmployees()
      setOpenDialog(false)
      setEditEmployee(null)
    } catch (error) {
      console.error(error)
      setSnackbar({ open: true, message: 'No se pudo guardar el empleado', severity: 'error' })
    }
  }

  const handleDelete = useCallback(
    async (id) => {
      if (!id || String(id).startsWith('emp-')) {
        setSnackbar({ open: true, message: 'No se pudo identificar al colaborador', severity: 'error' })
        return
      }
      if (!window.confirm('¿Eliminar este colaborador?')) return
      try {
        await axios.delete(`${API_URL}/${id}`)
        setSnackbar({ open: true, message: 'Empleado eliminado', severity: 'info' })
        setLoading(true)
        fetchEmployees()
      } catch (error) {
        console.error(error)
        setSnackbar({ open: true, message: 'No se pudo eliminar', severity: 'error' })
      }
    },
    [fetchEmployees]
  )

  const rows = useMemo(
    () =>
      employees.map((employee, index) => ({
        id: employee.id ?? `emp-${index}`,
        _apiId: employee.id ?? null,
        ...employee
      })),
    [employees]
  )

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 1.3,
        minWidth: 200,
        renderCell: (params) => (
          <Stack spacing={0.4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {params.value}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {params.row.email}
              </Typography>
            </Stack>
          </Stack>
        )
      },
      {
        field: 'role',
        headerName: 'Rol',
        flex: 0.9,
        minWidth: 160,
        renderCell: (params) => (
          <Chip
            label={params.value || 'Sin rol'}
            size="small"
            sx={{
              bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08),
              color: 'secondary.main',
              fontWeight: 600
            }}
            icon={<WorkOutlineRoundedIcon fontSize="small" />}
          />
        )
      },
      {
        field: 'position',
        headerName: 'Especialidad',
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => {
          const row = params?.row || params;
          return row?.position || row?.role || '';
        }
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: '',
        width: 110,
        getActions: (params) => [
          <GridActionsCellItem
            icon={<EditRoundedIcon />}
            label="Editar"
            onClick={() => {
              const original = employees.find((employee) => employee.id === params.row._apiId)
              setEditEmployee(original || params.row)
              setOpenDialog(true)
            }}
            showInMenu
          />,
          <GridActionsCellItem
            icon={<DeleteRoundedIcon />}
            label="Eliminar"
            onClick={() => handleDelete(params.row._apiId ?? params.row.id)}
            showInMenu
          />
        ]
      }
    ],
    [handleDelete, employees]
  )

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Talento & Equipo
      </Typography>

      <Card>
        <CardHeader
          title={
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Colaboradores activos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gestiona roles, capacidades y disponibilidad de tu equipo operativo.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => setOpenDialog(true)}
                size="large"
              >
                Nuevo colaborador
              </Button>
            </Stack>
          }
        />
        <CardContent>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.06)
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.06)
              }
            }}
          />
        </CardContent>
      </Card>

      <Dialog
        maxWidth="sm"
        fullWidth
        open={openDialog}
        onClose={() => {
          setOpenDialog(false)
          setEditEmployee(null)
        }}
      >
        <DialogTitle>{editEmployee ? 'Editar colaborador' : 'Nuevo colaborador'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <EmployeeForm
            employee={editEmployee}
            onSubmit={handleSave}
            onCancel={() => {
              setOpenDialog(false)
              setEditEmployee(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3200}
        onClose={() => setSnackbar((state) => ({ ...state, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((state) => ({ ...state, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
