import { http } from './http'
import type { Venta, VentaDetalle, VentaItemDraft, PagoDraft, CanalVenta } from '../types/ventas'

export interface VentasQuery {
  page?:         number
  per_page?:     number
  estado?:       string
  canal?:        CanalVenta
  fecha_desde?:  string
  fecha_hasta?:  string
  q?:            string
}

export interface VentasListResponse {
  data:      Venta[]
  total:     number
  page:      number
  per_page:  number
  last_page: number
}

function qs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const VentasService = {
  getAll: (query: VentasQuery = {}): Promise<VentasListResponse> =>
    http.get(`/facturacion/ventas.php${qs(query as Record<string, string | number | undefined>)}`),

  getById: (id: number): Promise<VentaDetalle> =>
    http.get(`/facturacion/ventas.php?id=${id}`),

  create: (data: {
    cliente_id?:         number
    canal?:              CanalVenta
    referencia_externa?: string
    fecha_venta?:        string
    items?:              VentaItemDraft[]
    observaciones?:      string
    idempotency_key?:    string
    costo_envio?:        number
    propina?:            number
    total_no_sujeto?:    number
    total_exento?:       number
    total_gravado?:      number
    subtotal_ventas?:    number
    total_descuento?:    number
    iva_total?:          number
    monto_total_operacion?: number
    total_pagar?:        number
  }): Promise<Venta> =>
    http.post('/facturacion/ventas.php', data),

  update: (data: { id: number } & Partial<Parameters<typeof VentasService.create>[0]>): Promise<Venta> =>
    http.put('/facturacion/ventas.php', data),

  cerrar: (id: number): Promise<Venta> =>
    http.post('/facturacion/ventas.php', { accion: 'cerrar', id }),

  anular: (id: number): Promise<{ ok: boolean; id: number; estado: string }> =>
    http.post('/facturacion/ventas.php', { accion: 'anular', id }),

  getPagos: (ventaId: number) =>
    http.get(`/facturacion/pagos.php?venta_id=${ventaId}`),

  addPago: (data: { venta_id: number } & PagoDraft) =>
    http.post('/facturacion/pagos.php', data),

  deletePago: (id: number) =>
    http.delete(`/facturacion/pagos.php?id=${id}`),
}
