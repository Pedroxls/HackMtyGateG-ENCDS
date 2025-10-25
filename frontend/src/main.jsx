// src/main.jsx
// Punto de entrada: monta la App y activa el Router de React.

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter provee navegación SPA */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
