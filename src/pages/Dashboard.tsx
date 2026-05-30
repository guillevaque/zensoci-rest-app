import React, { useState } from 'react';
import { MdAttachMoney, MdReceipt, MdTableBar, MdTrendingUp, MdTrendingDown } from 'react-icons/md';

const HOUR_DATA = [
  { h: 10, v: 12 }, { h: 11, v: 28 }, { h: 12, v: 45 }, { h: 13, v: 52 },
  { h: 14, v: 68 }, { h: 15, v: 90 }, { h: 16, v: 112 }, { h: 17, v: 134 },
  { h: 18, v: 145 }, { h: 19, v: 138 }, { h: 20, v: 118 }, { h: 21, v: 85 },
  { h: 22, v: 52 }, { h: 23, v: 30 },
];
const CURRENT_HOUR = new Date().getHours();
const MAX_V = Math.max(...HOUR_DATA.map(d => d.v));

const TOP_ITEMS = [
  { name: 'Hummus clásico',     count: 38, max: 38 },
  { name: 'Curry in a hurry',   count: 29, max: 38 },
  { name: 'Hummus remolacha',   count: 22, max: 38 },
  { name: 'Hummus de pesto',    count: 17, max: 38 },
  { name: 'Baba ganoush',       count: 11, max: 38 },
];

const RECENT_ORDERS = [
  { id: 1042, table: 'Mesa 2', items: 6,  ago: '2 min',  waiter: 'Marisol', status: 'En cocina', total: 58.10 },
  { id: 1041, table: 'Pickup', items: 2,  ago: '5 min',  waiter: 'Andrés',  status: 'Listo',     total: 17.00 },
  { id: 1040, table: 'Mesa 8', items: 9,  ago: '12 min', waiter: 'Lucía',   status: 'Servido',   total: 124.80 },
];

const ACTIVITY = [
  { icon: '💳', text: 'Marisol cobró $58.10', sub: 'Mesa 2 · tarjeta',      ago: '2 min' },
  { icon: '🍽', text: 'Andrés envió pedido a cocina', sub: 'Mesa 1 · 3 items', ago: '5 min' },
  { icon: '➕', text: 'Carlos abrió Mesa 6',  sub: 'Sofía · 4 pers.',       ago: '8 min' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'En cocina': { bg: '#FEF3EE', color: '#D86835' },
  'Listo':     { bg: '#DCFCE7', color: '#166534' },
  'Servido':   { bg: '#DBE4FF', color: '#3451B2' },
  'Pagado':    { bg: '#F3F4F6', color: '#6B7280' },
};

export default function Dashboard() {
  const [period, setPeriod] = useState<'hoy'|'semana'|'mes'>('hoy');
  const today = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#D86835' }}>
            Hoy · {today}
          </p>
          <h1 className="page-title mt-1">Buen turno, Andrés.</h1>
        </div>
        <div className="flex gap-2">
          {(['hoy','semana','mes'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="btn"
              style={period === p
                ? { background: '#3C6030', color: '#fff' }
                : { background: '#fff', color: '#6B7A69', border: '1px solid #E2EAE0' }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ventas hoy', value: '$612.40', delta: '+12% vs. ayer', up: true,  icon: <MdAttachMoney size={22} style={{ color: '#D86835' }} /> },
          { label: 'Pedidos',    value: '42',       delta: '+5 vs. ayer',  up: true,  icon: <MdReceipt size={22} style={{ color: '#D86835' }} /> },
          { label: 'Mesas ocupadas', value: '5/10', delta: '3 esperan check', up: null, icon: <MdTableBar size={22} style={{ color: '#D86835' }} /> },
          { label: 'Ticket promedio', value: '$14.58', delta: '-$0.40 vs. ayer', up: false, icon: <MdTrendingUp size={22} style={{ color: '#D86835' }} /> },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7A69' }}>{s.label}</span>
              {s.icon}
            </div>
            <div className="font-black" style={{ fontSize: '1.75rem', color: '#1C2B1A', lineHeight: 1 }}>{s.value}</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: s.up === true ? '#16A34A' : s.up === false ? '#DC2626' : '#6B7A69' }}>
              {s.up === true && <MdTrendingUp size={14} />}
              {s.up === false && <MdTrendingDown size={14} />}
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>
              Ventas por hora
            </h2>
            <span className="text-xs" style={{ color: '#6B7A69' }}>Apertura 10:00 · ahora {CURRENT_HOUR}:00</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
            {HOUR_DATA.map(d => {
              const isNow = d.h === CURRENT_HOUR;
              const h = Math.round((d.v / MAX_V) * 130);
              return (
                <div key={d.h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: '100%', height: h,
                      background: isNow ? '#3C6030' : '#F6A870',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                  <span style={{ fontSize: '0.6rem', color: '#9CA3AF' }}>{d.h}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Más vendidos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>
              Más vendidos
            </h2>
            <span className="text-xs badge badge-green">Hoy</span>
          </div>
          <div className="space-y-3">
            {TOP_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold w-4" style={{ color: '#D86835' }}>{i + 1}</span>
                <span className="flex-1 text-sm font-medium truncate" style={{ color: '#1C2B1A' }}>{item.name}</span>
                <div style={{ width: 80, height: 6, background: '#F3F4F6', borderRadius: 99 }}>
                  <div style={{ width: `${(item.count / item.max) * 100}%`, height: '100%', background: '#D86835', borderRadius: 99 }} />
                </div>
                <span className="text-xs font-bold w-6 text-right" style={{ color: '#6B7A69' }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Pedidos recientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>
              Pedidos recientes
            </h2>
            <a href="/pedidos" className="text-xs font-semibold" style={{ color: '#D86835' }}>Ver todos →</a>
          </div>
          <table className="zs-table">
            <thead>
              <tr>
                <th>#</th><th>Mesa / Pedido</th><th>Mesero</th><th>Estado</th><th>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map(o => {
                const sc = STATUS_COLORS[o.status] || { bg: '#F3F4F6', color: '#6B7280' };
                return (
                  <tr key={o.id}>
                    <td className="font-bold" style={{ color: '#D86835' }}>#{o.id}</td>
                    <td>
                      <div className="font-semibold text-sm">{o.table} · {o.items} items</div>
                      <div className="text-xs" style={{ color: '#6B7A69' }}>hace {o.ago}</div>
                    </td>
                    <td className="text-sm">{o.waiter}</td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.color }}>{o.status}</span>
                    </td>
                    <td className="font-bold text-sm">${o.total.toFixed(2)}</td>
                    <td className="text-right">
                      <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>···</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actividad */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>
              Actividad
            </h2>
            <span className="text-xs" style={{ color: '#6B7A69' }}>Últimos 30 min</span>
          </div>
          <div className="space-y-4">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: '#EEF4EC' }}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: '#1C2B1A' }}>{a.text}</div>
                  <div className="text-xs" style={{ color: '#6B7A69' }}>{a.sub}</div>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>{a.ago}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
