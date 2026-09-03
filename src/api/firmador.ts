// src/api/firmador.ts — API module for Firmador DTE diagnostics
import { http } from '../services/http'

export type FirmadorStatusResponse = {
  available: boolean
  message: string
  latency_ms: number | null
  firmador_url: string | null
  checked_at: string
}

export type FirmadorProbarResponse = {
  diagnostico: string
  status: string
  mensaje: string | null
  firmador_url: string | null
  tested_at: string
  nota: string
}

export const FirmadorAPI = {
  status: () =>
    http.get('/facturacion/dte/firmador-status.php') as Promise<FirmadorStatusResponse>,

  probar: () =>
    http.post('/facturacion/dte/firmador-probar.php') as Promise<FirmadorProbarResponse>,
}
