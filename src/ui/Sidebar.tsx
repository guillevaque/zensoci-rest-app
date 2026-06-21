import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid, FiCoffee, FiFileText, FiBookOpen, FiPackage,
  FiBarChart2, FiUsers, FiSettings, FiLogOut,
} from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';

type SidebarProps = { onNavigate?: () => void };

const NAV = [
  { to: '/dashboard',  icon: React.createElement(FiGrid,     { size: 18 }), label: 'Dashboard' },
  { to: '/mesas',      icon: React.createElement(FiCoffee,   { size: 18 }), label: 'Mesas' },
  { to: '/pedidos',    icon: React.createElement(FiFileText, { size: 18 }), label: 'Pedidos', badge: 3 },
  { to: '/menu',       icon: React.createElement(FiBookOpen, { size: 18 }), label: 'Menú' },
  { to: '/inventario', icon: React.createElement(FiPackage,  { size: 18 }), label: 'Inventario' },
];
const ADMIN = [
  { to: '/reportes', icon: React.createElement(FiBarChart2, { size: 18 }), label: 'Reportes' },
  { to: '/personal', icon: React.createElement(FiUsers,     { size: 18 }), label: 'Personal' },
  { to: '/ajustes',  icon: React.createElement(FiSettings,  { size: 18 }), label: 'Configuración' },
];

const SECTION: React.CSSProperties = {
  fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.16em', textTransform: 'uppercase',
  opacity: 0.55, padding: '14px 12px 6px', color: 'var(--zs-paper)',
};

const COLORS = ['#D86835','#3C6030','#5B8C3A','#C0392B','#2C3E50','#E07B54'];

function NavItem({ item, onNavigate }: { item: (typeof NAV)[0] & { badge?: number }; onNavigate?: () => void }) {
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
        <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10, padding: '2px 7px', borderRadius: 999 }}>
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const avatarColor = COLORS[(Number((user as any)?.id ?? 0)) % COLORS.length];

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 z-40 h-full"
      style={{ width: 220, background: 'var(--zs-green)', padding: '18px 14px' }}>

      <div style={{ padding: '4px 8px 14px' }}>
        <img src="/assets/logo-horizontal-paper-tagline.png" alt="Zensoci" style={{ height: 42, objectFit: 'contain' }} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={SECTION}>Operación</div>
        {NAV.map(i => <NavItem key={i.to} item={i} onNavigate={onNavigate} />)}
        <div style={SECTION}>Administración</div>
        {ADMIN.map(i => <NavItem key={i.to} item={i} onNavigate={onNavigate} />)}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--zs-font-display)', fontSize: 16, flexShrink: 0 }}>
          {(user?.name ?? 'U')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--zs-paper)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name ?? 'Usuario'}
          </div>
          <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, opacity: 0.7, color: 'var(--zs-paper)', textTransform: 'capitalize' }}>
            {user?.role ?? ''}
          </div>
        </div>
        <button onClick={logout}
          style={{ background: 'transparent', border: 0, color: 'var(--zs-paper)', cursor: 'pointer', opacity: 0.7, padding: 4, display: 'flex' }}
          aria-label="Cerrar sesión">
          {React.createElement(FiLogOut, { size: 18 })}
        </button>
      </div>
    </aside>
  );
}
