import React, { useState } from 'react';
import { FiDollarSign, FiPercent, FiTrendingUp, FiCreditCard, FiDownload } from 'react-icons/fi';

const money = (n: number) => `$${n.toFixed(2)}`;
type Period = 'Hoy'|'Esta semana'|'Mes'|'Año';

export function Reports() {
  const [period, setPeriod] = useState<Period>('Hoy');
  return (
    <div className="space-y-3">
      {/* Header – apilado en móvil */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['Hoy','Esta semana','Mes','Año'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', background: period === p ? 'var(--zs-green)' : '#fff', color: period === p ? 'var(--zs-paper)' : 'var(--zs-ink)', border: period === p ? '1px solid var(--zs-green)' : '1px solid var(--zs-line-strong)', whiteSpace: 'nowrap' }}>
              {p}
            </button>
          ))}
        </div>
        <button style={{ fontFamily: 'var(--zs-font-display)', background: 'var(--zs-accent2)', color: '#fff', border: 0, padding: '9px 16px', borderRadius: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
          <FiDownload size={16} /> Exportar CSV
        </button>
      </div>

      {/* Stat cards – 2 columnas en móvil, 4 en desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <FiDollarSign size={18}/>, label:'Ventas brutas',        value: money(612.40), delta:'+12%',              up:true },
          { icon: <FiPercent size={18}/>,    label:'Impuestos',            value: money(79.61),  delta:'13% del subtotal',  up:null },
          { icon: <FiTrendingUp size={18}/>, label:'Propinas',             value: money(94.20),  delta:'+8%',               up:true },
          { icon: <FiCreditCard size={18}/>, label:'Tarjeta vs. efectivo', value:'68 / 32%',     delta:'predomina tarjeta', up:null },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 10, background: 'var(--zs-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--zs-accent2)' }}>{s.icon}</div>
            <span style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--zs-mute)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--zs-font-display)', fontSize: 28, lineHeight: 1, color: 'var(--zs-ink)' }}>{s.value}</span>
            <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: s.up === true ? 'var(--zs-green)' : s.up === false ? 'var(--zs-red)' : 'var(--zs-mute)' }}>{s.delta}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--zs-mute)' }}>
        <img src="/assets/illustrations/sun.png" alt="" style={{ width: 140, margin: '0 auto 12px', display: 'block', opacity: 0.85 }} onError={e => { e.currentTarget.style.display='none'; }} />
        <h2 style={{ fontFamily: 'var(--zs-font-display)', color: 'var(--zs-green)', fontSize: 24, margin: 0 }}>Más reportes próximamente</h2>
        <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, margin: '8px 0 0' }}>Productividad por mesero, hora-pico, comparativas semanales y desperdicio.</p>
      </div>
    </div>
  );
}
