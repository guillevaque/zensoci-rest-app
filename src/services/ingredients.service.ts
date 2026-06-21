import { http } from './http';

export type Ingredient = {
  id: number;
  nombre: string;
  categoria: string;
  proveedor: string;
  unidad: string;
  stock: number;
  minimo: number;
  costo: number;
};

export type IngredientForm = Omit<Ingredient, 'id'>;

export const IngredientsService = {
  list: (params?: { q?: string; filter?: 'bajo' | 'agotados' }): Promise<Ingredient[]> => {
    const qs = new URLSearchParams();
    if (params?.q)      qs.set('q', params.q);
    if (params?.filter) qs.set('filter', params.filter);
    const query = qs.toString();
    return http.get(`/ingredients.php${query ? '?' + query : ''}`);
  },

  create: (data: IngredientForm): Promise<{ ok: true; id: number }> =>
    http.post('/ingredients.php', data),

  update: (id: number, data: IngredientForm): Promise<{ ok: true }> =>
    http.put(`/ingredients.php?id=${id}`, data),

  remove: (id: number): Promise<{ ok: true }> =>
    http.delete(`/ingredients.php?id=${id}`),
};
