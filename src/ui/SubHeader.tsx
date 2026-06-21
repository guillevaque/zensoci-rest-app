import React from 'react';
import { FiSearch, FiBell, FiPrinter, FiMenu } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

type Props = { onToggleMobile?: () => void };

const TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/mesas':      'Mesas',
  '/pedidos':    'Pedidos',
  '/menu':       'Menú',
  '/inventario': 'Inventario',
  '/reportes':   'Reportes',
  '/personal':   'Personal',
  '/ajustes':    'Configuración',
};

export default function SubHeader({ onToggleMobile }: Props) {
  const location = useLocation();
  const title = TITLES[location.pathname] ?? 'Zensoci POS';

  return (
    <header style={{
      background: 'var(--zs-cream)',
      borderBottom: '1px solid var(--zs-line)',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          className="md:hidden"
          style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--zs-green)', display: 'flex', padding: 4 }}
          onClick={onToggleMobile}
          aria-label="Abrir menú"
        >
          {React.createElement(FiMenu, { size: 22 })}
        </button>
        <h1 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 22, color: 'var(--zs-green)', margin: 0, lineHeight: 1 }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Barra de búsqueda – oculta en móvil */}
        <div className="hidden md:inline-flex" style={{
          alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 999,
          padding: '7px 14px', minWidth: 200,
          fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)',
        }}>
          {React.createElement(FiSearch, { size: 14 })}
          Buscar mesa, pedido, plato…
        </div>

        <button
          style={{ width: 36, height: 36, borderRadius: 999, background: '#fff', border: '1px solid var(--zs-line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}
          aria-label="Notificaciones"
        >
          {React.createElement(FiBell, { size: 18, color: 'var(--zs-ink)' })}
          <span style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, background: 'var(--zs-accent2)', borderRadius: 999, border: '1.5px solid #fff' }} />
        </button>

        {/* Imprimir – oculto en móvil */}
        <button
          className="hidden md:flex"
          style={{ width: 36, height: 36, borderRadius: 999, background: '#fff', border: '1px solid var(--zs-line)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          aria-label="Imprimir"
          onClick={() => window.print()}
        >
          {React.createElement(FiPrinter, { size: 18, color: 'var(--zs-ink)' })}
        </button>
      </div>
    </header>
  );
}
