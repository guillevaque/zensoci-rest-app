import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../ui/Layout'

import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import { GestionMesas } from '../pages/GestionMesas'
import Pedidos from '../pages/Pedidos'
import { GestionMenu } from '../pages/GestionMenu'
import { Inventory } from '../pages/Inventory'
import { Reports } from '../pages/Reports'
import Personal from '../pages/Personal'
import { Settings } from '../pages/Settings'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/mesas"      element={<GestionMesas />} />
        <Route path="/pedidos"    element={<Pedidos />} />
        <Route path="/menu"       element={<GestionMenu />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/reportes"   element={<Reports />} />
        <Route path="/personal"   element={<Personal />} />
        <Route path="/ajustes"    element={<Settings />} />
        {/* legacy redirect */}
        <Route path="/pos"        element={<Navigate to="/pedidos" replace />} />
      </Route>

      <Route path="*" element={<div className="p-8 text-center" style={{ color: '#6B7A69' }}>Página no encontrada</div>} />
    </Routes>
  )
}
