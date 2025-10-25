// src/App.jsx
// Define rutas principales de la app.
// Usa DashboardLayout para envolver páginas con Sidebar + Topbar.

import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/dashboardlayout.jsx'
import Dashboard from './pages/dashboard.jsx'
import Reports from './pages/reports.jsx'
import Forecast from './pages/forecast.jsx'
import Settings from './pages/settings.jsx'
import ErrorBoundary from './components/error.jsx'
import { AuthProvider, RequireAuth, useAuth } from './context/authContext.jsx';
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';

// Rutas protegidas: si no hay sesión -> /login
function ProtectedRoutes() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  // Importante: renderizar el layout que a su vez renderiza <Outlet/>
  return <DashboardLayout />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protegidas bajo el layout */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}

