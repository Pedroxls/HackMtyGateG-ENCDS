// src/components/MapChart.jsx
import { useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleOrdinal } from 'd3-scale'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import axios from 'axios'

// Nuevo GeoJSON funcional basado en TopoJSON oficial
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const trendColor = scaleOrdinal()
  .domain(['up', 'down', 'steady'])
  .range(['#2ecc71', '#e74c3c', '#3498db']) // Verde, Rojo, Azul

const trendByCountry = {
  'United States': 'up',
  Mexico: 'steady',
  Brazil: 'down',
  Germany: 'up',
  France: 'steady',
  Japan: 'down',
  Australia: 'up'
}

const nameFix = {
  'United States of America': 'United States'
}

export default function MapChart() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCountryClick = async (rawCountry) => {
    const country = nameFix[rawCountry] || rawCountry
    const trend = trendByCountry[country]

    console.log("🗺️ Click en país:", rawCountry)
    console.log("📌 Usando nombre:", country)
    console.log("📈 Tendencia:", trend)

    setSelectedCountry(country)

    if (!trend) {
      setExplanation("Este país no tiene datos de tendencia disponibles.")
      return
    }

    setExplanation('')
    setLoading(true)

    try {
      const res = await axios.get('http://localhost:8000/trend-explanation', {
        params: { country, trend }
      })
      console.log("✅ Respuesta API:", res.data)
      setExplanation(res.data.explanation)
    } catch (err) {
      console.error("❌ Error al obtener explicación:", err)
      setExplanation('No se pudo obtener una explicación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mt: 2 }}>
      {/* Mapa */}
      <Box sx={{ flex: '1 1 60%', minWidth: 320 }}>
        <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: '100%', height: 'auto' }}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const rawName = geo.properties.name
                const country = nameFix[rawName] || rawName
                const trend = trendByCountry[country] || 'steady'

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={trendColor(trend)}
                    stroke="#FFF"
                    onClick={() => handleCountryClick(rawName)}
                    style={{
                      default: { outline: 'none', cursor: 'pointer' },
                      hover: { fill: '#95a5a6', outline: 'none' },
                      pressed: { fill: '#34495e', outline: 'none' }
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </Box>

      {/* Panel de información */}
      <Paper sx={{ flex: '1 1 35%', p: 3, minWidth: 280 }}>
        <Typography variant="h6" gutterBottom>
          Información del País
        </Typography>

        {selectedCountry ? (
          <>
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedCountry}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Tendencia: {
                trendByCountry[selectedCountry] === 'up' ? 'Alza' :
                trendByCountry[selectedCountry] === 'down' ? 'Baja' : 'Estable'
              }
            </Typography>

            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {explanation}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2">Haz clic en un país para ver detalles.</Typography>
        )}
      </Paper>
    </Box>
  )
}
