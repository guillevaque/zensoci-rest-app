import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';

const money = (n: number) => `$${n.toFixed(2)}`;

const ORDERS = [
  { id:'#1044', table:'Mesa 3', items:4, time:'12 min', server:'Andrés',  status:'En cocina', total:58.40 },
  { id:'#1043', table:'Mesa 7', items:2, time:'28 min', server:'Marisol', status:'Listo',     total:32.10 },
  { id:'#1042', table:'Mesa 1', items:6, time:'44 min', server:'Sofía',   status:'Pagado',    total:98.60 },
  { id:'#1041', table:'Pickup', items:3, time:'52 min', server:'Andrés',  status:'Pagado',    total:45.20 },
  { id:'#1040', table:'Mesa 8', items:5, time:'1h 5m',  server:'Marisol', status:'Pagado',    total:186.20 },
  { id:'#1039', table:'Mesa 6', items:4, time:'1h 18m', server:'Sofía',   status:'Pagado',    total:124.80 },
];

type Filter = 'Todos'|'En cocina'|'Listos'|'Pagados';
const FILTERS: Filter[] = ['Todos','En cocina','Listos','Pagados'];

const PILL = (status: string) => {
  if (status === 'Listo')     return { bg: 'rgba(109,151,71,0.18)',  color: 'var(--zs-green)' };
  if (status === 'En cocina') return { bg: 'rgba(216,104,53,0.18)', color: 'var(--zs-accent2)' };
  return { bg: 'rgba(109,151,71,0.12)', color: 'var(--zs-green)' };
};

export default function Pedidos() {
  const [filter, setFilter] = useState<Filter>('Todos');
  const filtered = ORDERS.filter(o => {
    if (filter === 'Todos')     return true;
    if (filter === 'En cocina') return o.status === 'En cocina';
    if (filter === 'Listos')    return o.status === 'Listo';
    if (filter === 'Pagados')   return o.status === 'Pagado';
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Header – apilado en móvil */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', background: filter === f ? 'var(--zs-green)' : '#fff', color: filter === f ? 'var(--zs-paper)' : 'var(--zs-ink)', border: filter === f ? '1px solid var(--zs-green)' : '1px solid var(--zs-line-strong)', whiteSpace: 'nowrap' }}>
              {f}
            </button>
          ))}
        </div>
        <button style={{ fontFamily: 'var(--zs-font-display)', background: 'var(--zs-accent2)', color: '#fff', border: 0, padding: '9px 16px', borderRadius: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
          <FiPlus size={16} /> Nuevo pedido
        </button>
      </div>

      {/* Tabla con scroll horizontal en móvil */}
      <div style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 560 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1.6fr 1fr 1fr 1fr 100px', gap: 10, padding: '10px 16px', background: 'var(--zs-cream)', fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--zs-mute)' }}>
              <span>#</span><span>Mesa / pedido</span><span>Mesero</span><span>Estado</span><span>Total</span><span></span>
            </div>
            {filtered.map((o, idx) => {
              const pill = PILL(o.status);
              return (
                <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '56px 1.6fr 1fr 1fr 1fr 100px', gap: 10, padding: '12px 16px', alignItems: 'center', fontFamily: 'var(--zs-font-mono)', fontSize: 13, borderBottom: idx < filtered.length-1 ? '1px solid var(--zs-line)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--zs-font-display)', color: 'var(--zs-accent2)' }}>{o.id}</span>
                  <span><strong>{o.table}</strong> · {o.items} items <span style={{ color: 'var(--zs-mute)' }}>· {o.time}</span></span>
                  <span>{o.server}</span>
                  <span><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pill.bg, color: pill.color }}>{o.status}</span></span>
                  <span style={{ color: 'var(--zs-accent2)', fontWeight: 700 }}>{money(o.total)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--zs-mute)', cursor: 'pointer' }}>Imprimir →</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
