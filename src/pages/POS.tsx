import React from 'react'

type Item = { name:string, price:number, qty:number }
const preset = [
  {name:'Pupusa vegana', price:2.5},
  {name:'Bowl', price:6.9},
  {name:'Kombucha', price:2.2},
  {name:'Café', price:1.5}
]

export const POS: React.FC = () => {
  const [items, setItems] = React.useState<Item[]>([])
  const add = (p:{name:string, price:number})=> setItems(s=>[...s,{...p,qty:1}])
  const total = items.reduce((a,b)=>a+b.price*b.qty,0)
  const remove = (i:number)=> setItems(s=>s.filter((_,ix)=>ix!==i))
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <section className="md:col-span-2 card">
        <h2 className="font-semibold mb-3">Pedido</h2>
        {items.length===0 ? <p className="text-sm text-gray-500">Agrega productos</p>:
          <ul className="divide-y">
            {items.map((it,i)=>(
              <li key={i} className="flex justify-between items-center py-2">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-gray-500">${it.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={it.qty} min={1}
                    onChange={(e)=>{
                      const v = Math.max(1, parseInt(e.target.value||'1',10))
                      setItems(s=>s.map((x,ix)=>ix===i?{...x, qty:v}:x))
                    }} className="border rounded px-2 py-1 w-16"/>
                  <div className="w-20 text-right font-semibold">${(it.price*it.qty).toFixed(2)}</div>
                  <button onClick={()=>remove(i)}>Quitar</button>
                </div>
              </li>
            ))}
          </ul>
        }
        <div className="flex justify-between mt-4 font-bold">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={()=>alert('Cobro simulado')}>Cobrar</button>
          <button onClick={()=>setItems([])}>Nuevo</button>
        </div>
      </section>
      <aside className="card">
        <h3 className="font-semibold mb-3">Menú</h3>
        <div className="grid grid-cols-2 gap-2">
          {preset.map(p=> (
            <button key={p.name} onClick={()=>add(p)} className="p-3 text-left" style={{background:'white', color:'inherit', border:'1px solid #eee'}}>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">${p.price.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
