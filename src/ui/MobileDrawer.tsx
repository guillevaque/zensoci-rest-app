import React from 'react'
import type { MenuItem, TabKey } from './Sidebar'

export default function MobileDrawer({
  open, onClose, items, active, onSelect
}:{
  open: boolean
  onClose: () => void
  items: MenuItem[]
  active: TabKey
  onSelect: (k: TabKey) => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">Menú</div>
          <button onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <nav className="space-y-1">
          {items.map(it => (
            <button
              key={it.key}
              onClick={() => { onSelect(it.key); onClose() }}
              className={`w-full text-left px-3 py-2 rounded-lg
                ${active === it.key ? 'bg-[#D86835] text-white' : 'hover:bg-gray-100'}`}
            >
              {it.label}
            </button>
          ))}
        </nav>

        {/* Menú de usuario también aquí */}
        <div className="mt-6 border-t pt-3">
          <div className="text-xs text-gray-500 mb-2">Usuario</div>
          <button
            onClick={() => { document.dispatchEvent(new CustomEvent('app:logout')); onClose() }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-red-600"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  )
}
