// src/pages/ProductsPage.jsx
import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Typography,
  CircularProgress,
  IconButton,
  Stack,
  Paper
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ProductForm from '../components/ProductForm'
import axios from 'axios'

const API_URL = '/products'

const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_URL)
      setProducts(res.data)
    } catch (err) {
      console.error('Error al obtener productos:', err)
      setSnackbar({ open: true, message: 'Error al cargar productos', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSave = async (data) => {
    try {
      if (editProduct) {
        await axios.put(`${API_URL}/${editProduct.id}`, data)
        setSnackbar({ open: true, message: 'Producto actualizado', severity: 'success' })
      } else {
        await axios.post(API_URL, data)
        setSnackbar({ open: true, message: 'Producto creado', severity: 'success' })
      }
      fetchProducts()
      setOpenDialog(false)
      setEditProduct(null)
    } catch (err) {
      console.error('Error al guardar producto:', err)
      setSnackbar({ open: true, message: 'Error al guardar producto', severity: 'error' })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return
    try {
      await axios.delete(`${API_URL}/${id}`)
      setSnackbar({ open: true, message: 'Producto eliminado', severity: 'info' })
      fetchProducts()
    } catch (err) {
      console.error('Error al eliminar producto:', err)
      setSnackbar({ open: true, message: 'Error al eliminar producto', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 920, px: 2, py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Productos
      </Typography>
      <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenDialog(true)}>
        Añadir producto
      </Button>

      {loading ? (
        <Box mt={4} textAlign="center">
          <CircularProgress />
        </Box>
      ) : (
        <Box mt={3}>
          {products.length === 0 ? (
            <Typography>No hay productos.</Typography>
          ) : (
            products.map((p) => (
              <Paper key={p.id} elevation={2} sx={{ p: 2, mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{p.name}</Typography>
                    <Typography variant="body2">Categoría: {p.category}</Typography>
                    <Typography variant="body2">SKU: {p.sku}</Typography>
                    <Typography variant="body2">Precio: {p.price ?? 'N/D'}</Typography>
                  </Box>
                  <Box>
                    <IconButton onClick={() => { setEditProduct(p); setOpenDialog(true) }}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(p.id)}><DeleteIcon /></IconButton>
                  </Box>
                </Stack>
              </Paper>
            ))
          )}
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditProduct(null) }} maxWidth="sm" fullWidth>
        <DialogTitle>{editProduct ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        <DialogContent>
          <ProductForm product={editProduct} onSubmit={handleSave} onCancel={() => { setOpenDialog(false); setEditProduct(null) }} />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ProductsPage
