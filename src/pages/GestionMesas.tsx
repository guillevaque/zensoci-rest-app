import React, { useState } from 'react';
import { MdPeople, MdAdd } from 'react-icons/md';

type TableStatus = 'libre' | 'ocupada' | 'check';

type Mesa = {
  id: number;
  label: string;
  capacity: number;
  status: TableStatus;
  waiter?: string;
  since?: string;
  total?: number;
};

const INITIAL: Mesa[] = [
  { id: 1,  label: 'Mesa 1',   capacity: 2, status: 'ocupada', waiter: 'Andrés',  since: '14:02', total: 24.50 },
  { id: 2,  label: 'Mesa 2',   capacity: 4, status: 'ocupada', waiter: 'Marisol', since: '13:45', total: 58.10 },
  { id: 3,  label: 'Mesa 3',   capacity: 2, status: 'libre' },
  { id: 4,  label: 'Mesa 4',   capacity: 6, status: 'check',   waiter: 'Andrés',  since: '12:50', total: 96.20 },
  { id: 5,  label: 'Mesa 5',   capacity: 2, status: 'libre' },
  { id: 6,  label: 'Mesa 6',   capacity: 4, status: 'ocupada', waiter: 'Sofía',   since: '13:20', total: 41.00 },
  { id: 7,  label: 'Mesa 7',   capacity: 2, status: 'libre' },
  { id: 8,  label: 'Mesa 8',   capacity: 8, status: 'ocupada', waiter: 'Lucía',   since: '13:00', total: 124.80 },
  { id: 9,  label: 'Terraza A',capacity: 2, status: 'libre' },
  { id: 10, label: 'Terraza B',capacity: 4, status: 'ocupada', waiter: 'Sofía',   since: '14:10', total: 36.00 },
  { id: 11, label: 'Pickup',   capacity: 0, status: 'libre' },
];

type Filter = 'todas' | 'libres' | 'ocupadas' | 'check';

const STATUS_BADGE = {
  libre:   { dot: '#22C55E', label: 'LIBRE',          labelColor: '#6B7A69' },
  ocupada: { dot: '#D86835', label: null,              labelColor: '#D86835' },
  check:   { dot: '#EF4444', label: 'NECESITA CHECK', labelColor: '#EF4444' },
};

export function GestionMesas() {
  const [filter, setFilter] = useState<Filter>('todas');
  const [mesas] = useState<Mesa[]>(INITIAL);

  const counts = {
    todas:   mesas.length,
    libres:  mesas.filter(m => m.status === 'libre').length,
    ocupadas:mesas.filter(m => m.status === 'ocupada').length,
    check:   mesas.filter(m => m.status === 'check').length,
  };

  const visible = filter === 'todas' ? mesas
    : filter === 'libres'   ? mesas.filter(m => m.status === 'libre')
    : filter === 'ocupadas' ? mesas.filter(m => m.status === 'ocupada')
    : mesas.filter(m => m.status === 'check');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">MESAS</h1>
          <p className="page-subtitle">Plano de salón · {mesas.length} mesas</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'todas',   label: `Todas (${counts.todas})` },
          { key: 'libres',  label: `Libres (${counts.libres})` },
          { key: 'ocupadas',label: `Ocupadas (${counts.ocupadas})` },
          { key: 'check',   label: `Necesitan check (${counts.check})` },
        ] as { key: Filter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="btn"
            style={filter === f.key
              ? { background: '#3C6030', color: '#fff' }
              : { background: '#fff', color: '#6B7A69', border: '1px solid #E2EAE0' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {visible.map(mesa => {
          const s = STATUS_BADGE[mesa.status];
          return (
            <div
              key={mesa.id}
              className="card"
              style={{
                cursor: 'pointer',
                border: mesa.status === 'check' ? '2px solid #EF4444'
                       : mesa.status === 'ocupada' ? '2px solid #E2EAE0'
                       : '2px solid #E2EAE0',
                transition: 'box-shadow 0.15s, border-color 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
            >
              {/* Status dot */}
              <div
                style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 10, height: 10, borderRadius: '50%', background: s.dot,
                }}
              />

              {/* Title */}
              <div className="font-black" style={{ fontSize: '1rem', color: '#1C2B1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
                {mesa.label}
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#6B7A69' }}>
                <MdPeople size={13} />{mesa.capacity} pers.
              </div>

              {mesa.status === 'libre' ? (
                <div className="text-center py-4">
                  <div className="font-bold text-xs mb-2" style={{ color: '#6B7A69' }}>LIBRE</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>Tocar para abrir</div>
                </div>
              ) : (
                <>
                  <div className="font-bold text-xs uppercase tracking-wide" style={{ color: s.labelColor, marginBottom: 2 }}>
                    {s.label ?? mesa.waiter}
                  </div>
                  {mesa.status === 'check' && (
                    <div className="text-xs" style={{ color: '#6B7A69' }}>{mesa.waiter}</div>
                  )}
                  <div className="text-xs" style={{ color: '#6B7A69', marginTop: 2 }}>Desde {mesa.since}</div>
                  <div className="font-black" style={{ fontSize: '1.1rem', color: '#1C2B1A', marginTop: 8 }}>
                    ${mesa.total?.toFixed(2)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
