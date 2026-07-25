import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiPrinter } from 'react-icons/fi'
import { VentasService } from '../../services/ventas.service'
import type { VentaDetalle, EstadoVenta } from '../../types/ventas'
import { CANALES_VENTA, FORMAS_PAGO, TIPOS_ITEM } from '../../types/ventas'

function fmt(n: number | string) {
  return `$${Number(n).toFixed(2)}`
}

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return '—'
  return iso.includes('T') ? iso.replace('T', ' ').slice(0, 16) : iso
}

const ESTADO_STYLE: Record<EstadoVenta, { bg: string; color: string; label: string }> = {
  BORRADOR:   { bg: 'var(--zs-surface-hover)',  color: 'var(--zs-text-secondary)', label: 'Borrador'   },
  COMPLETADA: { bg: '#d1fae5',                  color: '#065f46',                  label: 'Completada' },
  ANULADA:    { bg: '#fee2e2',                  color: '#991b1b',                  label: 'Anulada'    },
}

export default function VentaDetallePage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const [venta, setVenta]     = useState<VentaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [acting, setActing]   = useState(false)

  useEffect(() => {
    if (!id) return
    VentasService.getById(Number(id))
      .then(setVenta)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleCerrar() {
    if (!venta) return
    if (!confirm('¿Completar esta venta? No podrá editarse después.')) return
    setActing(true)
    try {
      const updated = await VentasService.cerrar(venta.id)
      setVenta(v => v ? { ...v, ...updated } : v)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally { setActing(false) }
  }

  async function handleAnular() {
    if (!venta) return
    if (!confirm('¿Anular esta venta? Esta acción no se puede deshacer.')) return
    setActing(true)
    try {
      await VentasService.anular(venta.id)
      setVenta(v => v ? { ...v, estado: 'ANULADA' } : v)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally { setActing(false) }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--zs-text-secondary)' }}>Cargando…</div>
  }
  if (error || !venta) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#991b1b' }}>
        {error ?? 'Venta no encontrada'}
      </div>
    )
  }

  const s = ESTADO_STYLE[venta.estado]

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/facturacion/ventas')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--zs-text-secondary)', padding: 4, display: 'flex' }}>
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--zs-text-primary)' }}>
              Venta #{String(venta.numero).padStart(4, '0')}
            </h1>
            <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                background: s.bg, color: s.color,
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--zs-text-secondary)' }}>
                {CANALES_VENTA[venta.canal] ?? venta.canal}
              </span>
              {venta.referencia_externa && (
                <span style={{ fontSize: 12, color: 'var(--zs-text-secondary)' }}>
                  · Ref: {venta.referencia_externa}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()}
            style={outlineBtn}>
            <FiPrinter size={14} /> Imprimir
          </button>
          {venta.estado === 'BORRADOR' && (
            <button onClick={handleCerrar} disabled={acting}
              style={{ ...outlineBtn, background: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' }}>
              <FiCheckCircle size={14} /> Completar
            </button>
          )}
          {venta.estado !== 'ANULADA' && (
            <button onClick={handleAnular} disabled={acting}
              style={{ ...outlineBtn, background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}>
              <FiXCircle size={14} /> Anular
            </button>
          )}
        </div>
      </div>

      {/* ── Info general ──────────────────────────────────────────────── */}
      <Card title="Información general">
        <Grid2>
          <Field label="Cliente"       value={venta.cliente_nombre ?? '—'} />
          <Field label="NIT cliente"   value={venta.cliente_nit ?? '—'} />
          <Field label="Fecha venta"   value={fmtFecha(venta.fecha_venta)} />
          <Field label="Fecha emisión" value={fmtFecha(venta.fecha_hora_emision)} />
          {venta.completed_at && <Field label="Completada" value={fmtFecha(venta.completed_at)} />}
          {venta.observaciones && <Field label="Observaciones" value={venta.observaciones} />}
        </Grid2>
      </Card>

      {/* ── Ítems ─────────────────────────────────────────────────────── */}
      <Card title="Ítems">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--zs-surface-hover)' }}>
                {['#','Descripción','Código','Cant.','Precio unit.','Dcto.','Tipo','Subtotal'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {venta.items.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center',
                  color: 'var(--zs-text-secondary)' }}>Sin ítems</td></tr>
              )}
              {venta.items.map(it => {
                const subtotal = Number(it.total_gravado) + Number(it.total_exento) + Number(it.total_no_sujeto)
                return (
                  <tr key={it.id} style={{ borderTop: '1px solid var(--zs-border)' }}>
                    <td style={tdStyle}>{it.numero_item}</td>
                    <td style={{ ...tdStyle, minWidth: 200 }}>{it.descripcion}</td>
                    <td style={{ ...tdStyle, color: 'var(--zs-text-secondary)' }}>{it.codigo_producto ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{Number(it.cantidad).toLocaleString()}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', textAlign: 'right' }}>
                      {fmt(it.precio_unitario)}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', textAlign: 'right' }}>
                      {fmt(it.descuento)}
                    </td>
                    <td style={tdStyle}>{TIPOS_ITEM[it.tipo_item as keyof typeof TIPOS_ITEM] ?? it.tipo_item}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>
                      {fmt(subtotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Totales ───────────────────────────────────────────────────── */}
      <Card title="Totales">
        <div style={{ maxWidth: 380, marginLeft: 'auto' }}>
          {[
            ['Subtotal ventas',   venta.subtotal_ventas],
            ['Total gravado',     venta.total_gravado],
            ['Total exento',      venta.total_exento],
            ['Total no sujeto',   venta.total_no_sujeto],
            ['Total descuentos',  venta.total_descuento],
            ['IVA (13%)',         venta.iva_total],
            ['Costo envío',       venta.costo_envio],
            ['Propina',           venta.propina],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between',
              padding: '4px 0', fontSize: 13, color: 'var(--zs-text-secondary)' }}>
              <span>{label}</span>
              <span style={{ fontFamily: 'monospace' }}>{fmt(Number(value))}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between',
            padding: '10px 0 4px', borderTop: '2px solid var(--zs-border)',
            fontWeight: 700, fontSize: 15, color: 'var(--zs-text-primary)' }}>
            <span>TOTAL A PAGAR</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--zs-primary)' }}>
              {fmt(venta.total_pagar)}
            </span>
          </div>
        </div>
      </Card>

      {/* ── Pagos ─────────────────────────────────────────────────────── */}
      <Card title="Pagos">
        {venta.pagos.length === 0
          ? <p style={{ color: 'var(--zs-text-secondary)', fontSize: 13, margin: 0 }}>Sin pagos registrados</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--zs-surface-hover)' }}>
                  {['Forma','Referencia','Monto','Fecha'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venta.pagos.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--zs-border)' }}>
                    <td style={tdStyle}>{FORMAS_PAGO[p.forma_pago] ?? p.forma_pago}</td>
                    <td style={{ ...tdStyle, color: 'var(--zs-text-secondary)' }}>{p.referencia ?? '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(p.monto)}</td>
                    <td style={{ ...tdStyle, color: 'var(--zs-text-secondary)' }}>{fmtFecha(p.created_at)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--zs-border)' }}>
                  <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Total pagado</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700,
                    color: 'var(--zs-primary)' }}>
                    {fmt(venta.pagos.reduce((a, p) => a + Number(p.monto), 0))}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          )
        }
      </Card>
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--zs-surface)', border: '1px solid var(--zs-border)',
      borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--zs-border)',
        fontWeight: 700, fontSize: 13, color: 'var(--zs-text-primary)' }}>
        {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--zs-text-secondary)', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--zs-text-primary)' }}>{value}</div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: 'var(--zs-text-secondary)', whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '8px 12px', color: 'var(--zs-text-primary)',
}
const outlineBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', border: '1px solid var(--zs-border)',
  background: 'var(--zs-surface)', borderRadius: 8,
  cursor: 'pointer', fontSize: 13, fontWeight: 600,
  color: 'var(--zs-text-primary)',
}
