import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiUpload, FiSearch, FiList, FiGrid,
  FiClock, FiChevronLeft, FiChevronRight, FiFilter,
} from 'react-icons/fi';

type PagoStatus = 'Pagada' | 'No pagado' | 'En proceso';
type EstadoStatus = 'Publicado' | 'Borrador' | 'Cancelado';

type Invoice = {
  id: number;
  numero: string;
  tipo: string;
  fecha: string;
  cliente: string;
  sello: string;
  vencimiento: string | null;
  impuestos: number;
  total: number;
  totalMoneda: number;
  pago: PagoStatus;
  estado: EstadoStatus;
};

const MOCK: Invoice[] = [
  {
    id: 1,
    numero: '2026/DTE-01-M001P001-000000000000004',
    tipo: 'Factura',
    fecha: '23/07/2026',
    cliente: 'Consumidor Final',
    sello: '2026EAA1FC05FD7242988FF3ED516788AD8D6S0P',
    vencimiento: null,
    impuestos: 20796,
    total: 23500,
    totalMoneda: 23500,
    pago: 'Pagada',
    estado: 'Publicado',
  },
  {
    id: 2,
    numero: 'INV/2026/00001',
    tipo: 'Factura',
    fecha: '17/07/2026',
    cliente: 'Consumidor Final',
    sello: '20268A76468DB58E43388DA61E16C89AF2DAGYIP',
    vencimiento: 'hace 7 días',
    impuestos: 424885,
    total: 480120,
    totalMoneda: 480120,
    pago: 'No pagado',
    estado: 'Publicado',
  },
  {
    id: 3,
    numero: '2026/DTE-01-M001P001-000000000000003',
    tipo: 'Factura',
    fecha: '17/07/2026',
    cliente: 'Consumidor Final',
    sello: '2026A155D399A47C497DBB002B09DECDF3B56RZQ',
    vencimiento: 'hace 7 días',
    impuestos: 1017071,
    total: 1149290,
    totalMoneda: 1149290,
    pago: 'No pagado',
    estado: 'Publicado',
  },
  {
    id: 4,
    numero: '2026/DTE-01-M001P001-000000000000001',
    tipo: 'Factura',
    fecha: '17/07/2026',
    cliente: 'Consumidor Final',
    sello: '2026FD5F87DA22E4F629D286C51BD78C914VQR3',
    vencimiento: 'hace 7 días',
    impuestos: 722504,
    total: 816430,
    totalMoneda: 816430,
    pago: 'No pagado',
    estado: 'Publicado',
  },
];

const fmt = (n: number) =>
  '$ ' + n.toLocaleString('es-SV', { minimumFractionDigits: 0 });

const PAY_STYLES: Record<PagoStatus, React.CSSProperties> = {
  Pagada:     { background: '#d1fae5', color: '#065f46' },
  'No pagado': { background: '#fee2e2', color: '#991b1b' },
  'En proceso': { background: '#fef3c7', color: '#92400e' },
};
const ESTADO_STYLES: Record<EstadoStatus, React.CSSProperties> = {
  Publicado: { background: '#d1fae5', color: '#065f46' },
  Borrador:  { background: '#f3f4f6', color: '#374151' },
  Cancelado: { background: '#fee2e2', color: '#991b1b' },
};

function Badge({ label, style }: { label: string; style: React.CSSProperties }) {
  return (
    <span style={{
      ...style,
      padding: '3px 10px', borderRadius: 999,
      fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 11,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

const TH: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontWeight: 700,
  color: 'var(--zs-mute)', fontSize: 11, letterSpacing: '0.06em',
  textTransform: 'uppercase', whiteSpace: 'nowrap',
  background: 'var(--zs-paper-warm)',
  borderBottom: '2px solid var(--zs-line)',
  position: 'sticky', top: 0,
};
const TD: React.CSSProperties = {
  padding: '11px 12px', color: 'var(--zs-ink)', verticalAlign: 'middle',
};

export default function FacturasClientesPage() {
  const navigate                    = useNavigate();
  const [selected, setSelected]     = useState<number[]>([]);
  const [search, setSearch]         = useState('');

  const filtered = MOCK.filter(inv =>
    inv.numero.toLowerCase().includes(search.toLowerCase()) ||
    inv.cliente.toLowerCase().includes(search.toLowerCase()) ||
    inv.tipo.toLowerCase().includes(search.toLowerCase()),
  );

  const totalImpuestos = filtered.reduce((s, i) => s + i.impuestos, 0);
  const totalGeneral   = filtered.reduce((s, i) => s + i.total, 0);

  const allSelected = selected.length === filtered.length && filtered.length > 0;
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(i => i.id));
  const toggleOne = (id: number) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '12px 20px', borderBottom: '1px solid var(--zs-line)',
        background: 'var(--zs-cream)', flexShrink: 0,
      }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/facturacion/clientes/facturas/nueva')}
          style={{ gap: 6, paddingLeft: 14, paddingRight: 16 }}
        >
          <FiPlus size={15} /> Nuevo
        </button>
        <button className="btn btn-secondary" style={{ gap: 6 }}>
          <FiUpload size={15} /> Subir
        </button>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid var(--zs-line)',
          borderRadius: 999, padding: '7px 14px',
        }}>
          <FiSearch size={14} color="var(--zs-mute)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar factura…"
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-ink)',
              minWidth: 180,
            }}
          />
        </div>

        {/* Filter chip */}
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', border: '1px solid var(--zs-line)',
          borderRadius: 999, background: '#fff', cursor: 'pointer',
          fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)',
        }}>
          <FiFilter size={13} /> Facturas
          <span style={{
            background: 'var(--zs-accent2)', color: '#fff',
            borderRadius: 999, fontSize: 10, fontWeight: 700,
            padding: '1px 6px', marginLeft: 2,
          }}>
            {filtered.length}
          </span>
        </button>

        {/* Pagination */}
        <span style={{
          fontFamily: 'var(--zs-font-mono)', fontSize: 12,
          color: 'var(--zs-mute)', whiteSpace: 'nowrap',
        }}>
          1–{filtered.length} / {filtered.length}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          {[FiChevronLeft, FiChevronRight].map((Icon, i) => (
            <button key={i} style={{
              width: 30, height: 30, border: '1px solid var(--zs-line)',
              borderRadius: 8, background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={14} color="var(--zs-mute)" />
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--zs-line)', borderRadius: 8, overflow: 'hidden' }}>
          {[FiList, FiGrid].map((Icon, i) => (
            <button key={i} style={{
              width: 30, height: 30, background: i === 0 ? 'var(--zs-line)' : '#fff',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={14} color="var(--zs-mute)" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--zs-font-mono)', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 36, textAlign: 'center' }}>
                <input
                  type="checkbox" checked={allSelected}
                  onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--zs-accent2)' }}
                />
              </th>
              <th style={TH}>Número</th>
              <th style={TH}>Tipo de Documento</th>
              <th style={TH}>Fecha de Factura</th>
              <th style={TH}>Cliente</th>
              <th style={TH}>Sello</th>
              <th style={TH}>Fecha de vencimiento</th>
              <th style={{ ...TH, textAlign: 'center' }}>Actividades</th>
              <th style={{ ...TH, textAlign: 'right' }}>Impuestos no incluidos</th>
              <th style={{ ...TH, textAlign: 'right' }}>Total</th>
              <th style={{ ...TH, textAlign: 'right' }}>Total en moneda</th>
              <th style={TH}>Pago</th>
              <th style={TH}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, idx) => {
              const isSelected = selected.includes(inv.id);
              return (
                <tr
                  key={inv.id}
                  onClick={() => toggleOne(inv.id)}
                  style={{
                    borderBottom: '1px solid var(--zs-line)',
                    background: isSelected
                      ? 'rgba(216,104,53,0.07)'
                      : idx % 2 === 0 ? '#fff' : 'var(--zs-cream)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                >
                  <td style={{ ...TD, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox" checked={isSelected}
                      onChange={() => toggleOne(inv.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--zs-accent2)' }}
                    />
                  </td>
                  <td style={{ ...TD, color: 'var(--zs-accent2)', fontWeight: 700 }}>
                    {inv.numero}
                  </td>
                  <td style={TD}>{inv.tipo}</td>
                  <td style={TD}>{inv.fecha}</td>
                  <td style={TD}>{inv.cliente}</td>
                  <td style={{
                    ...TD, maxWidth: 160, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: 'var(--zs-mute)', fontSize: 11,
                  }}>
                    {inv.sello}
                  </td>
                  <td style={TD}>
                    {inv.vencimiento ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        color: 'var(--zs-red)', fontWeight: 600,
                      }}>
                        <FiClock size={12} /> {inv.vencimiento}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <button style={{
                      width: 28, height: 28, borderRadius: 999,
                      border: '1px solid var(--zs-line)', background: '#fff',
                      cursor: 'pointer', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FiClock size={13} color="var(--zs-mute)" />
                    </button>
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>{fmt(inv.impuestos)}</td>
                  <td style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>{fmt(inv.total)}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>{fmt(inv.totalMoneda)}</td>
                  <td style={TD}>
                    <Badge label={inv.pago} style={PAY_STYLES[inv.pago]} />
                  </td>
                  <td style={TD}>
                    <Badge label={inv.estado} style={ESTADO_STYLES[inv.estado]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--zs-line-strong)', background: 'var(--zs-paper-warm)' }}>
              <td colSpan={8} />
              <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: 'var(--zs-ink)' }}>
                {fmt(totalImpuestos)}
              </td>
              <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: 'var(--zs-ink)' }}>
                {fmt(totalGeneral)}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
