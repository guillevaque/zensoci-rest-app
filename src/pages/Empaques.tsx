// src/pages/Empaques.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { EmpaquesAPI, Empaque } from '../api/empaques'

const emptyForm: Partial<Empaque> = {
  name: '', category_label: 'Envase', brand: '', supplier: '', presentation: '',
  unit: 'Unidad', units_per_pack: null, purchase_price_no_iva: null,
  unit_cost: null, stock_qty: 0, min_stock: 0,
}

function usd(v: number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return `$${Number(v).toFixed(4)}`
}

function EmpaqueModal({
  initial, onClose, onSaved,
}: { initial: Partial<Empaque>; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<Partial<Empaque>>(initial)
  const [saving, setSaving] = useState(false)
  const isEdit = !!initial.id

  const set = (k: keyof Empaque, v: any) =>
    setValues((s) => ({ ...s, [k]: v }))

  const num = (v: string) => (v === '' ? null : Number(v))

  const submit = async () => {
    if (!values.name?.trim()) return alert('El nombre es obligatorio')
    setSaving(true)
    try {
      if (isEdit) await EmpaquesAPI.update(initial.id!, values)
      else await EmpaquesAPI.create(values)
      onSaved()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const fields: { k: keyof Empaque; label: string; type?: string; full?: boolean }[] = [
    { k: 'name', label: 'Nombre del empaque', full: true },
    { k: 'category_label', label: 'Categoría (Envase, Tapa, Cubierto…)' },
    { k: 'brand', label: 'Marca' },
    { k: 'supplier', label: 'Proveedor' },
    { k: 'presentation', label: 'Presentación de compra' },
    { k: 'unit', label: 'Unidad' },
    { k: 'units_per_pack', label: 'Unidades por paquete', type: 'number' },
    { k: 'purchase_price_no_iva', label: 'Precio paquete (sin IVA)', type: 'number' },
    { k: 'unit_cost', label: 'Costo unitario (sin IVA)', type: 'number' },
    { k: 'stock_qty', label: 'Stock actual', type: 'number' },
    { k: 'min_stock', label: 'Stock mínimo', type: 'number' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ background: '#3C6030' }}>
          <h3 className="text-white font-semibold">{isEdit ? 'Editar empaque' : 'Nuevo empaque'}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.k} style={f.full ? { gridColumn: '1 / -1' } : {}}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                step={f.type === 'number' ? 'any' : undefined}
                value={(values[f.k] ?? '') as string | number}
                onChange={(e) =>
                  set(f.k, f.type === 'number' ? num(e.target.value) : e.target.value)
                }
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50">Cancelar</button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md text-white disabled:opacity-60"
            style={{ background: '#D86835' }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Empaques() {
  const [data, setData] = useState<Empaque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<Partial<Empaque> | null>(null)

  const reload = () => {
    setLoading(true)
    EmpaquesAPI.list()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(reload, [])

  const filtrados = useMemo(
    () => data.filter((e) => !q || e.name.toLowerCase().includes(q.toLowerCase())),
    [data, q]
  )

  const del = async (e: Empaque) => {
    if (!confirm(`¿Eliminar "${e.name}"?`)) return
    await EmpaquesAPI.remove(e.id)
    reload()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando empaques…</div>
  if (error) return (
    <div className="p-6 m-6 text-red-600 bg-red-50 rounded-lg">
      <p className="font-semibold">Error al cargar empaques</p>
      <p className="text-sm mt-1">{error}</p>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Empaques</h1>
          <p className="text-sm text-gray-500 mt-0.5">Catálogo de material de empaque para el costeo y el inventario</p>
        </div>
        <button
          onClick={() => setModal({ ...emptyForm })}
          className="px-4 py-2 text-sm rounded-md text-white"
          style={{ background: '#D86835' }}
        >
          + Nuevo empaque
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar empaque…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border rounded-md px-3 py-2 text-sm w-full sm:w-80 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase border-b bg-gray-50">
              <th className="px-4 py-3">Empaque</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3 text-right">Costo unit.</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Mínimo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin empaques</td></tr>
            )}
            {filtrados.map((e) => (
              <tr key={e.id} className="hover:bg-orange-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{e.name}</div>
                  <div className="text-xs text-gray-400">{e.category_label} · {e.presentation}</div>
                </td>
                <td className="px-4 py-3 text-gray-500">{e.supplier ?? '—'}</td>
                <td className="px-4 py-3 text-right font-mono">{usd(e.unit_cost)}</td>
                <td className="px-4 py-3 text-right">{e.stock_qty ?? 0} {e.unit}</td>
                <td className="px-4 py-3 text-right text-gray-500">{e.min_stock ?? 0}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setModal(e)} className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 mr-1">Editar</button>
                  <button onClick={() => del(e)} className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <EmpaqueModal
          initial={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload() }}
        />
      )}
    </div>
  )
}
