import React from 'react'

type Estado = 'Libre' | 'Ocupada' | 'Reservada'
type Mesa = { id:string, nombre:string, asientos:number, x:number, y:number, estado:Estado, color:string }

const ESTADO_COLOR: Record<Estado, string> = {
  'Libre':'#7fc97f',
  'Ocupada':'#F2994A',
  'Reservada':'#7FB3FF'
}

const defaultMesas: Mesa[] = [
  { id:'m1', nombre:'Mesa 1', asientos:4, x:340, y:40, estado:'Libre', color:'#7fc97f' },
  { id:'m2', nombre:'Mesa 2', asientos:2, x:140, y:180, estado:'Ocupada', color:'#F2994A' },
  { id:'m3', nombre:'Mesa 3', asientos:6, x:300, y:320, estado:'Reservada', color:'#7FB3FF' },
  { id:'m4', nombre:'Mesa 4', asientos:4, x:520, y:160, estado:'Libre', color:'#7fc97f' },
]

const STORAGE_KEY = 'salon_layout_v1'

export const GestionMesas: React.FC = () => {
  const [mesas, setMesas] = React.useState<Mesa[]>(()=>{
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : defaultMesas
    } catch { return defaultMesas }
  })
  const [selected, setSelected] = React.useState<string | null>(null)

  React.useEffect(()=>{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mesas))
  }, [mesas])

  const addMesa = () => {
    const id = 'm' + Math.random().toString(36).slice(2,7)
    const nueva: Mesa = {
      id, nombre:`Mesa ${mesas.length+1}`, asientos:4,
      x: 100 + Math.random()*460, y: 80 + Math.random()*280,
      estado:'Libre', color:ESTADO_COLOR['Libre']
    }
    setMesas(m=>[...m,nueva])
  }
  const resetVista = () => setMesas(defaultMesas)
  const guardarPlano = () => alert('Plano guardado en el navegador (localStorage).')
  const addSilla = () => alert('Función de ejemplo: aquí podrías adjuntar sillas por mesa.')

  // Drag simple
  const dragRef = React.useRef<{id:string, offsetX:number, offsetY:number} | null>(null)

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, id:string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    dragRef.current = { id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if(!dragRef.current) return
    const container = e.currentTarget.getBoundingClientRect()
    const nx = e.clientX - container.left - dragRef.current.offsetX
    const ny = e.clientY - container.top - dragRef.current.offsetY
    setMesas(ms=>ms.map(m=> m.id===dragRef.current!.id ? {...m, x: Math.max(0, Math.min(nx, container.width-120)), y: Math.max(0, Math.min(ny, container.height-120))} : m))
  }
  const onMouseUp = () => { dragRef.current = null }

  const setEstado = (id:string, estado:Estado) => {
    setMesas(ms=>ms.map(m=> m.id===id ? {...m, estado, color:ESTADO_COLOR[estado]} : m))
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 card">
        <div className="font-semibold text-lg mb-2">Gestión del Salón</div>
        <div className="text-sm text-gray-600 mb-4">Modo Edición</div>
        <div className="flex flex-col gap-2">
          <button onClick={addMesa}>Añadir Mesa</button>
          <button onClick={addSilla}>Añadir Silla</button>
          <button onClick={guardarPlano}>Guardar Plano</button>
          <button onClick={resetVista}>Resetear Vista</button>
        </div>
        <div className="mt-6">
          <div className="font-semibold mb-2">Información</div>
          {selected ? (
            <div className="text-sm">
              <div><b>Mesa Seleccionada:</b> {mesas.find(m=>m.id===selected)?.nombre}</div>
              <div><b>Estado:</b> {mesas.find(m=>m.id===selected)?.estado}</div>
              <div className="mt-2 flex gap-2">
                {(['Libre','Ocupada','Reservada'] as Estado[]).map(st=> (
                  <button key={st} onClick={()=>setEstado(selected, st as Estado)} style={{background: ESTADO_COLOR[st as Estado]}}>
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ) : <div className="text-sm text-gray-600">Selecciona una mesa.</div>}
        </div>
      </aside>

      <section className="col-span-9 card" style={{height:'520px'}}>
        <div
          className="relative w-full h-full overflow-hidden select-none"
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Círculo punteado para referencia */}
          <div
            style={{
              position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
              width:'520px', height:'520px', border:'3px dashed #d1d5db', borderRadius:'50%'
            }}
          />
          {/* Mesas */}
          {mesas.map(m=> (
            <div key={m.id}
              onMouseDown={(e)=>onMouseDown(e, m.id)}
              onClick={()=>setSelected(m.id)}
              style={{
                position:'absolute', left:m.x, top:m.y, width:'120px', height:'90px',
                background:m.color, borderRadius:'10px', boxShadow:'0 6px 14px rgba(0,0,0,.12)',
                cursor:'grab', padding:'12px'
              }}
            >
              <div className="font-semibold">{m.nombre}</div>
              <div className="text-xs opacity-80">{m.asientos} Asientos</div>
              <span style={{background:'#0E9F6E', color:'white', borderRadius: '999px', padding:'2px 8px', fontSize:'11px'}}>
                {m.estado}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
