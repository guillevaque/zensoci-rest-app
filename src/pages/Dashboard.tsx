import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { FiDollarSign, FiFileText, FiCoffee, FiTrendingUp, FiTrendingDown, FiCreditCard, FiSend, FiAlertCircle } from 'react-icons/fi';

const money = (n: number) => `$${n.toFixed(2)}`;

const TOP_ITEMS = [
  { id: 1, name: 'Humus Clásico',    image: '/assets/menu/humus-clasico.png',    count: 24, max: 24 },
  { id: 2, name: 'Bowl Curry',       image: '/assets/menu/curry-in-a-hurry.png', count: 18, max: 24 },
  { id: 3, name: 'Baba Ganush',      image: '/assets/menu/baba-ganush.png',       count: 14, max: 24 },
  { id: 4, name: 'Humus Pesto',      image: '/assets/menu/humus-pesto.png',       count: 11, max: 24 },
];

const RECENT_ORDERS = [
  { id: '#1044', table: 'Mesa 3', items: 4, time: '12 min', server: 'Andrés',   status: 'En cocina', total: 58.40 },
  { id: '#1043', table: 'Mesa 7', items: 2, time: '28 min', server: 'Marisol',  status: 'Listo',     total: 32.10 },
  { id: '#1042', table: 'Mesa 1', items: 6, time: '44 min', server: 'Sofía',    status: 'Pagado',    total: 98.60 },
  { id: '#1041', table: 'Pickup', items: 3, time: '52 min', server: 'Andrés',   status: 'Pagado',    total: 45.20 },
];

const hours  = [12,18,22,16,28,38,52,46,68,54,40,32,22,14];
const labels = ['10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
const maxH   = Math.max(...hours);
const nowIdx = 4;

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'Hoy'|'Semana'|'Mes'>('Hoy');
  const d = new Date();
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--zs-accent2)' }}>
            Hoy · {days[d.getDay()]} {d.getDate()} {months[d.getMonth()]}
          </div>
          <h2 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 24, color: 'var(--zs-green)', margin: '4px 0 0' }}>
            Buen turno, {user?.name ?? 'equipo'}.
          </h2>
        </div>
        <div className="flex gap-2">
          {(['Hoy','Semana','Mes'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12, padding: '6px 10px', borderRadius: 999, cursor: 'pointer', background: period === p ? 'var(--zs-green)' : '#fff', color: period === p ? 'var(--zs-paper)' : 'var(--zs-ink)', border: period === p ? '1px solid var(--zs-green)' : '1px solid var(--zs-line-strong)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards – 2 columnas en móvil, 4 en desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <FiDollarSign size={18} />, label: 'Ventas hoy',      value: money(612.40), delta: '+12% vs. ayer',  up: true },
          { icon: <FiFileText  size={18} />, label: 'Pedidos',          value: '42',           delta: '+5 vs. ayer',   up: true },
          { icon: <FiCoffee   size={18} />, label: 'Mesas ocupadas',    value: '5/10',         delta: '3 esperan check', up: null },
          { icon: <FiTrendingUp size={18}/>, label: 'Ticket promedio',  value: money(14.58),   delta: '−$0.40 vs. ayer', up: false },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 10, background: 'var(--zs-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--zs-accent2)' }}>
              {s.icon}
            </div>
            <span style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--zs-mute)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--zs-font-display)', fontSize: 28, lineHeight: 1, color: 'var(--zs-ink)' }}>{s.value}</span>
            <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: s.up === true ? 'var(--zs-green)' : s.up === false ? 'var(--zs-red)' : 'var(--zs-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {s.up === true && <FiTrendingUp size={11} />}
              {s.up === false && <FiTrendingDown size={11} />}
              {s.delta}
            </span>
          </div>
        ))}
      </div>

      {/* Fila 1: gráfico + más vendidos – apilado en móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
        <div style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, color: 'var(--zs-green)', margin: 0 }}>Ventas por hora</h3>
            <span className="hidden sm:inline" style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)' }}>Apertura 10:00 · ahora 14:32</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${hours.length},1fr)`, gap: 4, alignItems: 'flex-end', height: 110, paddingTop: 8 }}>
            {hours.map((h, i) => (
              <div key={i} style={{ height: `${(h/maxH)*100}%`, borderRadius: '4px 4px 2px 2px', minHeight: 4, background: i === nowIdx ? 'linear-gradient(to top,var(--zs-green),var(--zs-acc))' : 'linear-gradient(to top,var(--zs-accent2),rgba(216,104,53,0.6))' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${labels.length},1fr)`, gap: 4, fontFamily: 'var(--zs-font-mono)', fontSize: 9, color: 'var(--zs-mute)', marginTop: 6, textAlign: 'center' }}>
            {labels.map(l => <span key={l}>{l}</span>)}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, color: 'var(--zs-green)', margin: 0 }}>Más vendidos</h3>
            <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)' }}>Hoy</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TOP_ITEMS.map(it => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                <img src={it.image} alt={it.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.currentTarget.style.display='none'; }} />
                <span style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                <div style={{ width: 70, height: 6, background: 'var(--zs-cream)', borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', width: `${(it.count/it.max)*100}%`, background: 'var(--zs-accent2)', borderRadius: 999 }} />
                </div>
                <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', flexShrink: 0 }}>{it.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila 2: pedidos recientes + actividad – apilado en móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
        <div style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, color: 'var(--zs-green)', margin: 0 }}>Pedidos recientes</h3>
            <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)' }}>Ver todos →</span>
          </div>
          {/* Scroll horizontal en móvil */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 500 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1.6fr 1fr 1fr 1fr 60px', gap: 8, padding: '8px 12px', background: 'var(--zs-cream)', fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--zs-mute)', borderRadius: '8px 8px 0 0' }}>
                <span>#</span><span>Pedido</span><span>Mesero</span><span>Estado</span><span>Total</span><span></span>
              </div>
              {RECENT_ORDERS.map((o, idx) => (
                <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '56px 1.6fr 1fr 1fr 1fr 60px', gap: 8, padding: '10px 12px', alignItems: 'center', fontFamily: 'var(--zs-font-mono)', fontSize: 12, borderBottom: idx < RECENT_ORDERS.length-1 ? '1px solid var(--zs-line)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--zs-font-display)', color: 'var(--zs-accent2)' }}>{o.id}</span>
                  <span><strong>{o.table}</strong> · {o.items} items <span style={{ color: 'var(--zs-mute)' }}>· {o.time}</span></span>
                  <span>{o.server}</span>
                  <span>
                    <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: o.status === 'Listo' ? 'rgba(109,151,71,0.18)' : o.status === 'En cocina' ? 'rgba(216,104,53,0.18)' : 'rgba(109,151,71,0.18)', color: o.status === 'En cocina' ? 'var(--zs-accent2)' : 'var(--zs-green)' }}>
                      {o.status}
                    </span>
                  </span>
                  <span style={{ color: 'var(--zs-accent2)', fontWeight: 700 }}>{money(o.total)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--zs-mute)' }}>⋯</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, color: 'var(--zs-green)', margin: 0 }}>Actividad</h3>
            <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)' }}>Últimos 30 min</span>
          </div>
          {[
            { type: 'charge', icon: <FiCreditCard size={14} />, text: <>Marisol cobró <strong>{money(58.10)}</strong></>, meta: 'Mesa 2 · tarjeta', time: '2 min' },
            { type: 'send',   icon: <FiSend size={14} />,       text: <>Andrés envió pedido a cocina</>,              meta: 'Mesa 1 · 3 items', time: '5 min' },
            { type: 'alert',  icon: <FiAlertCircle size={14} />,text: <>Inventario bajo: <strong>Aceite de oliva</strong></>, meta: '1.8 L · reorden 4 L', time: '11 min' },
            { type: 'send',   icon: <FiCoffee size={14} />,     text: <>Cocina listo: pedido #1041</>,                meta: 'Pickup · Andrés', time: '14 min' },
            { type: 'charge', icon: <FiCreditCard size={14} />, text: <>Lucía cobró <strong>{money(124.80)}</strong></>, meta: 'Mesa 8 · propina 18%', time: '19 min' },
          ].map((a, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < arr.length-1 ? '1px dashed var(--zs-line)' : 'none', alignItems: 'flex-start' }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: a.type === 'charge' ? 'rgba(216,104,53,0.15)' : a.type === 'alert' ? 'rgba(204,72,46,0.15)' : 'rgba(60,96,48,0.15)', color: a.type === 'charge' ? 'var(--zs-accent2)' : a.type === 'alert' ? 'var(--zs-red)' : 'var(--zs-green)' }}>
                {a.icon}
              </div>
              <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, flex: 1, lineHeight: 1.4 }}>
                {a.text}
                <span style={{ display: 'block', color: 'var(--zs-mute)', fontSize: 11, marginTop: 1 }}>{a.meta}</span>
              </div>
              <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)', flexShrink: 0 }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
