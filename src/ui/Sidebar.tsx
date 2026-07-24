import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiGrid, FiCoffee, FiFileText, FiBookOpen, FiPackage,
  FiBarChart2, FiUsers, FiSettings, FiLogOut, FiDollarSign,
  FiChevronDown, FiTruck, FiLayers,
} from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS, type AppRole } from '../config/roles';

type SidebarProps = { onNavigate?: () => void };

// ── Flat nav items ────────────────────────────────────────────────────
type FlatItem = { to: string; icon: React.ReactNode; label: string; badge?: number };

const NAV: FlatItem[] = [
  { to: '/dashboard',  icon: React.createElement(FiGrid,     { size: 18 }), label: 'Dashboard' },
  { to: '/mesas',      icon: React.createElement(FiCoffee,   { size: 18 }), label: 'Mesas' },
  { to: '/pedidos',    icon: React.createElement(FiFileText, { size: 18 }), label: 'Pedidos', badge: 3 },
  { to: '/menu',       icon: React.createElement(FiBookOpen, { size: 18 }), label: 'Menú' },
  { to: '/inventario', icon: React.createElement(FiPackage,  { size: 18 }), label: 'Inventario' },
];
const ADMIN: FlatItem[] = [
  { to: '/reportes', icon: React.createElement(FiBarChart2,  { size: 18 }), label: 'Reportes' },
  { to: '/costeo',   icon: React.createElement(FiDollarSign, { size: 18 }), label: 'Costeo' },
  { to: '/personal', icon: React.createElement(FiUsers,      { size: 18 }), label: 'Personal' },
  { to: '/ajustes',  icon: React.createElement(FiSettings,   { size: 18 }), label: 'Configuración' },
];

// ── Collapsible group nav items ───────────────────────────────────────
type NavChild    = { to: string; label: string; group?: string };
type NavGroupDef = { id: string; permRoute: string; icon: React.ReactNode; label: string; children: NavChild[] };

const BILLING: NavGroupDef[] = [
  {
    id: 'clientes',
    permRoute: '/facturacion/clientes',
    icon: React.createElement(FiUsers, { size: 18 }),
    label: 'Clientes',
    children: [
      { to: '/facturacion/clientes/facturas',                label: 'Facturas' },
      { to: '/facturacion/clientes/facturas-rectificativas', label: 'Facturas rectificativas' },
      { to: '/facturacion/clientes/contingencias',           label: 'Contingencias' },
      { to: '/facturacion/clientes/pagos',                   label: 'Pagos' },
      { to: '/facturacion/clientes/productos',               label: 'Productos' },
      { to: '/facturacion/clientes/clientes',                label: 'Clientes' },
    ],
  },
  {
    id: 'proveedores',
    permRoute: '/facturacion/proveedores',
    icon: React.createElement(FiTruck, { size: 18 }),
    label: 'Proveedores',
    children: [
      { to: '/facturacion/proveedores/facturas',                label: 'Facturas' },
      { to: '/facturacion/proveedores/facturas-rectificativas', label: 'Facturas rectificativas' },
      { to: '/facturacion/proveedores/cargar-compras',          label: 'Cargar compras con IA' },
      { to: '/facturacion/proveedores/pagos',                   label: 'Pagos' },
      { to: '/facturacion/proveedores/cuentas-bancarias',       label: 'Cuentas bancarias' },
      { to: '/facturacion/proveedores/productos',               label: 'Productos' },
      { to: '/facturacion/proveedores/proveedores',             label: 'Proveedores' },
    ],
  },
  {
    id: 'informes',
    permRoute: '/facturacion/informes',
    icon: React.createElement(FiLayers, { size: 18 }),
    label: 'Informes',
    children: [
      { to: '/facturacion/informes/analisis-facturas',    label: 'Análisis de facturas',          group: 'Administración' },
      { to: '/facturacion/informes/invalidacion',         label: 'Invalidación',                  group: 'Facturación Electrónica' },
      { to: '/facturacion/informes/anexo-1',              label: 'Anexo 1: Ventas contribuyentes', group: 'Anexos' },
      { to: '/facturacion/informes/anexo-2',              label: 'Anexo 2: Ventas consumidor',     group: 'Anexos' },
      { to: '/facturacion/informes/anexo-3',              label: 'Anexo 3: Compras',               group: 'Anexos' },
      { to: '/facturacion/informes/anexo-5',              label: 'Anexo 5: Sujetos Excluidos',     group: 'Anexos' },
      { to: '/facturacion/informes/anexo-8',              label: 'Anexo 8: Percepción IVA 1%',     group: 'Anexos' },
      { to: '/facturacion/informes/anexo-11',             label: 'Anexo 11: Anticipo IVA 2%',      group: 'Anexos' },
      { to: '/facturacion/informes/anexo-13',             label: 'Anexo 13: Docs anulados',        group: 'Anexos' },
      { to: '/facturacion/informes/libro-contribuyentes', label: 'Libro de Contribuyentes',        group: 'Libros' },
      { to: '/facturacion/informes/libro-consumidor',     label: 'Libro de Consumidor',            group: 'Libros' },
      { to: '/facturacion/informes/libro-compras',        label: 'Libro de Compras',               group: 'Libros' },
    ],
  },
];

// ── Shared styles ─────────────────────────────────────────────────────
const SECTION: React.CSSProperties = {
  fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.16em', textTransform: 'uppercase',
  opacity: 0.55, padding: '14px 12px 6px', color: 'var(--zs-paper)',
};
const COLORS = ['#D86835','#3C6030','#5B8C3A','#C0392B','#2C3E50','#E07B54'];

// ── Flat nav item ─────────────────────────────────────────────────────
function NavItem({ item, onNavigate }: { item: FlatItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 12px', borderRadius: 12,
        background: isActive ? 'var(--zs-accent2)' : 'transparent',
        color: 'var(--zs-paper)',
        fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 14,
        textDecoration: 'none',
      })}
      className={({ isActive }) => isActive ? '' : 'hover:bg-white/[0.08]'}
    >
      <span style={{ opacity: 0.85, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {(item.badge ?? 0) > 0 && (
        <span style={{
          background: 'rgba(255,255,255,0.2)', color: '#fff',
          fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10,
          padding: '2px 7px', borderRadius: 999,
        }}>
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

// ── Collapsible group item ────────────────────────────────────────────
function NavGroup({ group, onNavigate }: { group: NavGroupDef; onNavigate?: () => void }) {
  const location = useLocation();
  const hasActive = group.children.some(c => location.pathname === c.to);
  const [open, setOpen] = useState(hasActive);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [location.pathname]);

  // Build flat list with injected section headers
  type Header = { _kind: 'header'; label: string };
  type Row    = NavChild & { _kind: 'child' };
  const rows: Array<Header | Row> = [];
  let lastGroup = '';
  for (const child of group.children) {
    if (child.group && child.group !== lastGroup) {
      rows.push({ _kind: 'header', label: child.group });
      lastGroup = child.group;
    }
    rows.push({ ...child, _kind: 'child' });
  }

  return (
    <div>
      {/* Group trigger — looks like a NavItem but is a button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={hasActive && !open ? '' : 'hover:bg-white/[0.08]'}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 12px', borderRadius: 12, width: '100%',
          background: hasActive && !open ? 'var(--zs-accent2)' : 'transparent',
          color: 'var(--zs-paper)',
          fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 14,
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ opacity: 0.85, flexShrink: 0, display: 'flex' }}>{group.icon}</span>
        <span style={{ flex: 1 }}>{group.label}</span>
        <span style={{
          display: 'flex', opacity: 0.55,
          transition: 'transform 0.22s ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          {React.createElement(FiChevronDown, { size: 14 })}
        </span>
      </button>

      {/* Children — indented, no border line */}
      {open && (
        <div style={{ paddingLeft: 42, paddingBottom: 4 }}>
          {rows.map((row, i) => {
            if (row._kind === 'header') {
              return (
                <div key={`h-${row.label}`} style={{
                  fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 9,
                  letterSpacing: '0.13em', textTransform: 'uppercase',
                  color: 'var(--zs-paper)', opacity: 0.4,
                  padding: i === 0 ? '6px 8px 2px' : '10px 8px 2px',
                }}>
                  {row.label}
                </div>
              );
            }
            return (
              <NavLink
                key={row.to}
                to={row.to}
                onClick={onNavigate}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '7px 8px', borderRadius: 8,
                  background: isActive ? 'var(--zs-accent2)' : 'transparent',
                  color: isActive ? 'var(--zs-paper)' : 'rgba(255,255,255,0.72)',
                  fontFamily: 'var(--zs-font-mono)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13, textDecoration: 'none',
                  transition: 'background 0.12s',
                })}
                className={({ isActive }) => isActive ? '' : 'hover:bg-white/[0.08]'}
              >
                {row.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────
export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout, canAccess } = useAuth();
  const role = user?.role as string | undefined;
  const avatarColor = COLORS[(Number((user as any)?.id ?? 0)) % COLORS.length];

  const visibleNav     = NAV.filter(i => canAccess(i.to));
  const visibleAdmin   = ADMIN.filter(i => canAccess(i.to));
  const visibleBilling = BILLING.filter(g => canAccess(g.permRoute));

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 z-40 h-full"
      style={{ width: 220, background: 'var(--zs-green)', padding: '18px 14px' }}
    >
      {/* Logo */}
      <div style={{ padding: '4px 8px 14px' }}>
        <img
          src="/assets/logo-horizontal-paper-tagline.png"
          alt="Zensoci"
          style={{ height: 42, objectFit: 'contain' }}
        />
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
        <div style={SECTION}>Operación</div>
        {visibleNav.map(i => <NavItem key={i.to} item={i} onNavigate={onNavigate} />)}

        {visibleAdmin.length > 0 && (
          <>
            <div style={SECTION}>Administración</div>
            {visibleAdmin.map(i => <NavItem key={i.to} item={i} onNavigate={onNavigate} />)}
          </>
        )}

        {visibleBilling.length > 0 && (
          <>
            <div style={SECTION}>Facturación / Contabilidad</div>
            {visibleBilling.map(g => (
              <NavGroup key={g.id} group={g} onNavigate={onNavigate} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: 14,
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 999, background: avatarColor,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--zs-font-display)', fontSize: 16, flexShrink: 0,
        }}>
          {(user?.name ?? 'U')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13,
            color: 'var(--zs-paper)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.name ?? 'Usuario'}
          </div>
          <div style={{
            fontFamily: 'var(--zs-font-mono)', fontSize: 11,
            opacity: 0.7, color: 'var(--zs-paper)', textTransform: 'capitalize',
          }}>
            {ROLE_LABELS[role as AppRole] ?? role ?? ''}
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            background: 'transparent', border: 0, color: 'var(--zs-paper)',
            cursor: 'pointer', opacity: 0.7, padding: 4, display: 'flex',
          }}
          aria-label="Cerrar sesión"
        >
          {React.createElement(FiLogOut, { size: 18 })}
        </button>
      </div>
    </aside>
  );
}
