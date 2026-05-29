import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../ui/Layout'

// Páginas
import { Caja } from '../pages/Caja'
import { Inventory } from '../pages/Inventory'
import { Reports } from '../pages/Reports'
import { Settings } from '../pages/Settings'
import { GestionMesas } from '../pages/GestionMesas'
import { GestionMenu } from '../pages/GestionMenu'
import Login from '../pages/Login'

export function App() {
  return (
    <Routes>
      {/* TODAS las páginas con header + sidebar van dentro de Layout */}
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/caja" replace />} />
        <Route path="/caja" element={<Caja />} />
        <Route path="/mesas" element={<GestionMesas />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/menu" element={<GestionMenu />} />
        <Route path="/reportes" element={<Reports />} />
        <Route path="/ajustes" element={<Settings />} />
      </Route>

      {/* Fuera del layout, por ahora el login simple */}
      <Route path="/login" element={<Login />} />

      {/* 404 */}
      <Route path="*" element={<div className="p-6">Página no encontrada</div>} />
    </Routes>
  )
}
