// src/pages/Reports.jsx
import { useEffect, useMemo, useState } from 'react'
import { Box, Paper, Typography, Alert } from '@mui/material'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { fetchOrders } from '../services/mockReports'

// --- Helpers robustos ---
const asCurrency = (n) => {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

const asSafeDate = (v) => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isFinite(d.getTime()) ? d : null
}

export default function Reports() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const columns = useMemo(() => [
    { field: 'folio', headerName: 'Folio', width: 120 },
    { field: 'cliente', headerName: 'Cliente', flex: 1, minWidth: 160 },
    { field: 'categoria', headerName: 'Categoría', width: 140 },
    { field: 'piezas', headerName: 'Piezas', type: 'number', width: 100 },
    {
      field: 'total',
      headerName: 'Total',
      type: 'number',
      width: 140,
      // ¡NO desestructurar! MUI a veces pasa null al formateador si el valor es void
      valueFormatter: (params) => asCurrency(params?.value),
    },
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 130,
      // valueGetter debe devolver SIEMPRE un tipo consistente
      valueGetter: (params) => asSafeDate(params?.value),
      valueFormatter: (params) => {
        const d = params?.value
        return d ? d.toLocaleDateString('es-MX') : '—'
      },
      sortComparator: (a, b) => {
        const t1 = a?.getTime?.() ?? 0
        const t2 = b?.getTime?.() ?? 0
        return t1 - t2
      },
    },
    { field: 'estado', headerName: 'Estado', width: 120 },
  ], [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchOrders()
        const safe = Array.isArray(data) ? data : []
        // Garantizar ID único para cada fila
        const withId = safe.map((r, i) => ({
          id: r?.id ?? r?.folio ?? `row-${i + 1}`,
          folio: r?.folio ?? `—`,
          cliente: r?.cliente ?? '—',
          categoria: r?.categoria ?? '—',
          piezas: Number.isFinite(+r?.piezas) ? +r.piezas : null,
          total: Number.isFinite(+r?.total) ? +r.total : null,
          fecha: r?.fecha ?? null,
          estado: r?.estado ?? '—',
        }))
        if (alive) setRows(withId)
      } catch (err) {
        console.error('[Reports] fetch error:', err)
        if (alive) setError(err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Reportes
      </Typography>

      {error && (
        <Alert severity="error">
          No se pudieron cargar los datos. {String(error?.message || error)}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 2 }}>
        <div style={{ height: 520, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: 'fecha', sort: 'desc' }] },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 },
                csvOptions: { fileName: 'reporte-ordenes' },
              },
            }}
          />
        </div>
      </Paper>
    </Box>
  )
}
