import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdDashboard, MdTableBar, MdOutlineInventory2, MdMenuBook,
  MdBarChart, MdPeople, MdSettings, MdLogout, MdReceipt, MdClose,
  MdAttachMoney, MdExpandMore,
} from 'react-icons/md';
import { FiTruck, FiUsers, FiLayers } from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS, type AppRole } from '../config/roles';

type Props = { open: boolean; onClose: () => void };

const OPERATION = [
  { to: '/dashboard',  icon: <MdDashboard size={18} />,        label: 'Dashboard' },
  { to: '/menu',       icon: <MdMenuBook size={18} />,          label: 'Menú' },
  { to: '/inventario', icon: <MdOutlineInventory2 size={18} />, label: 'Inventario' },
];
const ADMIN = [
  { to: '/reportes', icon: <MdBarChart size={18} />,    label: 'Reportes' },
  { to: '/costeo',   icon: <MdAttachMoney size={18} />, label: 'Costeo' },
  { to: '/personal', icon: <MdPeople size={18} />,      label: 'Personal' },
  { to: '/ajustes',  icon: <MdSettings size={18} />,    label: 'Configuración' },
];

type NavChild    = { to: string; label: string; group?: string };
type NavGroupDef = { id: string; permRoute: string; icon: React.ReactNode; label: string; children: NavChild[] };

const BILLING: NavGroupDef[] = [
  {
    id: 'clientes',
    permRoute: '/facturacion/clientes',
    icon: <FiUsers size={18} />,
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
    icon: <FiTruck size={18} />,
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
    icon: <FiLayers size={18} />,
    label: 'Informes',
    children: [
      { to: '/facturacion/informes/analisis-facturas',    label: 'Análisis de facturas',           group: 'Administración' },
      { to: '/facturacion/informes/invalidacion',         label: 'Invalidación',                   group: 'Facturación Electrónica' },
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

const ACTIVE_STYLE = { background: '#D86835', color: '#fff', borderRadius: 10 };
const IDLE_STYLE   = { color: 'rgba(255,255,255,0.72)' };
const COLORS       = ['#D86835','#3C6030','#5B8C3A','#C0392B','#2C3E50','#E07B54'];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-3 pt-4 pb-1 text-xs font-bold tracking-widest uppercase"
    style={{ color: 'rgba(255,255,255,0.35)' }}>
    {children}
  </p>
);

function MobileNavGroup({ group, onClose }: { group: NavGroupDef; onClose: () => void }) {
  const location = useLocation();
  const hasActive = group.children.some(c => location.pathname === c.to);
  const [open, setOpen] = useState(hasActive);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [location.pathname]);

  // Build rows with optional section headers
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
      {/* Group trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all"
        style={{
          background: hasActive && !open ? '#D86835' : 'transparent',
          color: hasActive && !open ? '#fff' : 'rgba(255,255,255,0.72)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ flexShrink: 0, display: 'flex', opacity: 0.85 }}>{group.icon}</span>
        <span style={{ flex: 1 }}>{group.label}</span>
        <MdExpandMore
          size={18}
          style={{
            transition: 'transform 0.22s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.55, flexShrink: 0,
          }}
        />
      </button>

      {/* Children — indented, no border line */}
      {open && (
        <div style={{ paddingLeft: 42 }}>
          {rows.map((row, i) => {
            if (row._kind === 'header') {
              return (
                <div key={`h-${row.label}`} style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
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
                onClick={onClose}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all"
                style={({ isActive }) => isActive ? ACTIVE_STYLE : IDLE_STYLE}
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

export default function MobileDrawer({ open, onClose }: Props) {
  const { user, logout, canAccess } = useAuth();
  const role = user?.role as string | undefined;
  const avatarColor = COLORS[(Number((user as any)?.id ?? 0)) % COLORS.length];

  if (!open) return null;

  const visibleOperation = OPERATION.filter(i => canAccess(i.to));
  const visibleAdmin     = ADMIN.filter(i => canAccess(i.to));
  const visibleBilling   = BILLING.filter(g => canAccess(g.permRoute));

  const posChildren: NavChild[] = [
    ...(canAccess('/mesas')   ? [{ to: '/mesas',   label: 'Mesas' }]   : []),
    ...(canAccess('/pedidos') ? [{ to: '/pedidos', label: 'Pedidos' }] : []),
  ];
  const posGroup: NavGroupDef = {
    id: 'punto-de-venta',
    permRoute: '/mesas',
    icon: <MdTableBar size={18} />,
    label: 'Punto de Venta',
    children: posChildren,
  };

  const handleLogout = () => { onClose(); logout(); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'relative', width: 240, height: '100%', background: '#3C6030',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5">
          <div>
            <div className="font-black text-white" style={{ fontSize: '1.2rem' }}>ZENSOCI</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>COCINA VEGANA</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 overflow-y-auto" style={{ paddingBottom: 8 }}>
          <SectionLabel>Operación</SectionLabel>
          {visibleOperation.filter(i => i.to === '/dashboard').map(item => (
            <NavLink
              key={item.to} to={item.to} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={({ isActive }) => isActive ? ACTIVE_STYLE : IDLE_STYLE}
            >
              {item.icon}<span>{item.label}</span>
            </NavLink>
          ))}
          {posChildren.length > 0 && <MobileNavGroup group={posGroup} onClose={onClose} />}
          {visibleOperation.filter(i => i.to !== '/dashboard').map(item => (
            <NavLink
              key={item.to} to={item.to} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={({ isActive }) => isActive ? ACTIVE_STYLE : IDLE_STYLE}
            >
              {item.icon}<span>{item.label}</span>
            </NavLink>
          ))}

          {visibleAdmin.length > 0 && (
            <>
              <SectionLabel>Administración</SectionLabel>
              {visibleAdmin.map(item => (
                <NavLink
                  key={item.to} to={item.to} onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={({ isActive }) => isActive ? ACTIVE_STYLE : IDLE_STYLE}
                >
                  {item.icon}<span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}

          {visibleBilling.length > 0 && (
            <>
              <SectionLabel>Facturación / Contabilidad</SectionLabel>
              {visibleBilling.map(group => (
                <MobileNavGroup key={group.id} group={group} onClose={onClose} />
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="flex items-center gap-3 px-3 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: avatarColor, color: '#fff' }}>
            {(user?.name ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name ?? 'Usuario'}</div>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {ROLE_LABELS[role as AppRole] ?? role ?? ''}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MdLogout size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
