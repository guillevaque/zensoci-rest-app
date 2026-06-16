import React, { useState } from 'react';
import { MdAdd, MdPrint } from 'react-icons/md';

type OrderStatus = 'En cocina' | 'Listo' | 'Servido' | 'Pagado';

type Order = {
  id: number;
  table: string;
  items: number;
  ago: string;
  waiter: string;
  status: OrderStatus;
  total: number;
};

const ORDERS: Order[] = [
  { id: 1042, table: 'Mesa 2',  items: 6, ago: '2 min',  waiter: 'Marisol', status: 'En cocina', total: 58.10 },
  { id: 1041, table: 'Pickup',  items: 2, ago: '5 min',  waiter: 'Andrés',  status: 'Listo',     total: 17.00 },
  { id: 1040, table: 'Mesa 8',  items: 9, ago: '12 min', waiter: 'Lucía',   status: 'Servido',   total: 124.80 },
  { id: 1039, table: 'Mesa 6',  items: 4, ago: '18 min', waiter: 'Sofía',   status: 'Servido',   total: 41.00 },
  { id: 1038, table: 'Mesa 1',  items: 3, ago: '24 min', waiter: 'Andrés',  status: 'Pagado',    total: 24.50 },
  { id: 1037, table: 'Mesa 4',  items: 7, ago: '35 min', waiter: 'Andrés',  status: 'Pagado',    total: 96.20 },
  { id: 1036, table: 'Terraza B',items:5, ago: '42 min', waiter: 'Sofía',   status: 'Pagado',    total: 36.00 },
];

type Filter = 'Todos' | 'En cocina' | 'Listo' | 'Pagado';

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string }> = {
  'En cocina': { bg: '#FEF3EE', color: '#D86835' },
  'Listo':     { bg: '#DCFCE7', color: '#166534' },
  'Servido':   { bg: '#DBE4FF', color: '#3451B2' },
  'Pagado':    { bg: '#F3F4F6', color: '#6B7280' },
};

export default function Pedidos() {
  const [filter, setFilter] = useState<Filter>('Todos');

  const visible = filter === 'Todos' ? ORDERS : ORDERS.filter(o => o.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">PEDIDOS</h1>
          <p className="page-subtitle">Pedidos del día</p>
        </div>
        <button className="btn btn-primary">
          <MdAdd size={16} /> Nuevo Pedido
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['Todos','En cocina','Listo','Pagado'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn"
            style={filter === f
              ? { background: '#3C6030', color: '#fff' }
              : { background: '#fff', color: '#6B7A69', border: '1px solid #E2EAE0' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="zs-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Mesa / Pedido</th>
              <th>Mesero</th>
              <th>Estado</th>
              <th>Total</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(o => {
              const sc = STATUS_STYLE[o.status];
              return (
                <tr key={o.id}>
                  <td>
                    <span className="font-bold text-sm" style={{ color: '#D86835' }}>#{o.id}</span>
                  </td>
                  <td>
                    <div className="font-semibold text-sm" style={{ color: '#1C2B1A' }}>
                      {o.table} · {o.items} items
                    </div>
                    <div className="text-xs" style={{ color: '#6B7A69' }}>hace {o.ago}</div>
                  </td>
                  <td className="text-sm" style={{ color: '#1C2B1A' }}>{o.waiter}</td>
                  <td>
                    <span className="badge" style={{ background: sc.bg, color: sc.color }}>{o.status}</span>
                  </td>
                  <td className="font-bold text-sm" style={{ color: '#1C2B1A' }}>${o.total.toFixed(2)}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', gap: 4 }}>
                      <MdPrint size={14} /> Imprimir →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="py-12 text-center" style={{ color: '#6B7A69' }}>
            No hay pedidos en este estado.
          </div>
        )}
      </div>
    </div>
  );
}
