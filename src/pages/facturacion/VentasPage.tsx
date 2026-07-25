import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiEye, FiCheckCircle, FiXCircle, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useVentas } from '../../hooks/useVentas'
import type { Venta, EstadoVenta, CanalVenta } from '../../types/ventas'
import { CANALES_VENTA, FORMAS_PAGO } from '../../types/ventas'

// ── helpers ────────────────────────────────────────────────────────────────
function fmtMoneda(n: number | string) {
  return `$${Number(n).toFixed(2)}`
}

function fmtFecha(iso: string) {
  return iso ? iso.split('T')[0] : '—'
}

const ESTADO_STYLE: Record<EstadoVenta, { bg: string; color: string; label: string }> = {
  BORRADOR:    { bg: 'var(--zs-surface-hover)',    color: 'var(--zs-text-secondary)', label: 'Borrador'   },
  COMPLETADA:  { bg: '#d1fae5',                    color: '#065f46',                  label: 'Completada' },
  ANULADA:     { bg: '#fee2e2',                    color: '#991b1b',                  label: 'Anulada'    },
}

function EstadoBadge({ estado }: { estado: EstadoVenta }) {
  const s = ESTADO_STYLE[estado] ?? ESTADO_STYLE.BORRADOR
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}

// ── component ──────────────────────────────────────────────────────────────
export default function VentasPage() {
  const navigate = useNavigate()
  const { ventas, total, page, lastPage, loading, error, search, setPage, reload, cerrar, anular } = useVentas()

  const [q, setQ]               = useState('')
  const [estado, setEstado]     = useState('')
  const [canal, setCanal]       = useState('')
  const [fechaDesde, setFDesde] = useState('')
  const [fechaHasta, setFHasta] = useState('')
  const [confirm, setConfirm]   = useState<{ type: 'cerrar' | 'anular'; id: number } | null>(null)
  const [acting, setActing]     = useState(false)

  useEffect(() => {
    search({ q, estado: estado || undefined, canal: (canal as CanalVenta) || undefined,
             fecha_desde: fechaDesde || undefined, fecha_hasta: fechaHasta || undefined })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    search({ q, estado: estado || undefined, canal: (canal as CanalVenta) || undefined,
             fecha_desde: fechaDesde || undefined, fecha_hasta: fechaHasta || undefined })
  }

  async function handleAction() {
    if (!confirm) return
    setActing(true)
    try {
      if (confirm.type === 'cerrar') await cerrar(confirm.id)
      else                           await anular(confirm.id)
      setConfirm(null)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setActing(false)
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--zs-text-primary)' }}>
            Ventas
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--zs-text-secondary)' }}>
            {total} registro{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/facturacion/ventas/nueva')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--zs-primary)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <FiPlus size={16} /> Nueva venta
        </button>
      </div>

      {/* Filtros */}
      <form onSubmit={handleSearch}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--zs-text-secondary)' }} />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar cliente, referencia, nº…"
            style={{
              width: '100%', padding: '7px 10px 7px 30px', fontSize: 13,
              border: '1px solid var(--zs-border)', borderRadius: 7,
              background: 'var(--zs-surface)', color: 'var(--zs-text-primary)',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <select value={estado} onChange={e => setEstado(e.target.value)}
          style={selectStyle}>
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="COMPLETADA">Completada</option>
          <option value="ANULADA">Anulada</option>
        </select>
        <select value={canal} onChange={e => setCanal(e.target.value)}
          style={selectStyle}>
          <option value="">Todos los canales</option>
          {Object.entries(CANALES_VENTA).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input type="date" value={fechaDesde} onChange={e => setFDesde(e.target.value)}
          style={selectStyle} title="Desde" />
        <input type="date" value={fechaHasta} onChange={e => setFHasta(e.target.value)}
          style={selectStyle} title="Hasta" />
        <button type="submit" style={{
          padding: '7px 14px', background: 'var(--zs-primary)', color: '#fff',
          border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Filtrar
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b',
          borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: 'var(--zs-surface)', borderRadius: 10,
        border: '1px solid var(--zs-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--zs-surface-hover)' }}>
              {['Nº','Fecha','Cliente','Canal','Referencia ext.','Total','Estado','Acciones'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--zs-text-secondary)' }}>
                Cargando…
              </td></tr>
            )}
            {!loading && ventas.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--zs-text-secondary)' }}>
                Sin ventas que mostrar
              </td></tr>
            )}
            {ventas.map((v: Venta) => (
              <tr key={v.id} style={{ borderTop: '1px solid var(--zs-border)' }}>
                <td style={tdStyle}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    #{String(v.numero).padStart(4, '0')}
                  </span>
                </td>
                <td style={tdStyle}>{fmtFecha(v.fecha_venta)}</td>
                <td style={{ ...tdStyle, maxWidth: 180 }}>
                  <span title={v.cliente_nombre} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.cliente_nombre ?? '—'}
                  </span>
                </td>
                <td style={tdStyle}>{CANALES_VENTA[v.canal] ?? v.canal}</td>
                <td style={{ ...tdStyle, color: 'var(--zs-text-secondary)', fontSize: 12 }}>
                  {v.referencia_externa ?? '—'}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>
                  {fmtMoneda(v.total_pagar)}
                </td>
                <td style={tdStyle}>
                  <EstadoBadge estado={v.estado} />
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <button onClick={() => navigate(`/facturacion/ventas/${v.id}`)}
                    title="Ver detalle" style={iconBtn}>
                    <FiEye size={15} />
                  </button>
                  {v.estado === 'BORRADOR' && (
                    <button onClick={() => setConfirm({ type: 'cerrar', id: v.id })}
                      title="Completar venta" style={{ ...iconBtn, color: '#065f46' }}>
                      <FiCheckCircle size={15} />
                    </button>
                  )}
                  {v.estado !== 'ANULADA' && (
                    <button onClick={() => setConfirm({ type: 'anular', id: v.id })}
                      title="Anular venta" style={{ ...iconBtn, color: '#991b1b' }}>
                      <FiXCircle size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {lastPage > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 8, marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={pageBtn}>
            <FiChevronLeft />
          </button>
          <span style={{ fontSize: 13, color: 'var(--zs-text-secondary)' }}>
            Página {page} de {lastPage}
          </span>
          <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} style={pageBtn}>
            <FiChevronRight />
          </button>
        </div>
      )}

      {/* Modal confirmación */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--zs-surface)', borderRadius: 12, padding: 28,
            width: 360, boxShadow: '0 8px 40px rgba(0,0,0,.2)',
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 17, color: 'var(--zs-text-primary)' }}>
              {confirm.type === 'cerrar' ? '¿Completar venta?' : '¿Anular venta?'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--zs-text-secondary)' }}>
              {confirm.type === 'cerrar'
                ? 'La venta quedará COMPLETADA y no podrá editarse.'
                : 'La venta quedará ANULADA. Esta acción no se puede deshacer.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)} disabled={acting}
                style={{ padding: '8px 16px', border: '1px solid var(--zs-border)',
                  background: 'transparent', borderRadius: 8, cursor: 'pointer',
                  color: 'var(--zs-text-primary)', fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={handleAction} disabled={acting}
                style={{
                  padding: '8px 16px', border: 'none', borderRadius: 8,
                  background: confirm.type === 'cerrar' ? '#065f46' : '#991b1b',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                }}>
                {acting ? '…' : confirm.type === 'cerrar' ? 'Completar' : 'Anular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600,
  color: 'var(--zs-text-secondary)', whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '10px 14px', color: 'var(--zs-text-primary)',
}
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
  color: 'var(--zs-text-secondary)', borderRadius: 4,
}
const selectStyle: React.CSSProperties = {
  padding: '7px 10px', fontSize: 13,
  border: '1px solid var(--zs-border)', borderRadius: 7,
  background: 'var(--zs-surface)', color: 'var(--zs-text-primary)',
}
const pageBtn: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid var(--zs-border)',
  background: 'var(--zs-surface)', borderRadius: 6, cursor: 'pointer',
  color: 'var(--zs-text-primary)', display: 'flex', alignItems: 'center',
}
