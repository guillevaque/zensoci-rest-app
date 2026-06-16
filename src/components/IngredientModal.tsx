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
      [k]: ['stock', 'minimo', 'costo'].includes(k as string) ? Number(v) : v,
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

  const fields: { key: keyof IngredienteForm; label: string; type?: string; placeholder?: string }[] = [
    { key: 'nombre',    label: 'Nombre',        placeholder: 'Ej. Tomate cherry' },
    { key: 'categoria', label: 'Categoría',      placeholder: 'Ej. Vegetales' },
    { key: 'proveedor', label: 'Proveedor',      placeholder: 'Ej. Mercado central' },
    { key: 'unidad',    label: 'Unidad',         placeholder: 'kg, L, g, u…' },
    { key: 'stock',     label: 'Stock actual',   type: 'number' },
    { key: 'minimo',    label: 'Stock mínimo',   type: 'number' },
    { key: 'costo',     label: 'Costo unitario', type: 'number' },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          width: 540,
          maxWidth: '100%',
          borderRadius: 20,
          boxShadow: '0 16px 48px rgba(0,0,0,0.20)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2EAE0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#1C2B1A', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: '#EEF4EC', color: '#3C6030', border: 'none',
              width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, padding: 0,
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ padding: 20, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {fields.map(f => (
              <div key={f.key} style={f.key === 'costo' ? { gridColumn: '1 / -1' } : {}}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1C2B1A', marginBottom: 6 }}>
                  {f.label}
                </label>
                <input
                  type={f.type || 'text'}
                  step={f.type === 'number' ? '0.01' : undefined}
                  className="input"
                  value={values[f.key] as string | number}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                  required={f.key === 'nombre'}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
