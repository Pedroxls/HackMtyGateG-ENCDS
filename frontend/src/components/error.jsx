// src/components/ErrorBoundary.jsx
import { Component } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Puedes enviar a un logger externo aquí si quieres
    console.error('[ErrorBoundary] error:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Algo salió mal en esta vista
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {String(this.state.error?.message || this.state.error || 'Error desconocido')}
            </Typography>
            <Button variant="contained" onClick={this.handleRetry}>Reintentar</Button>
          </Paper>
        </Box>
      )
    }
    return this.props.children
  }
}
