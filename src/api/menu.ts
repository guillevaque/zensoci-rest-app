// src/api/menu.ts
import { http, HTTP_API_BASE } from './http'

export type MenuItem = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion?: string;
  image_url?: string;
  activo?: number; // 1|0
};

// Deriva el origen del sitio desde la base de la API (ej. "https://app.zensoci.com/api" → "https://app.zensoci.com")
// En dev con proxy, API_BASE es "/api", así que el origen es "" (mismo origen = localhost:5173)
const SITE_ORIGIN = HTTP_API_BASE.replace(/\/api\/?$/, '').replace(/^\/api\/?$/, '');

export const MenuAPI = {
  list: (params?: { q?:string; categoria?:string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.categoria) qs.set('categoria', params.categoria);
    return http.get(`/menu.php?${qs.toString()}`) as Promise<MenuItem[]>;
  },
  create: (data: Partial<MenuItem>) =>
    http.send('POST', '/menu.php', data) as Promise<{ ok:true; id:number }>,
  update: (id:number, data: Partial<MenuItem>) =>
    http.send('PUT', `/menu.php?id=${id}`, data) as Promise<{ ok:true }>,
  remove: (id:number) =>
    http.send('DELETE', `/menu.php?id=${id}`) as Promise<{ ok:true }>,

  uploadImage: async (file: File): Promise<{ ok: true; url: string }> => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await http.upload('/upload.php', fd) as { ok: boolean; path?: string; url?: string };

    // El servidor devuelve "path" (relativo) — construimos la URL absoluta
    const raw = res.path ?? res.url ?? '';
    const url = raw.startsWith('http')
      ? raw
      : SITE_ORIGIN + (raw.startsWith('/') ? raw : '/' + raw);

    return { ok: true, url };
  },
};
