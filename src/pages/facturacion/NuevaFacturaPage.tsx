import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSettings, FiRefreshCw, FiSave, FiPaperclip, FiPrinter,
  FiEye, FiSend, FiPlus, FiTrash2, FiX, FiUsers, FiChevronRight, FiSearch,
} from 'react-icons/fi';
import { http } from '../../services/http';
import type { Cliente } from '../../types/dte';

// ── Types ─────────────────────────────────────────────────────────────────
type InvoiceState = 'borrador' | 'publicado';
type LineKind     = 'product' | 'section' | 'note';

type LineItem = {
  id: number;
  kind: LineKind;
  producto: string;
  etiqueta: string;
  cantidad: number;
  udm: string;
  precio: number;
  impuestoPct: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  '$ ' + n.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const lineSubtotal = (l: LineItem) => l.precio * l.cantidad;
const lineTax      = (l: LineItem) => lineSubtotal(l) * l.impuestoPct / 100;
const lineGrand    = (l: LineItem) => lineSubtotal(l) + lineTax(l);

// ── Shared mini-components ────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{
        fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700,
        color: 'var(--zs-mute)', letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder = '', type = 'text', readOnly = false,
  muted = false, style: extra,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; readOnly?: boolean; muted?: boolean; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} readOnly={readOnly}
      onChange={e => onChange(e.target.value)}
      style={{
        border: '1px solid var(--zs-line)', borderRadius: 8, padding: '8px 10px',
        fontFamily: 'var(--zs-font-mono)', fontSize: 13,
        color: muted ? 'var(--zs-acc)' : 'var(--zs-ink)',
        outline: 'none', background: readOnly ? 'var(--zs-cream)' : '#fff',
        width: '100%', boxSizing: 'border-box',
        ...extra,
      }}
    />
  );
}

function FieldSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        border: '1px solid var(--zs-line)', borderRadius: 8, padding: '8px 10px',
        fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-ink)',
        outline: 'none', background: '#fff', width: '100%', cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {options.map(o => <option key={o} value={o}>{o || '—'}</option>)}
    </select>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontFamily: 'var(--zs-font-mono)', fontSize: 13 }}>
      <span style={{ color: 'var(--zs-mute)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: 'var(--zs-ink)' }}>{value}</span>
    </div>
  );
}

const TH: React.CSSProperties = {
  padding: '10px 8px', textAlign: 'left', fontWeight: 700,
  color: 'var(--zs-mute)', fontSize: 11, letterSpacing: '0.06em',
  textTransform: 'uppercase', whiteSpace: 'nowrap',
  background: 'var(--zs-paper)', borderBottom: '2px solid var(--zs-line)',
};

const CELL_INPUT: React.CSSProperties = {
  border: '1px solid var(--zs-line)', borderRadius: 6, padding: '5px 7px',
  fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-ink)',
  outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
};

// ── Cliente Autocomplete ──────────────────────────────────────────────────
function ClienteAutocomplete({
  value, onChange,
}: {
  value: string;
  onChange: (nombre: string, id: number | null) => void;
}) {
  const [query,   setQuery]   = useState(value);
  const [results, setResults] = useState<Cliente[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. reset)
  useEffect(() => { setQuery(value); }, [value]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res: any = await http.get(
        `/facturacion/clientes.php?q=${encodeURIComponent(q)}&per_page=10&activo=1`
      );
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (open) search(query); }, 250);
    return () => clearTimeout(t);
  }, [query, open, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (c: Cliente) => {
    setQuery(c.nombre);
    onChange(c.nombre, c.id);
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
    if (!query) {
      // load first page with no filter to show recent clients
      setLoading(true);
      http.get('/facturacion/clientes.php?per_page=10&activo=1')
        .then((res: any) => setResults(res.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1px solid var(--zs-line)', borderRadius: 8,
        padding: '7px 10px', background: '#fff',
      }}>
        <FiSearch size={13} color="var(--zs-mute)" style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value, null); }}
          onFocus={handleFocus}
          placeholder="Buscar cliente…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-ink)',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onChange('', null); setResults([]); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <FiX size={13} color="var(--zs-mute)" />
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
          background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4,
          maxHeight: 260, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '10px 14px', fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)' }}>
              Buscando…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '10px 14px', fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)' }}>
              {query ? 'Sin resultados' : 'Sin clientes'}
            </div>
          )}
          {results.map(c => (
            <div
              key={c.id}
              onMouseDown={() => select(c)}
              style={{
                padding: '9px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--zs-line)',
                fontFamily: 'var(--zs-font-mono)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--zs-cream)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--zs-ink)' }}>
                {c.nombre}
              </div>
              <div style={{ fontSize: 11, color: 'var(--zs-mute)', marginTop: 1 }}>
                {c.tipo_persona === 'J' ? 'Jurídica' : 'Natural'}
                {c.nit ? ` · NIT: ${c.nit}` : ''}
                {c.nrc ? ` · NRC: ${c.nrc}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Split Bill Modal ──────────────────────────────────────────────────────
function SplitBillModal({
  total, items, onClose,
}: {
  total: number;
  items: LineItem[];
  onClose: () => void;
}) {
  const [mode, setMode]     = useState<'igual' | 'items'>('igual');
  const [partes, setPartes] = useState(2);
  const [assign, setAssign] = useState<Record<number, number>>({});

  const productLines = items.filter(l => l.kind === 'product' && (l.precio > 0 || l.cantidad > 1));
  const share = partes > 0 ? total / partes : 0;

  const personTotals = () => {
    const map: Record<number, number> = {};
    productLines.forEach(l => {
      const p = assign[l.id];
      if (p) map[p] = (map[p] ?? 0) + lineGrand(l);
    });
    return map;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--zs-line)',
          background: 'var(--zs-cream)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiUsers size={16} color="var(--zs-green)" />
              <span style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--zs-ink)' }}>
                Dividir cuenta
              </span>
            </div>
            <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', marginTop: 2 }}>
              Total de la factura: <strong style={{ color: 'var(--zs-green)' }}>{fmt(total)}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--zs-mute)', display: 'flex', padding: 4 }}>
            <FiX size={20} />
          </button>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--zs-line)', marginBottom: 22 }}>
            {(['igual', 'items'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--zs-green)' : '#fff',
                color: mode === m ? '#fff' : 'var(--zs-mute)',
                fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13,
                transition: 'all 0.15s',
              }}>
                {m === 'igual' ? 'Partes iguales' : 'Por ítems'}
              </button>
            ))}
          </div>

          {mode === 'igual' ? (
            <>
              <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)', margin: '0 0 16px' }}>
                ¿Cuántas personas pagan?
              </p>
              {/* Counter + per-person card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                <button
                  onClick={() => setPartes(p => Math.max(2, p - 1))}
                  style={{
                    width: 42, height: 42, borderRadius: 10, border: '1px solid var(--zs-line)',
                    background: '#fff', cursor: 'pointer', fontSize: 22, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--zs-ink)',
                    flexShrink: 0,
                  }}
                >−</button>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontFamily: 'var(--zs-font-display)', fontSize: 38, fontWeight: 700, color: 'var(--zs-ink)', lineHeight: 1 }}>
                    {partes}
                  </div>
                  <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)', marginTop: 2 }}>personas</div>
                </div>
                <button
                  onClick={() => setPartes(p => Math.min(20, p + 1))}
                  style={{
                    width: 42, height: 42, borderRadius: 10, border: '1px solid var(--zs-line)',
                    background: '#fff', cursor: 'pointer', fontSize: 22, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--zs-ink)',
                    flexShrink: 0,
                  }}
                >+</button>
                <div style={{
                  flex: 1, background: 'var(--zs-cream)', borderRadius: 10,
                  padding: '12px 16px', textAlign: 'right', border: '1px solid var(--zs-line)',
                }}>
                  <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)' }}>Cada persona paga</div>
                  <div style={{ fontFamily: 'var(--zs-font-display)', fontSize: 22, fontWeight: 700, color: 'var(--zs-green)' }}>
                    {fmt(share)}
                  </div>
                </div>
              </div>

              {/* Grid of persons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {Array.from({ length: partes }, (_, i) => (
                  <div key={i} style={{
                    background: 'var(--zs-paper)', border: '1px solid var(--zs-line)',
                    borderRadius: 10, padding: '12px 14px', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)', marginBottom: 4 }}>
                      Persona {i + 1}
                    </div>
                    <div style={{ fontFamily: 'var(--zs-font-display)', fontSize: 16, fontWeight: 700, color: 'var(--zs-green)' }}>
                      {fmt(share)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {productLines.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '28px 0',
                  fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)',
                }}>
                  Añade ítems a la factura primero
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', marginBottom: 12 }}>
                    Asigna cada ítem a una persona
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
                    {productLines.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8, border: '1px solid var(--zs-line)',
                        background: 'var(--zs-cream)',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--zs-ink)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {item.producto || 'Ítem sin nombre'}
                          </div>
                          <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)' }}>
                            {item.cantidad} × {fmt(item.precio)} = {fmt(lineGrand(item))}
                          </div>
                        </div>
                        <select
                          value={assign[item.id] ?? ''}
                          onChange={e => setAssign(a => ({ ...a, [item.id]: Number(e.target.value) }))}
                          style={{
                            borderRadius: 6, border: '1px solid var(--zs-line)', background: '#fff',
                            fontFamily: 'var(--zs-font-mono)', fontSize: 12, padding: '5px 8px',
                            color: 'var(--zs-ink)', cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          <option value="">— Persona</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                            <option key={n} value={n}>Persona {n}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Per-person summary */}
                  {Object.keys(assign).length > 0 && (
                    <div style={{
                      borderTop: '1px solid var(--zs-line)', paddingTop: 12,
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                      {Object.entries(personTotals())
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([persona, t]) => (
                          <div key={persona} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--zs-font-mono)', fontSize: 13 }}>
                            <span style={{ color: 'var(--zs-mute)' }}>Persona {persona}</span>
                            <span style={{ fontWeight: 700, color: 'var(--zs-green)' }}>{fmt(t)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          padding: '14px 22px', borderTop: '1px solid var(--zs-line)', background: 'var(--zs-cream)',
        }}>
          <button onClick={onClose} className="btn btn-secondary">Cerrar</button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiPrinter size={14} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function NuevaFacturaPage() {
  const navigate  = useNavigate();
  const idRef     = useRef(1);
  const newLine   = (): LineItem => ({
    id: idRef.current++, kind: 'product',
    producto: '', etiqueta: '', cantidad: 1, udm: 'Unidad', precio: 0, impuestoPct: 13,
  });

  const [estado, setEstado]         = useState<InvoiceState>('borrador');
  const [cliente, setCliente]       = useState('');
  const [clienteId, setClienteId]   = useState<number | null>(null);
  const [diario, setDiario]         = useState('');
  const [tipoDoc, setTipoDoc]       = useState('');
  const [referencia, setReferencia] = useState('');
  const [fechaVenc, setFechaVenc]   = useState('');
  const [moneda, setMoneda]         = useState('USD');
  const [condPago, setCondPago]     = useState('');
  const [lines, setLines]           = useState<LineItem[]>(() => [newLine()]);
  const [activeTab, setActiveTab]   = useState<'lineas' | 'otra' | 'apendices'>('lineas');
  const [showSplit, setShowSplit]    = useState(false);

  const today = new Date().toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const productLines = lines.filter(l => l.kind === 'product');
  const subtotal     = productLines.reduce((s, l) => s + lineSubtotal(l), 0);
  const totalTax     = productLines.reduce((s, l) => s + lineTax(l), 0);
  const total        = subtotal + totalTax;

  const addLine = (kind: LineKind = 'product') =>
    setLines(ls => [...ls, { ...newLine(), kind }]);
  const updateLine = (id: number, patch: Partial<LineItem>) =>
    setLines(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  const removeLine = (id: number) =>
    setLines(ls => ls.filter(l => l.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ── Breadcrumb bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 20px', borderBottom: '1px solid var(--zs-line)',
        background: 'var(--zs-cream)', flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/facturacion/clientes/facturas')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-accent2)',
            fontWeight: 700, padding: '3px 6px', borderRadius: 6,
          }}
          className="hover:bg-black/[0.05]"
        >
          Facturas
        </button>
        <FiChevronRight size={13} color="var(--zs-mute)" />
        <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)' }}>
          Borrador de factura -/2026/00001
        </span>
        <div style={{ flex: 1 }} />
        {[FiSettings, FiSave, FiRefreshCw].map((Icon, i) => (
          <button key={i} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--zs-mute)', display: 'flex', padding: 5, borderRadius: 6,
          }} className="hover:bg-black/[0.05]">
            <Icon size={15} />
          </button>
        ))}
      </div>

      {/* ── Action bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '10px 20px', borderBottom: '1px solid var(--zs-line)',
        background: '#fff', flexShrink: 0,
      }}>
        <button
          onClick={() => setEstado('publicado')}
          disabled={estado === 'publicado'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: estado === 'publicado' ? 'var(--zs-mute)' : 'var(--zs-green)',
            color: '#fff', cursor: estado === 'publicado' ? 'default' : 'pointer',
            fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13,
          }}
        >
          <FiSend size={13} /> Publicar y Enviar
        </button>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiEye size={13} /> Vista previa
        </button>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiPrinter size={13} /> Imprimir Ticket
        </button>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiPaperclip size={13} /> 0 Número de archivos adjuntos
        </button>

        <div style={{ flex: 1 }} />

        {/* Status pipeline */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {(['borrador', 'publicado'] as InvoiceState[]).map((s, i) => {
            const isActive = estado === s;
            const isPast   = s === 'borrador' && estado === 'publicado';
            return (
              <div key={s} style={{
                padding: '6px 18px',
                background: isActive || isPast ? 'var(--zs-green)' : 'transparent',
                color: isActive || isPast ? '#fff' : 'var(--zs-mute)',
                fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12,
                border: '1px solid var(--zs-line)',
                borderLeft: i > 0 ? 'none' : undefined,
                borderRadius: i === 0 ? '8px 0 0 8px' : '0 8px 8px 0',
                textTransform: 'capitalize',
              }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: Form ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 32px' }}>

          {/* Invoice title */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', marginBottom: 4 }}>
              Factura de cliente
            </div>
            <div style={{ fontFamily: 'var(--zs-font-display)', fontSize: 30, fontWeight: 700, color: 'var(--zs-ink)' }}>
              -/2026/00001
            </div>
          </div>

          {/* Two-column form fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 36px', marginBottom: 28 }}>
            <Field label="Cliente">
              <ClienteAutocomplete
                value={cliente}
                onChange={(nombre, id) => { setCliente(nombre); setClienteId(id); }}
              />
            </Field>
            <Field label="Fecha de factura">
              <TextInput value={today} onChange={() => {}} readOnly />
            </Field>

            <Field label="Diario">
              <TextInput value={diario} onChange={setDiario} placeholder="Diario de ventas" />
            </Field>
            <Field label="Referencia de pago">
              <TextInput value="" onChange={() => {}} placeholder="—" />
            </Field>

            <Field label="Tipo de documento">
              <FieldSelect value={tipoDoc} onChange={setTipoDoc}
                options={['', 'Factura', 'Nota de crédito', 'Ticket', 'Crédito fiscal']} />
            </Field>
            <Field label="Caja Registradora">
              <TextInput value="" onChange={() => {}} placeholder="No se ha configurado caja" readOnly muted />
            </Field>

            <Field label="Sello">
              <TextInput value="" onChange={() => {}} placeholder="Generado automáticamente" readOnly />
            </Field>
            <Field label="Tienda">
              <TextInput value="" onChange={() => {}} placeholder="No se ha configurado tienda" readOnly muted />
            </Field>

            <Field label="UUID">
              <TextInput value="" onChange={() => {}} placeholder="Generado al publicar" readOnly />
            </Field>
            <Field label="Fecha de vencimiento">
              <TextInput value={fechaVenc} onChange={setFechaVenc} type="date" />
            </Field>

            <Field label="Número de Control">
              <TextInput value="" onChange={() => {}} placeholder="Generado al publicar" readOnly />
            </Field>
            <Field label="Condiciones de pago">
              <FieldSelect value={condPago} onChange={setCondPago}
                options={['', 'Pago inmediato', '15 días', '30 días', '60 días']} />
            </Field>

            <Field label="Referencia">
              <TextInput value={referencia} onChange={setReferencia} placeholder="Referencia interna…" />
            </Field>
            <Field label="Moneda">
              <FieldSelect value={moneda} onChange={setMoneda}
                options={['USD', 'EUR', 'GTQ', 'HNL', 'CRC', 'MXN']} />
            </Field>
          </div>

          {/* ── Tabs ── */}
          <div style={{ borderBottom: '1px solid var(--zs-line)', display: 'flex', gap: 0 }}>
            {(['lineas', 'otra', 'apendices'] as const).map(tab => {
              const labels = {
                lineas: 'Líneas de factura',
                otra: 'Otra Información',
                apendices: 'Apéndices',
              };
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'var(--zs-font-mono)', fontWeight: activeTab === tab ? 700 : 500, fontSize: 13,
                  color: activeTab === tab ? 'var(--zs-accent2)' : 'var(--zs-mute)',
                  borderBottom: activeTab === tab ? '2px solid var(--zs-accent2)' : '2px solid transparent',
                  marginBottom: -1, transition: 'color 0.15s',
                }}>
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* ── Tab: Líneas de factura ── */}
          {activeTab === 'lineas' && (
            <div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--zs-font-mono)', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, minWidth: 160 }}>Producto</th>
                      <th style={{ ...TH, minWidth: 120 }}>Etiqueta</th>
                      <th style={{ ...TH, width: 80, textAlign: 'right' }}>Cantidad</th>
                      <th style={{ ...TH, width: 90 }}>UdM</th>
                      <th style={{ ...TH, width: 110, textAlign: 'right' }}>Precio</th>
                      <th style={{ ...TH, width: 70, textAlign: 'right' }}>IVA %</th>
                      <th style={{ ...TH, width: 120, textAlign: 'right' }}>Total</th>
                      <th style={{ ...TH, width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => {
                      const bg = idx % 2 === 0 ? '#fff' : 'var(--zs-cream)';

                      if (line.kind === 'section') {
                        return (
                          <tr key={line.id} style={{ background: 'var(--zs-paper)', borderBottom: '1px solid var(--zs-line)' }}>
                            <td colSpan={7} style={{ padding: '8px 8px' }}>
                              <input
                                value={line.producto}
                                onChange={e => updateLine(line.id, { producto: e.target.value })}
                                placeholder="Nombre de sección…"
                                style={{ ...CELL_INPUT, fontWeight: 700, background: 'transparent', border: '1px solid transparent' }}
                              />
                            </td>
                            <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                              <button onClick={() => removeLine(line.id)} style={DEL_BTN}>
                                <FiTrash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      if (line.kind === 'note') {
                        return (
                          <tr key={line.id} style={{ background: bg, borderBottom: '1px solid var(--zs-line)' }}>
                            <td colSpan={7} style={{ padding: '8px 8px' }}>
                              <input
                                value={line.producto}
                                onChange={e => updateLine(line.id, { producto: e.target.value })}
                                placeholder="Nota…"
                                style={{ ...CELL_INPUT, fontStyle: 'italic', color: 'var(--zs-mute)', background: 'transparent', border: '1px solid transparent' }}
                              />
                            </td>
                            <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                              <button onClick={() => removeLine(line.id)} style={DEL_BTN}>
                                <FiTrash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={line.id} style={{ background: bg, borderBottom: '1px solid var(--zs-line)' }}>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              value={line.producto} placeholder="Producto…"
                              onChange={e => updateLine(line.id, { producto: e.target.value })}
                              style={CELL_INPUT}
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              value={line.etiqueta} placeholder="Etiqueta…"
                              onChange={e => updateLine(line.id, { etiqueta: e.target.value })}
                              style={CELL_INPUT}
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              type="number" min={0} value={line.cantidad}
                              onChange={e => updateLine(line.id, { cantidad: Number(e.target.value) })}
                              style={{ ...CELL_INPUT, textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <select
                              value={line.udm}
                              onChange={e => updateLine(line.id, { udm: e.target.value })}
                              style={{ ...CELL_INPUT, cursor: 'pointer' }}
                            >
                              {['Unidad', 'kg', 'g', 'L', 'mL', 'hora', 'día', 'mes', 'servicio'].map(u => (
                                <option key={u}>{u}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              type="number" min={0} value={line.precio}
                              onChange={e => updateLine(line.id, { precio: Number(e.target.value) })}
                              style={{ ...CELL_INPUT, textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              type="number" min={0} max={100} value={line.impuestoPct}
                              onChange={e => updateLine(line.id, { impuestoPct: Number(e.target.value) })}
                              style={{ ...CELL_INPUT, textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--zs-ink)' }}>
                            {fmt(lineGrand(line))}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            <button onClick={() => removeLine(line.id)} style={DEL_BTN}>
                              <FiTrash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add row actions */}
              <div style={{ display: 'flex', gap: 4, padding: '10px 6px', borderBottom: '1px solid var(--zs-line)', flexWrap: 'wrap' }}>
                {([
                  { label: 'Añadir una línea',    kind: 'product' as LineKind },
                  { label: 'Añadir una sección',  kind: 'section' as LineKind },
                  { label: 'Añadir una nota',     kind: 'note'    as LineKind },
                ] as const).map(({ label, kind }) => (
                  <button
                    key={kind}
                    onClick={() => addLine(kind)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                      cursor: 'pointer', fontFamily: 'var(--zs-font-mono)', fontSize: 12,
                      color: 'var(--zs-accent2)', fontWeight: 600, padding: '5px 8px', borderRadius: 6,
                    }}
                    className="hover:bg-black/[0.04]"
                  >
                    <FiPlus size={12} /> {label}
                  </button>
                ))}
              </div>

              {/* Totals + Dividir cuenta */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '18px 6px', gap: 20, flexWrap: 'wrap',
              }}>
                {/* Split bill button */}
                <button
                  onClick={() => setShowSplit(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px', borderRadius: 10,
                    border: '1px solid var(--zs-line)', background: '#fff', cursor: 'pointer',
                    fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13,
                    color: 'var(--zs-green)', boxShadow: 'var(--zs-shadow-1)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  className="hover:border-[var(--zs-green)]/50 hover:shadow-sm"
                >
                  <FiUsers size={16} /> Dividir cuenta
                </button>

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 240 }}>
                  <TotalRow label="Subtotal" value={fmt(subtotal)} />
                  <TotalRow label="IVA (13%)" value={fmt(totalTax)} />
                  <div style={{ borderTop: '2px solid var(--zs-line-strong)', paddingTop: 8, marginTop: 2 }}>
                    <TotalRow label="Total" value={fmt(total)} bold />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'otra' && (
            <div style={{ padding: '28px 0', textAlign: 'center', fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)' }}>
              Información adicional de la factura
            </div>
          )}

          {activeTab === 'apendices' && (
            <div style={{ padding: '28px 0', textAlign: 'center', fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)' }}>
              Sin apéndices adjuntos
            </div>
          )}
        </div>

        {/* ── Right: Chatter ── */}
        <div style={{
          width: 270, borderLeft: '1px solid var(--zs-line)',
          display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#fff',
        }}>
          <div style={{
            padding: '13px 16px', borderBottom: '1px solid var(--zs-line)',
            fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 11,
            color: 'var(--zs-mute)', letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Actividad
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)', textAlign: 'center' }}>
              Hoy
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999, background: 'var(--zs-green)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--zs-font-display)', fontSize: 14, flexShrink: 0,
              }}>Z</div>
              <div>
                <div style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--zs-ink)' }}>
                  ZENSOCI ADMIN{' '}
                  <span style={{ fontWeight: 400, color: 'var(--zs-mute)' }}>· ahora</span>
                </div>
                <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', marginTop: 2 }}>
                  Creando un nuevo registro...
                </div>
              </div>
            </div>
          </div>

          {/* Message input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--zs-line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button className="btn btn-secondary" style={{ fontSize: 11, padding: '5px 10px', flex: 1 }}>Enviar mensaje</button>
              <button className="btn btn-secondary" style={{ fontSize: 11, padding: '5px 10px', flex: 1 }}>Registrar nota</button>
            </div>
            <textarea
              rows={2}
              placeholder="Escribe un mensaje…"
              style={{
                width: '100%', resize: 'none', border: '1px solid var(--zs-line)',
                borderRadius: 8, padding: '8px 10px', fontFamily: 'var(--zs-font-mono)',
                fontSize: 12, color: 'var(--zs-ink)', outline: 'none',
                background: 'var(--zs-cream)', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Split Bill Modal */}
      {showSplit && (
        <SplitBillModal total={total} items={lines} onClose={() => setShowSplit(false)} />
      )}
    </div>
  );
}

const DEL_BTN: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--zs-line-strong)', display: 'flex', padding: 4, borderRadius: 4,
};
