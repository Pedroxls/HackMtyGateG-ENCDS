// src/pages/ProductsPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Typography,
  Stack,
  Chip,
  alpha
} from '@mui/material'
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import axios from 'axios'
import ProductForm from '../components/ProductForm'

const API_URL = '/products'

const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(API_URL)
      const items = Array.isArray(res.data) ? res.data : []
      setProducts(items)
    } catch (err) {
      console.error('Error al obtener productos:', err)
      setSnackbar({
        open: true,
        message: 'Error al cargar productos',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSave = async (data) => {
    try {
      if (editProduct?.id) {
        await axios.put(`${API_URL}/${editProduct.id}`, data)
        setSnackbar({
          open: true,
          message: 'Producto actualizado correctamente',
          severity: 'success'
        })
      } else {
        await axios.post(API_URL, data)
        setSnackbar({
          open: true,
          message: 'Producto creado correctamente',
          severity: 'success'
        })
      }
      setLoading(true)
      fetchProducts()
      setOpenDialog(false)
      setEditProduct(null)
    } catch (err) {
      console.error('Error al guardar producto:', err)
      setSnackbar({
        open: true,
        message: 'No se pudo guardar el producto',
        severity: 'error'
      })
    }
  }

  const handleDeleteProduct = useCallback(
    async (id) => {
      if (!id || String(id).startsWith('row-')) {
        setSnackbar({
          open: true,
          message: 'No se pudo identificar el producto seleccionado',
          severity: 'error'
        })
        return
      }
      if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return
      try {
        await axios.delete(`${API_URL}/${id}`)
        setSnackbar({
          open: true,
          message: 'Producto eliminado',
          severity: 'info'
        })
        setLoading(true)
        fetchProducts()
      } catch (err) {
        console.error('Error al eliminar producto:', err)
        setSnackbar({
          open: true,
          message: 'No se pudo eliminar el producto',
          severity: 'error'
        })
      }
    },
    [fetchProducts]
  )

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Producto',
        flex: 1.4,
        minWidth: 220,
        renderCell: (params) => (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {params.row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              SKU · {params.row.sku || 'N/D'}
            </Typography>
          </Stack>
        )
      },
      {
        field: 'category',
        headerName: 'Categoría',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
          <Chip
            label={params.value || 'Sin categoría'}
            size="small"
            icon={<LocalOfferRoundedIcon fontSize="small" />}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main'
            }}
          />
        )
      },
      {
        field: 'price',
        headerName: 'Precio',
        flex: 0.6,
        valueFormatter: (value) =>
          typeof value === 'number' ? `$${value.toFixed(2)}` : 'N/D'
      },
      {
        field: 'stock',
        headerName: 'Stock',
        flex: 0.5,
        valueFormatter: (value) => (value == null ? 'N/D' : value)
      },
      {
        field: 'expiration_days',
        headerName: 'Expira en',
        flex: 0.7,
        valueFormatter: (value) => value || 'Sin registro'
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
              const original = products.find(
                (product) => product.id === params.row._apiId
              )
              setEditProduct(original || params.row)
              setOpenDialog(true)
            }}
            showInMenu
          />,
          <GridActionsCellItem
            icon={<DeleteRoundedIcon />}
            label="Eliminar"
            onClick={() => handleDeleteProduct(params.row._apiId ?? params.row.id)}
            showInMenu
          />
        ]
      }
    ],
    [handleDeleteProduct, products]
  )

  const rows = useMemo(
    () =>
      products.map((product, index) => ({
        id: product.id ?? `row-${index}`,
        _apiId: product.id ?? null,
        ...product
      })),
    [products]
  )

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Catálogo de Productos
      </Typography>

      <Card>
        <CardHeader
          title={
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Inventario activo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Visualiza y administra el portafolio disponible para operaciones.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => setOpenDialog(true)}
                size="large"
              >
                Nuevo producto
              </Button>
            </Stack>
          }
        />
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              autoHeight
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                  backdropFilter: 'blur(12px)'
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: '#ffffff'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05)
                }
              }}
              pageSizeOptions={[5, 10, 25]}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false)
          setEditProduct(null)
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editProduct ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <ProductForm
            product={editProduct}
            onSubmit={handleSave}
            onCancel={() => {
              setOpenDialog(false)
              setEditProduct(null)
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

export default ProductsPage
