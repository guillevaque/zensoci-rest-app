import { http } from './http';

export type MenuItem = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion?: string;
  activo: number;
};

export type MenuForm = Omit<MenuItem, 'id'>;

export const MenuService = {
  list: (params?: { q?: string; activo?: 0 | 1 }): Promise<MenuItem[]> => {
    const qs = new URLSearchParams();
    if (params?.q)          qs.set('q', params.q);
    if (params?.activo != null) qs.set('activo', String(params.activo));
    const query = qs.toString();
    return http.get(`/menu.php${query ? '?' + query : ''}`);
  },

  create: (data: MenuForm): Promise<{ ok: true; id: number }> =>
    http.post('/menu.php', data),

  update: (id: number, data: MenuForm): Promise<{ ok: true }> =>
    http.put(`/menu.php?id=${id}`, data),

  remove: (id: number): Promise<{ ok: true }> =>
    http.delete(`/menu.php?id=${id}`),
};
