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

const MANAGER            = ['manager']             as const;
const MANAGER_CONTADOR   = ['manager', 'contador'] as const;

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
          <Route index                element={<Navigate to="/dashboard" replace />} />

          {/* Accessible to all authenticated roles */}
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/mesas"        element={<GestionMesas />} />
          <Route path="/pedidos"      element={<Pedidos />} />
          <Route path="/menu"         element={<GestionMenu />} />

          {/* Manager + Contador */}
          <Route path="/inventario"   element={<ProtectedRoute roles={MANAGER_CONTADOR}><Inventory /></ProtectedRoute>} />
          <Route path="/reportes"     element={<ProtectedRoute roles={MANAGER_CONTADOR}><Reports /></ProtectedRoute>} />
          <Route path="/costeo"       element={<ProtectedRoute roles={MANAGER_CONTADOR}><Costeo /></ProtectedRoute>} />

          {/* Manager only */}
          <Route path="/personal"     element={<ProtectedRoute roles={MANAGER}><Personal /></ProtectedRoute>} />
          <Route path="/ajustes"      element={<ProtectedRoute roles={MANAGER}><Settings /></ProtectedRoute>} />

          {/* Legacy redirect */}
          <Route path="/pos"          element={<Navigate to="/pedidos" replace />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
