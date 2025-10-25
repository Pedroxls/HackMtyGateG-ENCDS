import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Stack
} from '@mui/material'

const initialState = {
  name: '',
  sku: '',
  category: '',
  price: '',
  stock: '',
  expiration_days: '',
}

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    if (product) setForm(product)
  }, [product])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField label="Nombre" name="name" value={form.name} onChange={handleChange} required />
        <TextField label="SKU" name="sku" value={form.sku} onChange={handleChange} required />
        <TextField label="Categoría" name="category" value={form.category} onChange={handleChange} required />
        <TextField label="Precio" name="price" value={form.price} onChange={handleChange} type="number" />
        <TextField label="Stock" name="stock" value={form.stock} onChange={handleChange} type="number" />
        <TextField label="Fecha de vencimiento" name="expiration_days" value={form.expiration_days} onChange={handleChange} placeholder="YYYY-MM-DD" />
      </Stack>
      <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="contained">Guardar</Button>
      </Box>
    </form>
  )
}

export default ProductForm
