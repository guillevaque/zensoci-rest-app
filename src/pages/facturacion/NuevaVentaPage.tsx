import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiPlus, FiTrash2, FiSave, FiCheckCircle, FiX, FiSearch,
  FiArrowLeft, FiPackage, FiDollarSign,
} from 'react-icons/fi'
import { http } from '../../services/http'
import { VentasService } from '../../services/ventas.service'
import type { Cliente } from '../../types/dte'
import type { VentaItemDraft, PagoDraft, CanalVenta, FormaPago, TipoItem } from '../../types/ventas'
import { calcularTotales, CANALES_VENTA, FORMAS_PAGO, TIPOS_ITEM } from '../../types/ventas'
import { v4 as uuidv4 } from 'uuid'

// ── ClienteAutocomplete (reutilizable) ────────────────────────────────────
function ClienteAutocomplete({
  value, onChange,
}: {
  value: string
  onChange: (nombre: string, id: number) => void
}) {
  const [query,   setQuery]   = useState(value)
  const [results, setResults] = useState<Cliente[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  const doSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res: { data: Cliente[] } = await http.get(
        `/facturacion/clientes.php?q=${encodeURIComponent(q)}&per_page=10&activo=1`
      )
      setResults(res.data ?? [])
      setOpen(true)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 250)
  }

  function handleFocus() {
    doSearch(query)
  }

  function handleSelect(c: Cliente) {
    setQuery(c.nombre)
    setResults([])
    setOpen(false)
    onChange(c.nombre, c.id)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    onChange('', 0)
  }

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <FiSearch size={14} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--zs-text-secondary)',
        }} />
        <input
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Buscar cliente…"
          style={{
            width: '100%', padding: '8px 32px 8px 30px', fontSize: 13,
            border: '1px solid var(--zs-border)', borderRadius: 7,
            background: 'var(--zs-surface)', color: 'var(--zs-text-primary)',
            boxSizing: 'border-box',
          }}
        />
        {query && (
          <button onClick={handleClear} type="button"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--zs-text-secondary)',
              display: 'flex', padding: 2 }}>
            <FiX size={13} />
          </button>
        )}
      </div>
      {open && (results.length > 0 || loading) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--zs-surface)', border: '1px solid var(--zs-border)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)',
          zIndex: 200, maxHeight: 220, overflowY: 'auto',
        }}>
          {loading && <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--zs-text-secondary)' }}>Buscando…</div>}
          {results.map(c => (
            <div key={c.id} onMouseDown={() => handleSelect(c)}
              style={{ padding: '8px 14px', cursor: 'pointer', borderTop: '1px solid var(--zs-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--zs-surface-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--zs-text-primary)' }}>{c.nombre}</div>
              <div style={{ fontSize: 11, color: 'var(--zs-text-secondary)' }}>
                {c.tipo_persona === 'J' ? 'Jurídica' : 'Natural'}
                {c.nit ? ` · NIT ${c.nit}` : ''}
                {c.nrc ? ` · NRC ${c.nrc}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────
function round2(n: number) { return Math.round(n * 100) / 100 }
function fmt(n: number)     { return n.toFixed(2) }

function emptyItem(): VentaItemDraft {
  return {
    numero_item: 0, descripcion: '', codigo_producto: '',
    cantidad: 1, precio_unitario: 0, descuento: 0,
    tipo_item: 1, no_gravado: false, exento: false,
  }
}

// ── component ──────────────────────────────────────────────────────────────
export default function NuevaVentaPage() {
  const navigate = useNavigate()

  // Cliente
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final')
  const [clienteId,     setClienteId]     = useState<number>(1)

  // Canal / referencia
  const [canal,        setCanal]        = useState<CanalVenta>('MANUAL')
  const [refExterna,   setRefExterna]   = useState('')
  const [fechaVenta,   setFechaVenta]   = useState(new Date().toISOString().split('T')[0])
  const [observaciones,setObservaciones]= useState('')
  const [costoEnvio,   setCostoEnvio]   = useState(0)
  const [propina,      setPropina]      = useState(0)

  // Ítems
  const [items, setItems] = useState<VentaItemDraft[]>([emptyItem()])

  // Pagos
  const [pagos, setPagos] = useState<PagoDraft[]>([])
  const [pagoForma,   setPagoForma]   = useState<FormaPago>('01')
  const [pagoRef,     setPagoRef]     = useState('')
  const [pagoMonto,   setPagoMonto]   = useState('')

  // Estado
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // ── Cálculos ──────────────────────────────────────────────────────────
  const totales = calcularTotales(items)
  const totalPagar = round2(totales.total_pagar + costoEnvio + propina)
  const totalPagado = round2(pagos.reduce((a, p) => a + p.monto, 0))
  const diferencia  = round2(totalPagado - totalPagar)

  // ── Ítems ─────────────────────────────────────────────────────────────
  function setItem(idx: number, patch: Partial<VentaItemDraft>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  function addItem() {
    setItems(prev => [...prev, { ...emptyItem(), numero_item: prev.length + 1 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, numero_item: i + 1 })))
  }

  // ── Pagos ─────────────────────────────────────────────────────────────
  function addPago() {
    const monto = round2(parseFloat(pagoMonto) || 0)
    if (monto <= 0) return
    setPagos(prev => [...prev, { forma_pago: pagoForma, referencia: pagoRef, monto }])
    setPagoMonto('')
    setPagoRef('')
  }

  function removePago(idx: number) {
    setPagos(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Guardar BORRADOR ─────────────────────────────────────────────────
  async function handleSave(completar: boolean) {
    setError(null)
    const validItems = items.filter(it => it.descripcion.trim())
    if (validItems.length === 0) {
      setError('Agrega al menos un ítem con descripción')
      return
    }

    setSaving(true)
    try {
      const iKey = uuidv4()
      const itemsPayload = validItems.map((it, i) => ({
        ...it,
        numero_item: i + 1,
        total_gravado:   round2(it.no_gravado || it.exento ? 0 : (it.cantidad * it.precio_unitario - it.descuento)),
        total_exento:    round2(it.exento    ? (it.cantidad * it.precio_unitario - it.descuento) : 0),
        total_no_sujeto: round2(it.no_gravado && !it.exento ? (it.cantidad * it.precio_unitario - it.descuento) : 0),
      }))

      const venta = await VentasService.create({
        cliente_id:            clienteId,
        canal,
        referencia_externa:    refExterna.trim() || undefined,
        fecha_venta:           fechaVenta,
        items:                 itemsPayload,
        observaciones:         observaciones.trim() || undefined,
        idempotency_key:       iKey,
        costo_envio:           costoEnvio,
        propina,
        ...totales,
        monto_total_operacion: round2(totales.monto_total_operacion + costoEnvio + propina),
        total_pagar:           totalPagar,
      })

      // Registrar pagos si hay
      for (const p of pagos) {
        await VentasService.addPago({ venta_id: venta.id, ...p })
      }

      if (completar) {
        await VentasService.cerrar(venta.id)
      }

      navigate(`/facturacion/ventas/${venta.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/facturacion/ventas')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--zs-text-secondary)', padding: 4, display: 'flex' }}>
          <FiArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--zs-text-primary)' }}>
          Nueva venta
        </h1>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b',
          borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── Sección 1: Encabezado ──────────────────────────────────────── */}
      <Section title="Encabezado" icon={<FiPackage size={15} />}>
        <Row label="Canal">
          <select value={canal} onChange={e => { setCanal(e.target.value as CanalVenta); setRefExterna('') }}
            style={inputStyle}>
            {Object.entries(CANALES_VENTA).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Row>
        {canal !== 'MANUAL' && (
          <Row label="Referencia externa">
            <input value={refExterna} onChange={e => setRefExterna(e.target.value)}
              placeholder="ID del pedido en plataforma"
              style={inputStyle} />
          </Row>
        )}
        <Row label="Fecha">
          <input type="date" value={fechaVenta} onChange={e => setFechaVenta(e.target.value)}
            style={inputStyle} />
        </Row>
        <Row label="Cliente">
          <ClienteAutocomplete
            value={clienteNombre}
            onChange={(nombre, id) => { setClienteNombre(nombre || 'Consumidor Final'); setClienteId(id || 1) }}
          />
        </Row>
        <Row label="Observaciones">
          <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
            rows={2} placeholder="Opcional…"
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </Row>
      </Section>

      {/* ── Sección 2: Ítems ──────────────────────────────────────────── */}
      <Section title="Ítems" icon={<FiPackage size={15} />}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--zs-surface-hover)' }}>
                {['#','Descripción','Código','Cant.','Precio unit.','Dcto.','Tipo','Gravado','Exento','Sin sujeto','Subtotal',''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: 'var(--zs-text-secondary)',
                    whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const bruto   = round2(it.cantidad * it.precio_unitario)
                const neto    = round2(bruto - it.descuento)
                const subtotal = neto
                return (
                  <tr key={idx} style={{ borderTop: '1px solid var(--zs-border)' }}>
                    <td style={{ padding: '6px 8px', color: 'var(--zs-text-secondary)', fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ padding: '4px 6px', minWidth: 200 }}>
                      <input value={it.descripcion} onChange={e => setItem(idx, { descripcion: e.target.value })}
                        placeholder="Descripción del producto/servicio"
                        style={{ ...inlineInput, width: '100%' }} />
                    </td>
                    <td style={{ padding: '4px 6px', minWidth: 80 }}>
                      <input value={it.codigo_producto} onChange={e => setItem(idx, { codigo_producto: e.target.value })}
                        placeholder="SKU"
                        style={{ ...inlineInput, width: 80 }} />
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <input type="number" min="0.0001" step="any"
                        value={it.cantidad}
                        onChange={e => setItem(idx, { cantidad: parseFloat(e.target.value) || 1 })}
                        style={{ ...inlineInput, width: 60, textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <input type="number" min="0" step="0.01"
                        value={it.precio_unitario}
                        onChange={e => setItem(idx, { precio_unitario: parseFloat(e.target.value) || 0 })}
                        style={{ ...inlineInput, width: 80, textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <input type="number" min="0" step="0.01"
                        value={it.descuento}
                        onChange={e => setItem(idx, { descuento: parseFloat(e.target.value) || 0 })}
                        style={{ ...inlineInput, width: 70, textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <select value={it.tipo_item}
                        onChange={e => setItem(idx, { tipo_item: parseInt(e.target.value) as TipoItem })}
                        style={{ ...inlineInput, width: 90 }}>
                        {Object.entries(TIPOS_ITEM).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <input type="checkbox" checked={!it.no_gravado && !it.exento}
                        onChange={e => { if (e.target.checked) setItem(idx, { no_gravado: false, exento: false }) }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <input type="checkbox" checked={it.exento}
                        onChange={e => setItem(idx, { exento: e.target.checked, no_gravado: false })}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <input type="checkbox" checked={it.no_gravado}
                        onChange={e => setItem(idx, { no_gravado: e.target.checked, exento: false })}
                      />
                    </td>
                    <td style={{ padding: '4px 8px', fontFamily: 'monospace', textAlign: 'right',
                      whiteSpace: 'nowrap', fontWeight: 600 }}>
                      ${fmt(subtotal)}
                    </td>
                    <td style={{ padding: '4px 4px' }}>
                      <button onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                          color: items.length === 1 ? 'var(--zs-border)' : '#991b1b', padding: 4, display: 'flex' }}>
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addItem} type="button"
          style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: '1px dashed var(--zs-border)', borderRadius: 7,
            padding: '6px 14px', cursor: 'pointer', fontSize: 13,
            color: 'var(--zs-text-secondary)', width: '100%', justifyContent: 'center' }}>
          <FiPlus size={14} /> Agregar ítem
        </button>
      </Section>

      {/* ── Sección 3: Totales ────────────────────────────────────────── */}
      <Section title="Totales" icon={<FiDollarSign size={15} />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
          <TotalRow label="Subtotal ventas"    value={totales.subtotal_ventas} />
          <TotalRow label="Total descuentos"   value={totales.total_descuento} />
          <TotalRow label="Total gravado"      value={totales.total_gravado} />
          <TotalRow label="Total exento"       value={totales.total_exento} />
          <TotalRow label="Total no sujeto"    value={totales.total_no_sujeto} />
          <TotalRow label="IVA (13%)"          value={totales.iva_total} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: 'var(--zs-text-secondary)', whiteSpace: 'nowrap' }}>Costo envío</label>
            <input type="number" min="0" step="0.01" value={costoEnvio}
              onChange={e => setCostoEnvio(parseFloat(e.target.value) || 0)}
              style={{ ...inlineInput, width: 90, textAlign: 'right' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: 'var(--zs-text-secondary)', whiteSpace: 'nowrap' }}>Propina</label>
            <input type="number" min="0" step="0.01" value={propina}
              onChange={e => setPropina(parseFloat(e.target.value) || 0)}
              style={{ ...inlineInput, width: 90, textAlign: 'right' }} />
          </div>
        </div>
        <div style={{ marginTop: 12, padding: '12px 0', borderTop: '2px solid var(--zs-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--zs-text-primary)' }}>TOTAL A PAGAR</span>
          <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: 'var(--zs-primary)' }}>
            ${fmt(totalPagar)}
          </span>
        </div>
      </Section>

      {/* ── Sección 4: Pagos ──────────────────────────────────────────── */}
      <Section title="Pagos" icon={<FiDollarSign size={15} />}>
        {pagos.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
            <thead>
              <tr style={{ background: 'var(--zs-surface-hover)' }}>
                {['Forma de pago','Referencia','Monto',''].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: 'var(--zs-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagos.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--zs-border)' }}>
                  <td style={{ padding: '7px 10px' }}>{FORMAS_PAGO[p.forma_pago]}</td>
                  <td style={{ padding: '7px 10px', color: 'var(--zs-text-secondary)' }}>{p.referencia || '—'}</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 600 }}>${fmt(p.monto)}</td>
                  <td style={{ padding: '7px 6px' }}>
                    <button onClick={() => removePago(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        color: '#991b1b', padding: 4, display: 'flex' }}>
                      <FiTrash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--zs-border)' }}>
                <td colSpan={2} style={{ padding: '7px 10px', fontWeight: 600, textAlign: 'right' }}>
                  Total pagado
                </td>
                <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700,
                  color: diferencia >= 0 ? '#065f46' : '#991b1b' }}>
                  ${fmt(totalPagado)}
                  {diferencia !== 0 && (
                    <span style={{ fontSize: 11, marginLeft: 6 }}>
                      ({diferencia > 0 ? `+${fmt(diferencia)} vuelto` : `-${fmt(Math.abs(diferencia))} pendiente`})
                    </span>
                  )}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        )}

        {/* Agregar pago */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Forma de pago</label>
            <select value={pagoForma} onChange={e => setPagoForma(e.target.value as FormaPago)}
              style={{ ...inlineInput, width: 140 }}>
              {Object.entries(FORMAS_PAGO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {pagoForma !== '01' && (
            <div>
              <label style={labelStyle}>Referencia</label>
              <input value={pagoRef} onChange={e => setPagoRef(e.target.value)}
                placeholder="Nº autorización / transferencia"
                style={{ ...inlineInput, width: 200 }} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Monto</label>
            <input type="number" min="0.01" step="0.01"
              value={pagoMonto}
              onChange={e => setPagoMonto(e.target.value)}
              placeholder="0.00"
              onKeyDown={e => e.key === 'Enter' && addPago()}
              style={{ ...inlineInput, width: 100, textAlign: 'right' }} />
          </div>
          <button onClick={addPago} type="button"
            style={{ padding: '7px 14px', background: 'var(--zs-primary)', color: '#fff',
              border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiPlus size={13} /> Agregar
          </button>
        </div>
      </Section>

      {/* ── Acciones ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={() => navigate('/facturacion/ventas')}
          disabled={saving}
          style={{ padding: '9px 18px', border: '1px solid var(--zs-border)',
            background: 'transparent', borderRadius: 8, cursor: 'pointer',
            color: 'var(--zs-text-primary)', fontSize: 14 }}>
          Cancelar
        </button>
        <button onClick={() => handleSave(false)} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', background: 'var(--zs-surface-hover)',
            border: '1px solid var(--zs-border)', borderRadius: 8, cursor: 'pointer',
            color: 'var(--zs-text-primary)', fontSize: 14, fontWeight: 600 }}>
          <FiSave size={15} /> {saving ? 'Guardando…' : 'Guardar borrador'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', background: 'var(--zs-primary)',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            color: '#fff', fontSize: 14, fontWeight: 600 }}>
          <FiCheckCircle size={15} /> {saving ? '…' : 'Completar venta'}
        </button>
      </div>
    </div>
  )
}

// ── Sub-componentes de UI ──────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--zs-surface)', border: '1px solid var(--zs-border)',
      borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--zs-border)',
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--zs-text-secondary)' }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--zs-text-primary)' }}>{title}</span>
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12,
      alignItems: 'flex-start', marginBottom: 10 }}>
      <label style={{ fontSize: 13, color: 'var(--zs-text-secondary)', paddingTop: 8, fontWeight: 500 }}>
        {label}
      </label>
      <div>{children}</div>
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0', color: 'var(--zs-text-secondary)', fontSize: 13 }}>
      <span>{label}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>${value.toFixed(2)}</span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  border: '1px solid var(--zs-border)', borderRadius: 7,
  background: 'var(--zs-surface)', color: 'var(--zs-text-primary)',
  boxSizing: 'border-box',
}
const inlineInput: React.CSSProperties = {
  padding: '6px 8px', fontSize: 13,
  border: '1px solid var(--zs-border)', borderRadius: 6,
  background: 'var(--zs-surface)', color: 'var(--zs-text-primary)',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4,
  color: 'var(--zs-text-secondary)',
}
