// src/api/costeo.ts
import { http } from './http'

export type CosteoIngrediente = {
  id: number
  // Campos de la tabla unificada `ingredientes` (filas con costeo_platillo_id)
  nombre: string
  tipo: 'ingrediente' | 'subreceta' | 'empaque'
  tipo_receta: 'principal' | 'secundario' | 'empaque' | null
  cantidad: number | null
  unidad_medida: string | null
  porcentaje_merma: number
  precio_ref: number | null         // precio snapshot (costeo original)
  costo_linea: number | null        // costo total de la línea snapshot
  // Costo vivo del catálogo (calculado con self-join en costeo.php)
  precio_unitario_actual?: number | null
  // Campos de catálogo
  costo_unitario?: number | null
  unidad?: string | null
  categoria?: string | null
}

export type CosteoPlatillo = {
  id: number
  numero_menu: number
  nombre: string
  categoria: string
  porciones: number
  precio_con_iva: number | null
  precio_sin_iva: number | null
  costo_porcion: number | null
  costo_subreceta: number | null
  costo_empaque: number | null
  costo_unitario: number | null
  porcentaje_costo: number | null
  margen_unitario: number | null
  porcentaje_margen: number | null
  incremento_delivery: number | null
  precio_delivery: number | null
  precio_delivery_sin_iva: number | null
  activo: number
  ultima_actualizacion: string | null
  ingredientes?: CosteoIngrediente[]
}

export const CosteoAPI = {
  list: (params?: { q?: string; categoria?: string }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.categoria) qs.set('categoria', params.categoria)
    return http.get(`/costeo.php?${qs.toString()}`) as Promise<CosteoPlatillo[]>
  },
  get: (id: number) =>
    http.get(`/costeo.php?id=${id}`) as Promise<CosteoPlatillo>,
  update: (id: number, data: Partial<CosteoPlatillo>) =>
    http.send('PUT', `/costeo.php?id=${id}`, data) as Promise<{ ok: true }>,
}
