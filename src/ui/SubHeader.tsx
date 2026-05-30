import React from 'react';
import { MdSearch, MdOutlineNotifications, MdOutlinePrint, MdMenu } from 'react-icons/md';

type Props = { onToggleMobile?: () => void };

export default function SubHeader({ onToggleMobile }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 md:px-6"
      style={{
        background: '#fff',
        borderBottom: '1px solid #E2EAE0',
        minHeight: 56,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <button
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg"
        style={{ color: '#3C6030', background: '#EEF4EC', border: 'none', cursor: 'pointer' }}
        onClick={onToggleMobile}
        aria-label="Abrir menú"
      >
        <MdMenu size={20} />
      </button>

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative hidden md:block">
          <MdSearch
            size={16}
            style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)', color: '#6B7A69', pointerEvents: 'none',
            }}
          />
          <input
            placeholder="Buscar mesa, pedido, plato…"
            className="input"
            style={{ paddingLeft: 32, width: 260, fontSize: '0.8125rem' }}
          />
        </div>

        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: '#EEF4EC', border: 'none', cursor: 'pointer', color: '#3C6030' }}
          aria-label="Notificaciones"
        >
          <MdOutlineNotifications size={19} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: '#D86835' }}
          />
        </button>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: '#EEF4EC', border: 'none', cursor: 'pointer', color: '#3C6030' }}
          aria-label="Imprimir"
          onClick={() => window.print()}
        >
          <MdOutlinePrint size={19} />
        </button>
      </div>
    </header>
  );
}
