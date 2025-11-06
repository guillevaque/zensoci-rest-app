import React from 'react'
import { listIngredientes, crearIngrediente, editarIngrediente, eliminarIngrediente, type Ingrediente } from '../lib/api'
import IngredientModal, { type IngredienteForm } from '../components/IngredientModal'


type Filtro = 'todos'|'bajo'|'agotados'

export const Inventory: React.FC = () => {
  const [data, setData] = React.useState<Ingrediente[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busqueda, setBusqueda] = React.useState('')
  const [filtro, setFiltro] = React.useState<Filtro>('todos')
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Ingrediente | null>(null)


  
const emptyForm: IngredienteForm = {
  nombre:'', categoria:'General', proveedor:'Proveedor Genérico', unidad:'kg', stock:0, minimo:0, costo:0
}

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
    } catch (e:any) {
      setError(e?.message || 'Error cargando inventario')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(()=>{ cargar() }, [cargar])
  React.useEffect(()=>{ const t = setTimeout(()=>cargar(busqueda, filtro), 300); return ()=>clearTimeout(t) }, [busqueda, filtro, cargar])

  const agregar = async () => {
    const nombre = prompt('Nombre:'); if(!nombre) return
    const categoria = prompt('Categoría:', 'General') || 'General'
    const proveedor = prompt('Proveedor:', 'Proveedor Genérico') || 'Proveedor Genérico'
    const unidad = prompt('Unidad (kg, L, g...):', 'kg') || 'kg'
    const stock = parseFloat(prompt('Stock inicial:', '0') || '0')
    const minimo = parseFloat(prompt('Stock mínimo:', '0') || '0')
    const costo = parseFloat(prompt('Costo unitario:', '0') || '0')
    await crearIngrediente({ nombre, categoria, proveedor, unidad, stock, minimo, costo })
    await cargar(busqueda, filtro)
  }

  const editar = async (row: Ingrediente) => {
    const nombre = prompt('Nombre:', row.nombre) || row.nombre
    const categoria = prompt('Categoría:', row.categoria) || row.categoria
    const proveedor = prompt('Proveedor:', row.proveedor) || row.proveedor
    const unidad = prompt('Unidad:', row.unidad) || row.unidad
    const stock = parseFloat(prompt('Stock:', String(row.stock)) || String(row.stock))
    const minimo = parseFloat(prompt('Mínimo:', String(row.minimo)) || String(row.minimo))
    const costo = parseFloat(prompt('Costo unitario:', String(row.costo)) || String(row.costo))
    await editarIngrediente(row.id, { nombre, categoria, proveedor, unidad, stock, minimo, costo })
    await cargar(busqueda, filtro)
  }

  const eliminar = async (row: Ingrediente) => {
    if(!confirm(`Eliminar ${row.nombre}?`)) return
    await eliminarIngrediente(row.id)
    await cargar(busqueda, filtro)
  }

  const bajoStock = data.filter(d=>d.stock>0 && d.stock<=d.minimo).length
  const agotados = data.filter(d=>d.stock<=0).length
  const valorInventario = data.reduce((a,b)=>a+(Number(b.stock)*Number(b.costo)),0)

  const Dot: React.FC<{color:string}> = ({color}) => <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:color,marginRight:8}}/>

  const Pill: React.FC<{label:string,active:boolean,onClick:()=>void}> = ({label,active,onClick}) => (
    <button onClick={onClick} style={{background: active ? 'var(--btn)' : 'rgba(0,0,0,.06)', color: active ? 'white' : 'inherit'}} className="px-3 py-2 rounded-full text-sm">
      {label}
    </button>
  )

  return (
    <><div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Gestión de Inventario</h1>
          <p className="text-sm" style={{ color: '#3C6030' }}>Datos reales desde tu base en Hostinger.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded" style={{ background: 'var(--btn)', color: '#fff' }} onClick={async () => {
            const header = ['Ingrediente', 'Categoría', 'Proveedor', 'Unidad', 'Stock', 'Mínimo', 'Costo', 'Valor']
            const lines = data.map(r => [r.nombre, r.categoria, r.proveedor, r.unidad, r.stock, r.minimo, r.costo.toFixed(2), (r.stock * r.costo).toFixed(2)].join(','))
            const csv = [header.join(','), ...lines].join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob); const a = document.createElement('a')
            a.href = url; a.download = 'inventario.csv'; a.click(); URL.revokeObjectURL(url)
          } }>Exportar a CSV</button>
          <button className="px-4 py-2 rounded" style={{ background: 'var(--btn)', color: '#fff' }} onClick={openCreate}>
            Agregar ingrediente
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card"><div className="text-sm text-yellow-700">Bajo Stock</div><div className="text-4xl font-bold">{bajoStock}</div></div>
        <div className="card"><div className="text-sm text-red-700">Agotados</div><div className="text-4xl font-bold">{agotados}</div></div>
        <div className="card"><div className="text-sm">Valor del Inventario</div><div className="text-4xl font-bold">${valorInventario.toFixed(2)}</div></div>
      </div>

      <div className="card flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <input placeholder="Buscar ingrediente por nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="border rounded px-3 py-2 w-full md:w-1/2" />
        <div className="flex items-center gap-2">
          <Pill label="Todos" active={filtro === 'todos'} onClick={() => setFiltro('todos')} />
          <Pill label="Bajo stock" active={filtro === 'bajo'} onClick={() => setFiltro('bajo')} />
          <Pill label="Agotados" active={filtro === 'agotados'} onClick={() => setFiltro('agotados')} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? <div>Cargando…</div> : error ? <div className="text-red-600">{error}</div> : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Ingrediente</th>
                <th className="py-2 pr-4">Categoría</th>
                <th className="py-2 pr-4">Proveedor</th>
                <th className="py-2 pr-4">Cantidad</th>
                <th className="py-2 pr-4">Stock mínimo</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(row => {
                const estado = row.stock <= 0 ? 'Agotado' : (row.stock <= row.minimo ? 'Bajo Stock' : 'En Stock')
                const color = row.stock <= 0 ? '#DC2626' : (row.stock <= row.minimo ? '#D97706' : '#16A34A')
                return (
                  <tr key={row.id}>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{row.nombre}</div>
                      <div className="text-xs text-gray-500">{row.unidad}</div>
                    </td>
                    <td className="py-3 pr-4">{row.categoria}</td>
                    <td className="py-3 pr-4">{row.proveedor}</td>
                    <td className="py-3 pr-4">{row.stock} {row.unidad}</td>
                    <td className="py-3 pr-4">{row.minimo} {row.unidad}</td>
                    <td className="py-3 pr-4"><Dot color={color} />{estado}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(row)} className="px-3 py-1 rounded" style={{ background: 'rgba(0,0,0,.06)' }}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(row)} className="px-3 py-1 rounded" style={{ background: '#b91c1c', color: '#fff' }}>
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
    </div><IngredientModal
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
        onSubmit={editing ? handleUpdate : handleCreate} /></>
  )
}
