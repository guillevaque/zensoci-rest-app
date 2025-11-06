// frontend/src/lib/apiMenu.ts
export const API_BASE = '/api'; // mismo subdominio (app.zensoci.com)
// === MENÚ ===
export type MenuItem = {
  id: number;
  nombre: string;
  categoria?: string | null;
  precio: number;
  descripcion?: string | null;
  activo?: number; // 1 | 0
};

// frontend/src/lib/apiMenu.ts
async function jsonOrText(res: Response) {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  const txt = await res.text()
  throw new Error(txt.slice(0, 140) || 'Respuesta no JSON')
}

// lee JSON seguro (por si tu menu.php usa otra clave "descripcioN" por error tipográfico)
function pickDescripcion(row: any) {
  if (!row) return '';
  return row.descripcion ?? row.descripcion ?? '';
}

export async function listMenuItems(params?: { q?: string; categoria?: string }) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.categoria) qs.set('categoria', params.categoria);
  const res = await fetch(`${API_BASE}/menu.php?${qs.toString()}`, { credentials: 'include' });
  const data = await jsonOrText(res);
  return (Array.isArray(data) ? data : []).map((r: any) => ({
    id: Number(r.id),
    nombre: String(r.nombre ?? ''),
    categoria: r.categoria ?? null,
    precio: Number(r.precio ?? 0),
    descripcion: pickDescripcion(r),
    activo: r.activo != null ? Number(r.activo) : 1,
  })) as MenuItem[];
}

export async function crearMenuItem(payload: Partial<MenuItem>) {
  const res = await fetch(`${API_BASE}/menu.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al crear platillo');
  return res.json() as Promise<{ ok: true; id: number }>;
}

export async function editarMenuItem(id: number, payload: Partial<MenuItem>) {
  const res = await fetch(`${API_BASE}/menu.php?id=${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al editar platillo');
  return res.json() as Promise<{ ok: true }>;
}

export async function eliminarMenuItem(id: number) {
  const res = await fetch(`${API_BASE}/menu.php?id=${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error al eliminar platillo');
  return res.json() as Promise<{ ok: true }>;
}
