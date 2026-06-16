// src/pages/Costeo.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { CosteoAPI, CosteoPlatillo, CosteoIngrediente } from '../api/costeo'

const CATEGORIAS = ['Todas', 'Entradas', 'Sopas', 'Bowls (ensalada)', 'Especialidades', 'Pasta', 'Sandwich', 'Bebidas', 'Cafes', 'Postres']

function pct(v: number | null) {
  if (v === null || v === undefined) return '—'
  return `${(v * 100).toFixed(1)}%`
}
function usd(v: number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return `$${Number(v).toFixed(2)}`
}

/** Costo vivo de un ingrediente aplicando merma */
function liveCosto(ing: CosteoIngrediente): number | null {
  if (ing.precio_unitario_actual == null || ing.cantidad == null) return null
  return ing.cantidad * ing.precio_unitario_actual * (1 + (ing.porcentaje_merma ?? 0))
}

function MargenBadge({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-gray-400 text-xs">—</span>
  const pctVal = valor * 100
  const color =
    pctVal >= 60 ? 'bg-green-100 text-green-700' :
    pctVal >= 50 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {pctVal.toFixed(1)}%
    </span>
  )
}

function DeltaBadge({ snapshot, live }: { snapshot: number | null; live: number | null }) {
  if (snapshot == null || live == null) return <span className="text-gray-300 text-xs">—</span>
  const diff = live - snapshot
  const pctDiff = snapshot !== 0 ? diff / snapshot : 0
  if (Math.abs(pctDiff) < 0.02) {
    return <span className="text-gray-400 text-xs font-medium">≈</span>
  }
  const up = diff > 0
  return (
    <span className={`text-xs font-semibold ${up ? 'text-red-600' : 'text-green-600'}`}>
      {up ? '▲' : '▼'} {Math.abs(pctDiff * 100).toFixed(1)}%
    </span>
  )
}

function IngredientesDrawer({ platillo, onClose }: { platillo: CosteoPlatillo; onClose: () => void }) {
  const principales = platillo.ingredientes?.filter(i => i.tipo === 'principal') ?? []
  const secundarios = platillo.ingredientes?.filter(i => i.tipo === 'secundario') ?? []
  const empaque = platillo.ingredientes?.filter(i => i.tipo === 'empaque') ?? []

  const allIngs = platillo.ingredientes ?? []
  const totalSnapshot = allIngs.reduce((sum, i) => sum + (i.costo_ingrediente ?? 0), 0)
  const totalLive = allIngs.reduce<number | null>((sum, i) => {
    const lc = liveCosto(i)
    if (lc == null) return sum  // si alguno no tiene costo vivo, ignora
    return (sum ?? 0) + lc
  }, 0)
  const hasLive = allIngs.some(i => i.precio_unitario_actual != null)

  const seccion = (titulo: string, items: CosteoIngrediente[], colorClass: string) => {
    if (items.length === 0) return null
    return (
      <div className="mb-5">
        <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${colorClass}`}>{titulo}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-gray-400 border-b text-xs">
                <th className="pb-1 font-medium">Ingrediente</th>
                <th className="pb-1 font-medium text-right">Cant.</th>
                <th className="pb-1 font-medium text-right">Costo ref.</th>
                {hasLive && <th className="pb-1 font-medium text-right">Costo real</th>}
                {hasLive && <th className="pb-1 font-medium text-right">Δ</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((ing) => {
                const lc = liveCosto(ing)
                return (
                  <tr key={ing.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 pr-2 text-gray-800">{ing.nombre_ingrediente}</td>
                    <td className="py-1.5 text-right text-gray-500 whitespace-nowrap text-xs">
                      {ing.cantidad != null ? `${ing.cantidad} ${ing.unidad_medida ?? ''}` : '—'}
                    </td>
                    <td className="py-1.5 text-right font-mono text-gray-500">
                      {usd(ing.costo_ingrediente)}
                    </td>
                    {hasLive && (
                      <td className={`py-1.5 text-right font-mono font-medium ${lc == null ? 'text-gray-300' : 'text-gray-800'}`}>
                        {lc != null ? usd(lc) : <span className="text-gray-300 text-xs">sin enlace</span>}
                      </td>
                    )}
                    {hasLive && (
                      <td className="py-1.5 text-right">
                        <DeltaBadge snapshot={ing.costo_ingrediente} live={lc} />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative w-full max-w-lg bg-white h-full shadow-xl flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ background: '#D86835' }}>
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wide">{platillo.categoria}</p>
            <h3 className="text-base font-semibold text-white leading-tight">{platillo.nombre}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* Resumen de precios */}
        <div className="px-5 py-3 border-b grid grid-cols-3 gap-2 text-center flex-shrink-0 bg-orange-50">
          <div>
            <p className="text-xs text-gray-500">Costo/porción</p>
            <p className="font-semibold text-gray-800">{usd(platillo.costo_unitario)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Precio (c/IVA)</p>
            <p className="font-semibold text-orange-600">{usd(platillo.precio_con_iva)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Margen neto</p>
            <p className="font-semibold"><MargenBadge valor={platillo.porcentaje_margen} /></p>
          </div>
        </div>

        {/* Leyenda de columnas */}
        {hasLive && (
          <div className="px-5 py-2 flex items-center gap-4 text-xs border-b bg-blue-50 text-blue-700 flex-shrink-0">
            <span className="font-semibold">Costo ref.</span><span className="text-blue-400">= snapshot del costeo inicial</span>
            <span className="font-semibold">Costo real</span><span className="text-blue-400">= precio vivo del inventario</span>
          </div>
        )}

        {/* Ingredientes */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {platillo.ingredientes && platillo.ingredientes.length > 0 ? (
            <>
              {seccion('Ingredientes principales', principales, 'text-blue-600')}
              {seccion('Subrecetas / Acompañamientos', secundarios, 'text-purple-600')}
              {seccion('Empaque', empaque, 'text-gray-500')}

              {/* Totales snapshot vs live */}
              <div className="mt-4 pt-3 border-t">
                {hasLive ? (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Costo total de ingredientes</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Referencia (costeo)</p>
                        <p className="font-mono font-semibold text-gray-600">{usd(totalSnapshot)}</p>
                      </div>
                      <div className="text-gray-300 text-lg">→</div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Real (inventario)</p>
                        <p className={`font-mono font-bold ${
                          totalLive != null && totalLive > totalSnapshot * 1.05
                            ? 'text-red-600'
                            : totalLive != null && totalLive < totalSnapshot * 0.95
                              ? 'text-green-600'
                              : 'text-gray-800'
                        }`}>
                          {totalLive != null ? usd(totalLive) : '—'}
                        </p>
                      </div>
                      <div>
                        <DeltaBadge snapshot={totalSnapshot} live={totalLive} />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Costo insumos (receta)</p>
                    <p className="font-semibold">{usd(platillo.costo_porcion ? platillo.costo_porcion * platillo.porciones : null)}</p>
                    <p className="text-xs text-gray-400">{platillo.porciones} porción{platillo.porciones !== 1 ? 'es' : ''}/receta</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Precio delivery</p>
                    <p className="font-semibold text-orange-600">{usd(platillo.precio_delivery)}</p>
                    <p className="text-xs text-gray-400">+{pct(platillo.incremento_delivery)} entrega</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">Sin detalle de ingredientes disponible</p>
          )}
        </div>
      </aside>
    </div>
  )
}

export function Costeo() {
  const [platillos, setPlatillos] = useState<CosteoPlatillo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [seleccionado, setSeleccionado] = useState<CosteoPlatillo | null>(null)

  useEffect(() => {
    CosteoAPI.list()
      .then(setPlatillos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = useMemo(() => {
    return platillos.filter((p) => {
      const okCat = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro
      const okQ = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return okCat && okQ
    })
  }, [platillos, busqueda, categoriaFiltro])

  const abrirDetalle = (p: CosteoPlatillo) => {
    CosteoAPI.get(p.id)
      .then(setSeleccionado)
      .catch(() => setSeleccionado(p))
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando costeo...</div>
  if (error) return (
    <div className="p-6 text-red-600 bg-red-50 rounded-lg m-6">
      <p className="font-semibold">Error al cargar el costeo</p>
      <p className="text-sm mt-1">{error}</p>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Costeo de Platillos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Análisis de costos, márgenes y precios del menú Zensoci</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar platillo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Platillos', value: platillos.length },
          { label: 'Margen >60%', value: platillos.filter(p => (p.porcentaje_margen ?? 0) >= 0.6).length },
          { label: 'Margen 50–60%', value: platillos.filter(p => { const m = p.porcentaje_margen ?? 0; return m >= 0.5 && m < 0.6 }).length },
          { label: 'Margen <50%', value: platillos.filter(p => (p.porcentaje_margen ?? 0) < 0.5 && p.porcentaje_margen !== null).length },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-lg p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-orange-600">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase border-b bg-gray-50">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Platillo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Costo Unit.</th>
              <th className="px-4 py-3 text-right">Margen</th>
              <th className="px-4 py-3 text-right">Delivery</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin resultados</td>
              </tr>
            )}
            {filtrados.map((p) => (
              <tr key={p.id} className="hover:bg-orange-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{p.numero_menu}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                  <span className="line-clamp-1">{p.nombre}</span>
                  <span className="block text-xs text-gray-400">{p.porciones} porción{p.porciones !== 1 ? 'es' : ''}/receta</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.categoria}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-800">{usd(p.precio_con_iva)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-600">{usd(p.costo_unitario)}</td>
                <td className="px-4 py-3 text-right"><MargenBadge valor={p.porcentaje_margen} /></td>
                <td className="px-4 py-3 text-right font-mono text-orange-600">{usd(p.precio_delivery)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => abrirDetalle(p)}
                    className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors whitespace-nowrap"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {seleccionado && (
        <IngredientesDrawer
          platillo={seleccionado}
          onClose={() => setSeleccionado(null)}
        />
      )}
    </div>
  )
}
