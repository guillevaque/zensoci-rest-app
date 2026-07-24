import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import ProtectedRoute  from '../auth/ProtectedRoute'
import Layout from './Layout'

import Login      from '../pages/Login'
import Dashboard  from '../pages/Dashboard'
import { GestionMesas } from '../pages/GestionMesas'
import Pedidos    from '../pages/Pedidos'
import { GestionMenu }  from '../pages/GestionMenu'
import { Inventory }    from '../pages/Inventory'
import { Reports }      from '../pages/Reports'
import Personal   from '../pages/Personal'
import { Settings }     from '../pages/Settings'
import { Costeo }      from '../pages/Costeo'

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — requires authentication */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Cada ruta protegida por sus permisos dinámicos del servidor */}
          <Route path="/dashboard"  element={<ProtectedRoute route="/dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/mesas"      element={<ProtectedRoute route="/mesas"><GestionMesas /></ProtectedRoute>} />
          <Route path="/pedidos"    element={<ProtectedRoute route="/pedidos"><Pedidos /></ProtectedRoute>} />
          <Route path="/menu"       element={<ProtectedRoute route="/menu"><GestionMenu /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute route="/inventario"><Inventory /></ProtectedRoute>} />
          <Route path="/reportes"   element={<ProtectedRoute route="/reportes"><Reports /></ProtectedRoute>} />
          <Route path="/costeo"     element={<ProtectedRoute route="/costeo"><Costeo /></ProtectedRoute>} />
          <Route path="/personal"   element={<ProtectedRoute route="/personal"><Personal /></ProtectedRoute>} />
          <Route path="/ajustes"    element={<ProtectedRoute route="/ajustes"><Settings /></ProtectedRoute>} />

          {/* Legacy redirect */}
          <Route path="/pos" element={<Navigate to="/pedidos" replace />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
