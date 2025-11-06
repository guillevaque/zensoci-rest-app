// src/api/ingredients.ts
import { http } from './http'

export type Ingredient = {
  id:number; nombre:string; categoria:string; proveedor:string;
  unidad:string; stock:number; minimo:number; costo:number;
}

export const IngredientsAPI = {
  list: (params?: { q?:string; filter?: 'bajo'|'agotados' }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.filter) qs.set('filter', params.filter)
    return http.get(`/ingredients.php?${qs.toString()}`) as Promise<Ingredient[]>
  },
  create: (data: Partial<Ingredient>) =>
    http.send('POST','/ingredients.php', data) as Promise<{ ok:true; id:number }>,
  update: (id:number, data: Partial<Ingredient>) =>
    http.send('PUT', `/ingredients.php?id=${id}`, data) as Promise<{ ok:true }>,
  remove: (id:number) =>
    http.send('DELETE', `/ingredients.php?id=${id}`) as Promise<{ ok:true }>,
}
