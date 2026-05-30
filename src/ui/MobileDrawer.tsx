import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdTableBar, MdOutlineInventory2, MdMenuBook,
  MdBarChart, MdPeople, MdSettings, MdLogout, MdReceipt, MdClose,
} from 'react-icons/md';

type Props = { open: boolean; onClose: () => void };

const OPERATION = [
  { to: '/dashboard', icon: <MdDashboard size={18} />,        label: 'Dashboard' },
  { to: '/mesas',     icon: <MdTableBar size={18} />,          label: 'Mesas' },
  { to: '/pedidos',   icon: <MdReceipt size={18} />,           label: 'Pedidos' },
  { to: '/menu',      icon: <MdMenuBook size={18} />,          label: 'Menú' },
  { to: '/inventario',icon: <MdOutlineInventory2 size={18} />, label: 'Inventario' },
];
const ADMIN = [
  { to: '/reportes', icon: <MdBarChart size={18} />, label: 'Reportes' },
  { to: '/personal', icon: <MdPeople size={18} />,   label: 'Personal' },
  { to: '/ajustes',  icon: <MdSettings size={18} />, label: 'Configuración' },
];

const ACTIVE_STYLE = { background: '#D86835', color: '#fff', borderRadius: 10 };
const IDLE_STYLE   = { color: 'rgba(255,255,255,0.72)' };

export default function MobileDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div
        style={{
          position: 'relative', width: 220, height: '100%', background: '#3C6030',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <div>
            <div className="font-black text-white" style={{ fontSize: '1.2rem' }}>ZENSOCI</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>COCINA VEGANA</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MdClose size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Operación</p>
          {OPERATION.map(item => (
            <NavLink
              key={item.to} to={item.to} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={({ isActive }) => isActive ? ACTIVE_STYLE : IDLE_STYLE}
            >
              {item.icon}<span>{item.label}</span>
            </NavLink>
          ))}
          <p className="px-3 pt-5 pb-1 text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Administración</p>
          {ADMIN.map(item => (
            <NavLink
              key={item.to} to={item.to} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={({ isActive }) => isActive ? ACTIVE_STYLE : IDLE_STYLE}
            >
              {item.icon}<span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#D86835', color: '#fff' }}>A</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">Andrés</div>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>Mesero</div>
          </div>
          <button onClick={() => { onClose(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdLogout size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
