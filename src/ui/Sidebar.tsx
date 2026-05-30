import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdTableBar, MdOutlineInventory2, MdMenuBook,
  MdBarChart, MdPeople, MdSettings, MdLogout, MdReceipt,
} from 'react-icons/md';

type SidebarProps = { onNavigate?: () => void };

const OPERATION = [
  { to: '/dashboard', icon: <MdDashboard size={18} />,        label: 'Dashboard' },
  { to: '/mesas',     icon: <MdTableBar size={18} />,          label: 'Mesas' },
  { to: '/pedidos',   icon: <MdReceipt size={18} />,           label: 'Pedidos', badge: 3 },
  { to: '/menu',      icon: <MdMenuBook size={18} />,          label: 'Menú' },
  { to: '/inventario',icon: <MdOutlineInventory2 size={18} />, label: 'Inventario' },
];

const ADMIN = [
  { to: '/reportes',  icon: <MdBarChart size={18} />,  label: 'Reportes' },
  { to: '/personal',  icon: <MdPeople size={18} />,    label: 'Personal' },
  { to: '/ajustes',   icon: <MdSettings size={18} />,  label: 'Configuración' },
];

const LINK_BASE =
  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none';
const LINK_IDLE  = { color: 'rgba(255,255,255,0.72)' };
const LINK_HOVER = '#EEF4EC22';
const LINK_ACTIVE = { background: '#D86835', color: '#fff', borderRadius: 10 };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-3 pt-5 pb-1 text-xs font-bold tracking-widest uppercase select-none"
      style={{ color: 'rgba(255,255,255,0.35)' }}
    >
      {children}
    </p>
  );
}

function NavItem({
  item, onNavigate,
}: {
  item: typeof OPERATION[0] & { badge?: number };
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) => LINK_BASE + (isActive ? '' : ' hover:bg-white/10')}
      style={({ isActive }) => isActive ? LINK_ACTIVE : LINK_IDLE}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span
          className="ml-auto text-xs font-bold rounded-full px-1.5 py-0.5"
          style={{ background: '#D86835', color: '#fff', minWidth: 20, textAlign: 'center' }}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 z-40 h-full"
      style={{ width: 210, background: '#3C6030' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 flex-shrink-0">
        <div className="font-black text-white tracking-tight" style={{ fontSize: '1.25rem' }}>
          ZENSOCI
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em' }}>
          COCINA VEGANA
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto">
        <SectionLabel>Operación</SectionLabel>
        {OPERATION.map(item => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}

        <SectionLabel>Administración</SectionLabel>
        {ADMIN.map(item => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* User footer */}
      <div
        className="flex items-center gap-3 px-3 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: '#D86835', color: '#fff' }}
        >
          A
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">Andrés</div>
          <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>Mesero</div>
        </div>
        <button
          onClick={handleLogout}
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
          aria-label="Cerrar sesión"
        >
          <MdLogout size={16} />
        </button>
      </div>
    </aside>
  );
}
