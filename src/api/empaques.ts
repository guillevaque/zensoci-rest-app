// src/api/empaques.ts
import { http } from './http'

export type Empaque = {
  id: number
  name: string
  category_label?: string | null
  brand?: string | null
  supplier?: string | null
  presentation?: string | null
  unit?: string | null
  units_per_pack?: number | null
  purchase_price_no_iva?: number | null
  unit_cost?: number | null
  stock_qty?: number | null
  min_stock?: number | null
  activo?: number
}

export const EmpaquesAPI = {
  list: (params?: { q?: string; filter?: 'bajo' | 'agotados' }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.filter) qs.set('filter', params.filter)
    return http.get(`/empaques.php?${qs.toString()}`) as Promise<Empaque[]>
  },
  create: (data: Partial<Empaque>) =>
    http.send('POST', '/empaques.php', data) as Promise<{ ok: true; id: number }>,
  update: (id: number, data: Partial<Empaque>) =>
    http.send('PUT', `/empaques.php?id=${id}`, data) as Promise<{ ok: true }>,
  remove: (id: number) =>
    http.send('DELETE', `/empaques.php?id=${id}`) as Promise<{ ok: true }>,
}
