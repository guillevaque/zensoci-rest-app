// src/api/menu.ts
import { http } from './http'

export type MenuItem = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion?: string;
  activo?: number; // 1|0
};

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
};
