import { http } from './http';
import type {
  Cliente,
  ClientesPage,
  CreateCliente,
  UpdateCliente,
  ClienteDireccion,
  CreateClienteDireccion,
  UpdateClienteDireccion,
} from '../types/dte';

export type ClientesQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  activo?: 0 | 1;
};

function buildQs(params: Record<string, string | number | undefined>): string {
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length ? '?' + pairs.join('&') : '';
}

export const ClientesService = {
  getAll: (query: ClientesQuery = {}): Promise<ClientesPage> =>
    http.get('/facturacion/clientes.php' + buildQs({
      page:     query.page     ?? 1,
      per_page: query.per_page ?? 25,
      q:        query.q        ?? undefined,
      activo:   query.activo   ?? 1,
    })),

  getById: (id: number): Promise<Cliente> =>
    http.get(`/facturacion/clientes.php?id=${id}`),

  create: (data: CreateCliente): Promise<Cliente> =>
    http.post('/facturacion/clientes.php', data),

  update: (data: UpdateCliente): Promise<Cliente> =>
    http.put('/facturacion/clientes.php', data),

  setActivo: (id: number, activo: boolean): Promise<{ ok: boolean }> =>
    http.patch('/facturacion/clientes.php', { id, activo }),

  // ── Direcciones ──────────────────────────────────────────────────────────
  getDirecciones: (clienteId: number): Promise<ClienteDireccion[]> =>
    http.get(`/facturacion/direcciones.php?cliente_id=${clienteId}`),

  addDireccion: (data: CreateClienteDireccion): Promise<ClienteDireccion> =>
    http.post('/facturacion/direcciones.php', data),

  updateDireccion: (data: UpdateClienteDireccion): Promise<ClienteDireccion> =>
    http.put('/facturacion/direcciones.php', data),

  setPrincipal: (id: number): Promise<{ ok: boolean }> =>
    http.patch('/facturacion/direcciones.php', { id, es_principal: true }),

  deleteDireccion: (id: number): Promise<{ ok: boolean }> =>
    http.delete(`/facturacion/direcciones.php?id=${id}`),
};
