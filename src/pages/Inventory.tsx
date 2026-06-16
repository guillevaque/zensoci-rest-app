import React from 'react'
import { listIngredientes, crearIngrediente, editarIngrediente, eliminarIngrediente, type Ingrediente } from '../lib/api'
import IngredientModal, { type IngredienteForm } from '../components/IngredientModal'
import { MdOutlineInventory2, MdDownload, MdAdd } from 'react-icons/md'

type Filtro = 'todos' | 'bajo' | 'agotados'

const emptyForm: IngredienteForm = {
  nombre: '', categoria: 'General', proveedor: 'Proveedor Genérico', unidad: 'kg', stock: 0, minimo: 0, costo: 0,
}

export const Inventory: React.FC = () => {
  const [data, setData] = React.useState<Ingrediente[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busqueda, setBusqueda] = React.useState('')
  const [filtro, setFiltro] = React.useState<Filtro>('todos')
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Ingrediente | null>(null)

  const openCreate = () => { setEditing(null); setOpen(true) }
  const openEdit = (row: Ingrediente) => { setEditing(row); setOpen(true) }

  const handleCreate = async (values: IngredienteForm) => {
    await crearIngrediente(values)
    await cargar(busqueda, filtro)
  }
  const handleUpdate = async (values: IngredienteForm) => {
    if (!editing) return
    await editarIngrediente(editing.id, values)
    await cargar(busqueda, filtro)
  }
  const handleDelete = async (row: Ingrediente) => {
    if (!confirm(`Eliminar ${row.nombre}?`)) return
    await eliminarIngrediente(row.id)
    await cargar(busqueda, filtro)
  }

  const cargar = React.useCallback(async (q?: string, f?: Filtro) => {
    try {
      setLoading(true); setError(null)
      const filterParam = f === 'todos' ? undefined : f
      const rows = await listIngredientes({ q, filter: filterParam as any })
      setData(rows)
    } catch (e: any) {
      setError(e?.message || 'Error cargando inventario')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { cargar() }, [cargar])
  React.useEffect(() => {
    const t = setTimeout(() => cargar(busqueda, filtro), 300)
    return () => clearTimeout(t)
  }, [busqueda, filtro, cargar])

  const exportCSV = () => {
    const header = ['Ingrediente', 'Categoría', 'Proveedor', 'Unidad', 'Stock', 'Mínimo', 'Costo', 'Valor']
    const lines = data.map(r => [r.nombre, r.categoria, r.proveedor, r.unidad, r.stock, r.minimo, r.costo.toFixed(2), (r.stock * r.costo).toFixed(2)].join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'inventario.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const bajoStock = data.filter(d => d.stock > 0 && d.stock <= d.minimo).length
  const agotados = data.filter(d => d.stock <= 0).length
  const valorInventario = data.reduce((a, b) => a + Number(b.stock) * Number(b.costo), 0)

  const getEstado = (row: Ingrediente) => {
    if (row.stock <= 0) return { label: 'Agotado', cls: 'badge badge-red' }
    if (row.stock <= row.minimo) return { label: 'Bajo stock', cls: 'badge badge-amber' }
    return { label: 'En stock', cls: 'badge badge-green' }
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="page-title">Gestión de Inventario</h1>
            <p className="page-subtitle">Datos en tiempo real desde tu base en Hostinger</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={exportCSV}>
              <MdDownload size={16} />
              Exportar CSV
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <MdAdd size={16} />
              Agregar ingrediente
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-zs flex items-center justify-center flex-shrink-0" style={{ background: '#FEF9C3' }}>
              <MdOutlineInventory2 size={22} style={{ color: '#854D0E' }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#854D0E' }}>Bajo stock</div>
              <div className="text-3xl font-bold mt-0.5" style={{ color: '#1C2B1A' }}>{bajoStock}</div>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-zs flex items-center justify-center flex-shrink-0" style={{ background: '#FEE2E2' }}>
              <MdOutlineInventory2 size={22} style={{ color: '#991B1B' }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#991B1B' }}>Agotados</div>
              <div className="text-3xl font-bold mt-0.5" style={{ color: '#1C2B1A' }}>{agotados}</div>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-zs flex items-center justify-center flex-shrink-0" style={{ background: '#EEF4EC' }}>
              <MdOutlineInventory2 size={22} style={{ color: '#3C6030' }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3C6030' }}>Valor del inventario</div>
              <div className="text-3xl font-bold mt-0.5" style={{ color: '#1C2B1A' }}>${valorInventario.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 md:max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7A69' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              placeholder="Buscar ingrediente…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(['todos', 'bajo', 'agotados'] as Filtro[]).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className="btn"
                style={
                  filtro === f
                    ? { background: '#D86835', color: '#fff', padding: '0.35rem 0.875rem' }
                    : { background: '#EEF4EC', color: '#3C6030', padding: '0.35rem 0.875rem' }
                }
              >
                {f === 'todos' ? 'Todos' : f === 'bajo' ? 'Bajo stock' : 'Agotados'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12" style={{ color: '#6B7A69' }}>
                <svg className="animate-spin mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Cargando inventario…
              </div>
            ) : error ? (
              <div className="py-10 text-center" style={{ color: '#DC2626' }}>{error}</div>
            ) : data.length === 0 ? (
              <div className="py-12 text-center" style={{ color: '#6B7A69' }}>
                <MdOutlineInventory2 size={36} className="mx-auto mb-2 opacity-30" />
                Sin ingredientes registrados
              </div>
            ) : (
              <table className="zs-table">
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Stock actual</th>
                    <th>Stock mínimo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => {
                    const est = getEstado(row)
                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="font-semibold" style={{ color: '#1C2B1A' }}>{row.nombre}</div>
                          <div className="text-xs" style={{ color: '#6B7A69' }}>{row.unidad}</div>
                        </td>
                        <td style={{ color: '#6B7A69' }}>{row.categoria}</td>
                        <td style={{ color: '#6B7A69' }}>{row.proveedor}</td>
                        <td className="font-medium">{row.stock} {row.unidad}</td>
                        <td style={{ color: '#6B7A69' }}>{row.minimo} {row.unidad}</td>
                        <td><span className={est.cls}>{est.label}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(row)}
                              className="btn btn-ghost"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="btn btn-danger"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <IngredientModal
        open={open}
        title={editing ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        initial={editing ? {
          nombre: editing.nombre,
          categoria: editing.categoria,
          proveedor: editing.proveedor,
          unidad: editing.unidad,
          stock: Number(editing.stock),
          minimo: Number(editing.minimo),
          costo: Number(editing.costo),
        } : emptyForm}
        onClose={() => setOpen(false)}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </>
  )
}
