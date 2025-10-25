// src/services/mockReports.js
// Datos simulados para la página de Reportes.
// En producción, cambia estas funciones por fetch/axios a tu backend.

export async function fetchOrders() {
  // Simulamos latencia de red ligera
  await new Promise(r => setTimeout(r, 250))

  // Datos de ejemplo: id es obligatorio en DataGrid
  return [
    { id: 1, folio: 'A-1001', cliente: 'Acme S.A.', categoria: 'Electrónica', piezas: 12, total: 52300, fecha: '2025-10-10', estado: 'Entregada' },
    { id: 2, folio: 'A-1002', cliente: 'LogiMex',   categoria: 'Refacciones', piezas: 7,  total: 18150, fecha: '2025-10-11', estado: 'En ruta' },
    { id: 3, folio: 'A-1003', cliente: 'Novatech',  categoria: 'Electrónica', piezas: 3,  total:  7200, fecha: '2025-10-12', estado: 'Pendiente' },
    { id: 4, folio: 'A-1004', cliente: 'FerrePlus', categoria: 'Ferretería',  piezas: 26, total: 39480, fecha: '2025-10-13', estado: 'Entregada' },
    { id: 5, folio: 'A-1005', cliente: 'Acme S.A.', categoria: 'Electrónica', piezas: 4,  total:  9600, fecha: '2025-10-14', estado: 'Cancelada' },
  ]
}
