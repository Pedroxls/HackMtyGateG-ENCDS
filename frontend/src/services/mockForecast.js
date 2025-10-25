// src/services/mockForecast.js
// Generador de datos "dummy" para la vista de Predicción.
export function generateDemand({ days = 30, category = 'General' }) {
  const today = new Date()
  const labels = []
  const data = []
  let base = category === 'Electrónica' ? 130
           : category === 'Refacciones' ? 90
           : category === 'Ferretería'  ? 70
           : 100

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('es-MX'))

    // pequeña estacionalidad + ruido
    const season = 10 * Math.sin((2 * Math.PI * (days - i)) / 14)
    const noise = Math.random() * 12 - 6
    base += Math.random() * 4 - 2 // deriva suave
    data.push(Math.max(0, Math.round(base + season + noise)))
  }

  return { labels, data }
}
