import React, { useState } from 'react';
import { FiUserPlus } from 'react-icons/fi';

const COLORS = ['#D86835','#3C6030','#5B8C3A','#C0392B','#2C3E50','#E07B54'];
const STAFF = [
  { id:1, name:'Andrés García',  role:'Mesero',  status:'En turno', shift:'10:00 – 18:00', color:'#D86835' },
  { id:2, name:'Marisol Torres', role:'Cajera',  status:'En turno', shift:'09:00 – 17:00', color:'#3C6030' },
  { id:3, name:'Carlos Medina',  role:'Cocina',  status:'En turno', shift:'08:00 – 16:00', color:'#5B8C3A' },
  { id:4, name:'Lucía Ramírez',  role:'Mesera',  status:'Libre',    shift:'–',              color:'#C0392B' },
  { id:5, name:'Pablo Vásquez',  role:'Manager', status:'En turno', shift:'09:00 – 21:00', color:'#2C3E50' },
  { id:6, name:'Sofía Jiménez',  role:'Mesera',  status:'En turno', shift:'14:00 – 22:00', color:'#E07B54' },
];

type Filter = 'Todos'|'Meseros'|'Cocina'|'Admin';

export default function Personal() {
  const [filter, setFilter] = useState<Filter>('Todos');
  const filtered = STAFF.filter(s => {
    if (filter === 'Meseros') return s.role === 'Mesero' || s.role === 'Mesera';
    if (filter === 'Cocina')  return s.role === 'Cocina';
    if (filter === 'Admin')   return s.role === 'Manager';
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Header – apilado en móvil */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['Todos','Meseros','Cocina','Admin'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', background: filter === f ? 'var(--zs-green)' : '#fff', color: filter === f ? 'var(--zs-paper)' : 'var(--zs-ink)', border: filter === f ? '1px solid var(--zs-green)' : '1px solid var(--zs-line-strong)', whiteSpace: 'nowrap' }}>
              {f}
            </button>
          ))}
        </div>
        <button style={{ fontFamily: 'var(--zs-font-display)', background: 'var(--zs-accent2)', color: '#fff', border: 0, padding: '9px 16px', borderRadius: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
          <FiUserPlus size={16} /> Agregar persona
        </button>
      </div>

      {/* Tabla con scroll horizontal en móvil */}
      <div style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 560 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1.6fr 1fr 1fr 1fr 80px', gap: 10, padding: '10px 16px', background: 'var(--zs-cream)', fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--zs-mute)' }}>
              <span></span><span>Nombre</span><span>Rol</span><span>Estado</span><span>Turno</span><span></span>
            </div>
            {filtered.map((s, idx) => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '56px 1.6fr 1fr 1fr 1fr 80px', gap: 10, padding: '12px 16px', alignItems: 'center', fontFamily: 'var(--zs-font-mono)', fontSize: 13, borderBottom: idx < filtered.length-1 ? '1px solid var(--zs-line)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 999, background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--zs-font-display)', fontSize: 16 }}>
                  {s.name[0]}
                </div>
                <span><strong>{s.name}</strong></span>
                <span style={{ color: 'var(--zs-mute)' }}>{s.role}</span>
                <span>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.status === 'En turno' ? 'rgba(109,151,71,0.18)' : 'rgba(110,102,96,0.12)', color: s.status === 'En turno' ? 'var(--zs-green)' : 'var(--zs-mute)' }}>
                    {s.status}
                  </span>
                </span>
                <span style={{ color: 'var(--zs-mute)' }}>{s.shift}</span>
                <span style={{ textAlign: 'right', color: 'var(--zs-mute)', cursor: 'pointer' }}>Ver →</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
