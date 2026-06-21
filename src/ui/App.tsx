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

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — all require auth */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index                element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/mesas"        element={<GestionMesas />} />
          <Route path="/pedidos"      element={<Pedidos />} />
          <Route path="/menu"         element={<GestionMenu />} />
          <Route path="/inventario"   element={<Inventory />} />
          <Route path="/reportes"     element={<Reports />} />
          <Route path="/personal"     element={<Personal />} />
          <Route path="/ajustes"      element={<Settings />} />

          {/* Legacy redirect */}
          <Route path="/pos"          element={<Navigate to="/pedidos" replace />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
