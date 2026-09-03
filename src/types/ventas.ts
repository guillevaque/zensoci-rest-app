export type EstadoVenta = 'BORRADOR' | 'COMPLETADA' | 'ANULADA'

export type CanalVenta = 'MANUAL' | 'PEDIDOS_YA' | 'WEB' | 'APP' | 'OTRO'

export type FormaPago = '01' | '02' | '03' | '04' | '99'

export const FORMAS_PAGO: Record<FormaPago, string> = {
  '01': 'Efectivo',
  '02': 'Tarjeta',
  '03': 'Transferencia',
  '04': 'Cheque',
  '99': 'Otro',
}

export const CANALES_VENTA: Record<CanalVenta, string> = {
  MANUAL:     'Manual',
  PEDIDOS_YA: 'PedidosYa',
  WEB:        'Web',
  APP:        'App',
  OTRO:       'Otro',
}

export type TipoItem = 1 | 2 | 3 | 4
export const TIPOS_ITEM: Record<TipoItem, string> = {
  1: 'Bien',
  2: 'Servicio',
  3: 'Ambos',
  4: 'Cargo',
}

export interface VentaItem {
  id:               number
  venta_id:         number
  numero_item:      number
  descripcion:      string
  codigo_producto:  string | null
  cantidad:         number
  precio_unitario:  number
  descuento:        number
  tipo_item:        TipoItem
  no_gravado:       0 | 1
  exento:           0 | 1
  total_gravado:    number
  total_exento:     number
  total_no_sujeto:  number
  created_at:       string
}

export interface Pago {
  id:           number
  venta_id:     number
  forma_pago:   FormaPago
  referencia:   string | null
  monto:        number
  created_by:   number
  created_at:   string
  cajero?:      string
}

export interface Venta {
  id:                     number
  numero:                 number
  cliente_id:             number
  canal:                  CanalVenta
  referencia_externa:     string | null
  fecha_venta:            string
  fecha_hora_emision:     string
  completed_at:           string | null
  total_no_sujeto:        number
  total_exento:           number
  total_gravado:          number
  subtotal_ventas:        number
  total_descuento:        number
  iva_total:              number
  costo_envio:            number
  propina:                number
  monto_total_operacion:  number
  total_pagar:            number
  estado:                 EstadoVenta
  idempotency_key:        string | null
  observaciones:          string | null
  created_by:             number
  updated_by:             number | null
  created_at:             string
  updated_at:             string
  // joined
  cliente_nombre?:  string
  cliente_nit?:     string | null
  cliente_nrc?:     string | null
  tipo_persona?:    string
  es_contribuyente?: 0 | 1
}

export interface VentaDetalle extends Venta {
  items: VentaItem[]
  pagos: Pago[]
}

export interface VentaItemDraft {
  numero_item:      number
  descripcion:      string
  codigo_producto:  string
  cantidad:         number
  precio_unitario:  number
  descuento:        number
  tipo_item:        TipoItem
  no_gravado:       boolean
  exento:           boolean
}

export interface PagoDraft {
  forma_pago:   FormaPago
  referencia:   string
  monto:        number
}

export function calcularTotales(items: VentaItemDraft[]): {
  total_no_sujeto:        number
  total_exento:           number
  total_gravado:          number
  subtotal_ventas:        number
  total_descuento:        number
  iva_total:              number
  monto_total_operacion:  number
  total_pagar:            number
} {
  const IVA_RATE = 0.13

  let totalNoSujeto = 0
  let totalExento   = 0
  let totalGravado  = 0
  let totalDescuento = 0

  for (const item of items) {
    const bruto = round2(item.cantidad * item.precio_unitario)
    const desc  = round2(item.descuento)
    const neto  = round2(bruto - desc)
    totalDescuento = round2(totalDescuento + desc)

    if (item.no_gravado) {
      totalNoSujeto = round2(totalNoSujeto + neto)
    } else if (item.exento) {
      totalExento = round2(totalExento + neto)
    } else {
      totalGravado = round2(totalGravado + neto)
    }
  }

  const subtotalVentas = round2(totalNoSujeto + totalExento + totalGravado)
  const ivaTotal       = round2(totalGravado * IVA_RATE)
  const montoTotal     = round2(subtotalVentas + ivaTotal)

  return {
    total_no_sujeto:       totalNoSujeto,
    total_exento:          totalExento,
    total_gravado:         totalGravado,
    subtotal_ventas:       subtotalVentas,
    total_descuento:       totalDescuento,
    iva_total:             ivaTotal,
    monto_total_operacion: montoTotal,
    total_pagar:           montoTotal,
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
