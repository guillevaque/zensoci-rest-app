import React, { useState } from 'react';

type TableStatus = 'free' | 'occupied' | 'needs';
interface Table { id: string; name: string; covers: number; status: TableStatus; server?: string; since?: string; total?: number; }

const TABLES: Table[] = [
  { id:'1',  name:'Mesa 1',  covers:4, status:'occupied', server:'Andrés',  since:'13:45', total:58.40 },
  { id:'2',  name:'Mesa 2',  covers:2, status:'free' },
  { id:'3',  name:'Mesa 3',  covers:6, status:'occupied', server:'Sofía',   since:'14:10', total:124.80 },
  { id:'4',  name:'Mesa 4',  covers:4, status:'needs',    server:'Mesa 4',  since:'12:30', total:98.60 },
  { id:'5',  name:'Mesa 5',  covers:2, status:'free' },
  { id:'6',  name:'Mesa 6',  covers:8, status:'occupied', server:'Marisol', since:'13:20', total:214.30 },
  { id:'7',  name:'Mesa 7',  covers:4, status:'free' },
  { id:'8',  name:'Mesa 8',  covers:6, status:'needs',    server:'Mesa 8',  since:'11:45', total:186.20 },
  { id:'9',  name:'Mesa 9',  covers:2, status:'occupied', server:'Andrés',  since:'14:22', total:32.10 },
  { id:'10', name:'Mesa 10', covers:4, status:'free' },
  { id:'PU', name:'Pickup',  covers:0, status:'occupied', server:'Andrés',  since:'14:28', total:45.20 },
];

const money = (n: number) => `$${n.toFixed(2)}`;

const STATUS_DOT: Record<TableStatus, string> = {
  free: 'var(--zs-acc)', occupied: 'var(--zs-accent2)', needs: 'var(--zs-red)',
};

type Filter = 'all' | TableStatus;

export function GestionMesas() {
  const [filter, setFilter] = useState<Filter>('all');
  const filtered = TABLES.filter(t => filter === 'all' || t.status === filter);

  return (
    <div>
      {/* Filtros – scrollables en móvil */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'all',      label: `Todas (${TABLES.length})` },
          { key: 'free',     label: `Libres (${TABLES.filter(t=>t.status==='free').length})` },
          { key: 'occupied', label: `Ocupadas (${TABLES.filter(t=>t.status==='occupied').length})` },
          { key: 'needs',    label: `Check (${TABLES.filter(t=>t.status==='needs').length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as Filter)}
            style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', background: filter === f.key ? 'var(--zs-green)' : '#fff', color: filter === f.key ? 'var(--zs-paper)' : 'var(--zs-ink)', border: filter === f.key ? '1px solid var(--zs-green)' : '1px solid var(--zs-line-strong)', whiteSpace: 'nowrap' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid – 2 cols móvil, 3 tablet, 4 md, 5 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map(t => (
          <button key={t.id}
            style={{
              background: t.status === 'needs' ? 'rgba(204,72,46,0.06)' : t.status === 'occupied' ? 'var(--zs-cream)' : '#fff',
              border: `1px solid ${t.status === 'free' ? 'rgba(109,151,71,0.4)' : t.status === 'needs' ? 'rgba(204,72,46,0.4)' : 'rgba(216,104,53,0.4)'}`,
              borderRadius: 18, padding: 12, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 5,
              minHeight: 110, position: 'relative', textAlign: 'left',
              transition: 'box-shadow 120ms', width: '100%',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--zs-shadow-2)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ position: 'absolute', top: 10, right: 10, width: 9, height: 9, borderRadius: 999, background: STATUS_DOT[t.status] }} />
            <div>
              <div style={{ fontFamily: 'var(--zs-font-display)', fontSize: 20, color: 'var(--zs-ink)', lineHeight: 1 }}>{t.name}</div>
              {t.covers > 0 && <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)' }}>{t.covers} pers.</div>}
            </div>
            <div style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.status === 'free' ? 'var(--zs-green)' : t.status === 'needs' ? 'var(--zs-red)' : 'var(--zs-accent2)' }}>
              {t.status === 'free' ? 'LIBRE' : t.status === 'needs' ? 'NECESITA CHECK' : t.server}
            </div>
            {t.status !== 'free' && t.since && (
              <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 10, color: 'var(--zs-mute)' }}>Desde {t.since}</div>
            )}
            <div style={{ marginTop: 'auto', fontFamily: 'var(--zs-font-mono)', fontWeight: t.total ? 700 : 400, fontSize: t.total ? 15 : 11, color: t.status === 'needs' ? 'var(--zs-red)' : t.total ? 'var(--zs-ink)' : 'var(--zs-mute)' }}>
              {t.total ? money(t.total) : 'Tocar para abrir'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
