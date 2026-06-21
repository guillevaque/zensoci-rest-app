import React from 'react'
import { MdAdd, MdRemove, MdDelete, MdPointOfSale } from 'react-icons/md'

type Item = { name: string; price: number; qty: number }
const preset = [
  { name: 'Pupusa vegana', price: 2.5 },
  { name: 'Bowl',          price: 6.9 },
  { name: 'Kombucha',      price: 2.2 },
  { name: 'Café',          price: 1.5 },
]

export const POS: React.FC = () => {
  const [items, setItems] = React.useState<Item[]>([])

  const add = (p: { name: string; price: number }) => {
    setItems(s => {
      const idx = s.findIndex(x => x.name === p.name)
      if (idx >= 0) return s.map((x, i) => i === idx ? { ...x, qty: x.qty + 1 } : x)
      return [...s, { ...p, qty: 1 }]
    })
  }

  const setQty = (i: number, qty: number) => {
    if (qty < 1) { setItems(s => s.filter((_, ix) => ix !== i)); return }
    setItems(s => s.map((x, ix) => ix === i ? { ...x, qty } : x))
  }

  const remove = (i: number) => setItems(s => s.filter((_, ix) => ix !== i))
  const total = items.reduce((a, b) => a + b.price * b.qty, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Punto de Venta</h1>
        <p className="page-subtitle">Registra pedidos y procesa cobros</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Order panel */}
        <section className="md:col-span-2 card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MdPointOfSale size={20} style={{ color: '#3C6030' }} />
            <span className="section-title">Pedido actual</span>
          </div>

          {items.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center py-12 rounded-zs"
              style={{ background: '#F4F7F4', color: '#6B7A69' }}
            >
              <MdPointOfSale size={36} className="mb-2 opacity-30" />
              <p className="text-sm">Selecciona productos del menú</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((it, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-zs"
                  style={{ background: '#F4F7F4' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: '#1C2B1A' }}>{it.name}</div>
                    <div className="text-xs" style={{ color: '#6B7A69' }}>${it.price.toFixed(2)} c/u</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(i, it.qty - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full"
                      style={{ background: '#E2EAE0', color: '#3C6030', padding: 0, borderRadius: '50%' }}
                      aria-label="Menos"
                    >
                      <MdRemove size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{it.qty}</span>
                    <button
                      onClick={() => setQty(i, it.qty + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full"
                      style={{ background: '#D86835', color: '#fff', padding: 0, borderRadius: '50%' }}
                      aria-label="Más"
                    >
                      <MdAdd size={14} />
                    </button>
                  </div>
                  <div className="w-16 text-right font-bold text-sm" style={{ color: '#1C2B1A' }}>
                    ${(it.price * it.qty).toFixed(2)}
                  </div>
                  <button
                    onClick={() => remove(i)}
                    className="w-7 h-7 flex items-center justify-center rounded-full"
                    style={{ background: '#FEE2E2', color: '#DC2626', padding: 0, borderRadius: '50%' }}
                    aria-label="Quitar"
                  >
                    <MdDelete size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Total + actions */}
          <div
            className="rounded-zs p-4 mt-auto"
            style={{ background: '#EEF4EC', border: '1px solid #D6E8D1' }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold" style={{ color: '#3C6030' }}>Total</span>
              <span className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>${total.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => alert('Cobro simulado')}
                className="btn btn-primary flex-1 justify-center"
                disabled={items.length === 0}
              >
                Cobrar
              </button>
              <button
                onClick={() => setItems([])}
                className="btn btn-ghost"
                disabled={items.length === 0}
              >
                Limpiar
              </button>
            </div>
          </div>
        </section>

        {/* Menu panel */}
        <aside className="card">
          <div className="section-title mb-3">Menú</div>
          <div className="grid grid-cols-2 gap-2">
            {preset.map(p => (
              <button
                key={p.name}
                onClick={() => add(p)}
                className="p-3 text-left rounded-zs transition-all"
                style={{
                  background: '#fff',
                  border: '1px solid #E2EAE0',
                  color: 'inherit',
                  borderRadius: '10px',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#D86835'
                  ;(e.currentTarget as HTMLElement).style.background = '#FEF3EE'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#E2EAE0'
                  ;(e.currentTarget as HTMLElement).style.background = '#fff'
                }}
              >
                <div className="font-semibold text-sm" style={{ color: '#1C2B1A' }}>{p.name}</div>
                <div className="text-sm font-bold mt-1" style={{ color: '#D86835' }}>${p.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
