import React from 'react'

export type IngredienteForm = {
  nombre: string
  categoria: string
  proveedor: string
  unidad: string
  stock: number
  minimo: number
  costo: number
}

type Props = {
  open: boolean
  title: string
  initial: IngredienteForm
  onClose: () => void
  onSubmit: (values: IngredienteForm) => Promise<void> | void
}

export default function IngredientModal({ open, title, initial, onClose, onSubmit }: Props) {
  const [values, setValues] = React.useState<IngredienteForm>(initial)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => setValues(initial), [initial, open])

  if (!open) return null

  const set = (k: keyof IngredienteForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValues(s => ({
      ...s,
      [k]: ['stock','minimo','costo'].includes(k as string) ? Number(v) : v
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await onSubmit(values)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  // estilos simples y limpios
  const field = 'w-full border rounded px-3 py-2'
  const label = 'text-sm font-medium mb-1'

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50}}>
      <div style={{background:'#fff', width:520, maxWidth:'92vw', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,.25)'}}>
        <div style={{padding:'14px 18px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 style={{fontWeight:800}}>{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{fontSize:20, lineHeight:1}}>×</button>
        </div>

        <form onSubmit={submit} style={{padding:18}}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={label}>Nombre</div>
              <input className={field} value={values.nombre} onChange={set('nombre')} required />
            </div>
            <div>
              <div className={label}>Categoría</div>
              <input className={field} value={values.categoria} onChange={set('categoria')} />
            </div>
            <div>
              <div className={label}>Proveedor</div>
              <input className={field} value={values.proveedor} onChange={set('proveedor')} />
            </div>
            <div>
              <div className={label}>Unidad</div>
              <input className={field} value={values.unidad} onChange={set('unidad')} placeholder="kg, L, g…" />
            </div>
            <div>
              <div className={label}>Stock</div>
              <input type="number" step="0.01" className={field} value={values.stock} onChange={set('stock')} />
            </div>
            <div>
              <div className={label}>Stock mínimo</div>
              <input type="number" step="0.01" className={field} value={values.minimo} onChange={set('minimo')} />
            </div>
            <div className="col-span-2">
              <div className={label}>Costo unitario</div>
              <input type="number" step="0.01" className={field} value={values.costo} onChange={set('costo')} />
            </div>
          </div>

          <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:16}}>
            <button type="button" onClick={onClose} style={{padding:'8px 12px', borderRadius:8, background:'rgba(0,0,0,.06)'}}>Cancelar</button>
            <button type="submit" disabled={saving}
              style={{padding:'8px 14px', borderRadius:8, color:'#fff', background:'#D86835', opacity: saving ? .7 : 1}}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
