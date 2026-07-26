import React, { useState } from 'react';
import PermissionsPanel from './PermissionsPanel';
import FirmadorStatusPanel from './facturacion/FirmadorStatusPanel';

const GROUPS = [
  { title: 'Restaurante', items: [
    { label:'Nombre',    value:'Zensoci · Cocina Vegana' },
    { label:'Dirección', value:'Col. Escalón, San Salvador' },
    { label:'Teléfono',  value:'+503 0000-0000' },
    { label:'Horario',   value:'Mar – Dom · 10:00 – 22:00' },
  ]},
  { title: 'Impuestos & propina', items: [
    { label:'IVA',                   value:'13%' },
    { label:'Propina sugerida',      value:'10 / 15 / 20%' },
    { label:'Moneda',                value:'USD ($)' },
  ]},
  { title: 'Impresoras', items: [
    { label:'Tickets', value:'Caja · Star TSP143 · conectada' },
    { label:'Cocina',  value:'Cocina · Epson TM-T20 · conectada' },
  ]},
  { title: 'Pagos', items: [
    { label:'Terminal', value:'Stripe Reader M2 · vinculada' },
    { label:'Métodos',  value:'Tarjeta · Efectivo · QR' },
  ]},
];

const TABS = ['General', 'Permisos', 'DTE'];

export function Settings() {
  const [activeTab, setActiveTab] = useState('General');

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--zs-line)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 14,
              padding: '8px 16px 12px',
              color: activeTab === tab ? 'var(--zs-green)' : 'var(--zs-mute)',
              borderBottom: activeTab === tab ? '2px solid var(--zs-green)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'General' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GROUPS.map(g => (
            <div key={g.title} style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 18, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, color: 'var(--zs-green)', margin: 0 }}>{g.title}</h3>
                <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-accent2)', cursor: 'pointer' }}>Editar →</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {g.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: idx < g.items.length-1 ? '1px dashed var(--zs-line)' : 'none', fontFamily: 'var(--zs-font-mono)', fontSize: 13, gap: 8 }}>
                    <span style={{ color: 'var(--zs-mute)', flexShrink: 0 }}>{it.label}</span>
                    <span style={{ fontWeight: 700, textAlign: 'right' }}>{it.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Permisos' && (
        <div style={{ background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 18, padding: '20px 24px' }}>
          <PermissionsPanel />
        </div>
      )}

      {activeTab === 'DTE' && (
        <div style={{ maxWidth: 560 }}>
          <FirmadorStatusPanel />
        </div>
      )}
    </div>
  );
}
