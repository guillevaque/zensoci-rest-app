// frontend/src/lib/api.ts
export const API_BASE = '/api'; // mismo subdominio (app.zensoci.com)

export type Ingrediente = {
  id: number;
  nombre: string;
  categoria: string;
  proveedor: string;
  unidad: string;
  stock: number;
  minimo: number;
  costo: number;
};

// frontend/src/lib/api.ts
async function jsonOrText(res: Response) {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  const txt = await res.text()
  throw new Error(txt.slice(0, 140) || 'Respuesta no JSON')
}

export async function listIngredientes(params?: { q?: string; filter?: 'bajo'|'agotados' }) {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.filter) qs.set('filter', params.filter)
  const res = await fetch(`/api/ingredients.php?${qs.toString()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return jsonOrText(res)
}

export async function crearIngrediente(payload: Partial<Ingrediente>) {
  const res = await fetch(`${API_BASE}/ingredients.php`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear ingrediente');
  return res.json();
}

export async function editarIngrediente(id: number, payload: Partial<Ingrediente>) {
  const res = await fetch(`${API_BASE}/ingredients.php?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al editar ingrediente');
  return res.json();
}

export async function eliminarIngrediente(id: number) {
  const res = await fetch(`${API_BASE}/ingredients.php?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar ingrediente');
  return res.json();
}
