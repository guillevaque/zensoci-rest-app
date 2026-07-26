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

import FacturasClientesPage from '../pages/facturacion/FacturasClientesPage'
import NuevaFacturaPage     from '../pages/facturacion/NuevaFacturaPage'
import BillingPlaceholder   from '../pages/facturacion/BillingPlaceholder'
// Página de prueba temporal — revertir cuando no se necesite
import FirmadorTestPage from '../pages/facturacion/FirmadorTestPage'

const Guard = ({ route, children }: { route: string; children: React.ReactNode }) => (
  <ProtectedRoute route={route}>{children}</ProtectedRoute>
)

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Prueba temporal Firmador — solo dev, revertir después */}
        <Route path="/firmador-test" element={<FirmadorTestPage />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — requires authentication */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Operación */}
          <Route path="/dashboard"  element={<Guard route="/dashboard"><Dashboard /></Guard>} />
          <Route path="/mesas"      element={<Guard route="/mesas"><GestionMesas /></Guard>} />
          <Route path="/pedidos"    element={<Guard route="/pedidos"><Pedidos /></Guard>} />
          <Route path="/menu"       element={<Guard route="/menu"><GestionMenu /></Guard>} />
          <Route path="/inventario" element={<Guard route="/inventario"><Inventory /></Guard>} />

          {/* Administración */}
          <Route path="/reportes"   element={<Guard route="/reportes"><Reports /></Guard>} />
          <Route path="/costeo"     element={<Guard route="/costeo"><Costeo /></Guard>} />
          <Route path="/personal"   element={<Guard route="/personal"><Personal /></Guard>} />
          <Route path="/ajustes"    element={<Guard route="/ajustes"><Settings /></Guard>} />

          {/* ── Facturación / Contabilidad — Clientes ── */}
          <Route path="/facturacion/clientes/facturas/nueva"
            element={<Guard route="/facturacion/clientes"><NuevaFacturaPage /></Guard>} />
          <Route path="/facturacion/clientes/facturas"
            element={<Guard route="/facturacion/clientes"><FacturasClientesPage /></Guard>} />
          <Route path="/facturacion/clientes/facturas-rectificativas"
            element={<Guard route="/facturacion/clientes"><BillingPlaceholder title="Facturas Rectificativas" /></Guard>} />
          <Route path="/facturacion/clientes/contingencias"
            element={<Guard route="/facturacion/clientes"><BillingPlaceholder title="Contingencias" /></Guard>} />
          <Route path="/facturacion/clientes/pagos"
            element={<Guard route="/facturacion/clientes"><BillingPlaceholder title="Pagos" /></Guard>} />
          <Route path="/facturacion/clientes/productos"
            element={<Guard route="/facturacion/clientes"><BillingPlaceholder title="Productos" /></Guard>} />
          <Route path="/facturacion/clientes/clientes"
            element={<Guard route="/facturacion/clientes"><BillingPlaceholder title="Clientes" /></Guard>} />

          {/* ── Facturación / Contabilidad — Proveedores ── */}
          <Route path="/facturacion/proveedores/facturas"
            element={<Guard route="/facturacion/proveedores"><BillingPlaceholder title="Facturas — Proveedores" /></Guard>} />
          <Route path="/facturacion/proveedores/facturas-rectificativas"
            element={<Guard route="/facturacion/proveedores"><BillingPlaceholder title="Facturas Rectificativas — Proveedores" /></Guard>} />
          <Route path="/facturacion/proveedores/cargar-compras"
            element={<Guard route="/facturacion/proveedores"><BillingPlaceholder title="Cargar Compras con IA" /></Guard>} />
          <Route path="/facturacion/proveedores/pagos"
            element={<Guard route="/facturacion/proveedores"><BillingPlaceholder title="Pagos — Proveedores" /></Guard>} />
          <Route path="/facturacion/proveedores/cuentas-bancarias"
            element={<Guard route="/facturacion/proveedores"><BillingPlaceholder title="Cuentas Bancarias" /></Guard>} />
          <Route path="/facturacion/proveedores/productos"
            element={<Guard route="/facturacion/proveedores"><BillingPlaceholder title="Productos — Proveedores" /></Guard>} />
          <Route path="/facturacion/proveedores/proveedores"
            element={<Guard route="/facturacion/proveedores"><BillingPlaceholder title="Proveedores" /></Guard>} />

          {/* ── Facturación / Contabilidad — Informes ── */}
          <Route path="/facturacion/informes/analisis-facturas"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Análisis de Facturas" /></Guard>} />
          <Route path="/facturacion/informes/invalidacion"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Invalidación" /></Guard>} />
          <Route path="/facturacion/informes/anexo-1"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Anexo 1: Ventas Contribuyentes" /></Guard>} />
          <Route path="/facturacion/informes/anexo-2"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Anexo 2: Ventas Consumidor" /></Guard>} />
          <Route path="/facturacion/informes/anexo-3"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Anexo 3: Compras" /></Guard>} />
          <Route path="/facturacion/informes/anexo-5"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Anexo 5: Sujetos Excluidos" /></Guard>} />
          <Route path="/facturacion/informes/anexo-8"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Anexo 8: Percepción IVA 1% en Compras" /></Guard>} />
          <Route path="/facturacion/informes/anexo-11"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Anexo 11: Anticipo de IVA 2%" /></Guard>} />
          <Route path="/facturacion/informes/anexo-13"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Anexo 13: Documentos Legales Anulados" /></Guard>} />
          <Route path="/facturacion/informes/libro-contribuyentes"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Libro de Contribuyentes" /></Guard>} />
          <Route path="/facturacion/informes/libro-consumidor"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Libro de Consumidor" /></Guard>} />
          <Route path="/facturacion/informes/libro-compras"
            element={<Guard route="/facturacion/informes"><BillingPlaceholder title="Libro de Compras" /></Guard>} />

          {/* Legacy redirect */}
          <Route path="/pos" element={<Navigate to="/pedidos" replace />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
