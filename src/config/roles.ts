/**
 * Fuente única de verdad para roles y permisos de la aplicación.
 * Para agregar un rol nuevo: añádelo a AppRole, ROLE_LABELS y ROUTE_ROLES.
 * Para cambiar permisos de una ruta: edita solo ROUTE_ROLES.
 */

export type AppRole = 'manager' | 'staff' | 'contador';

export const ROLE_LABELS: Record<AppRole, string> = {
  manager:  'Gerente',
  staff:    'Personal',
  contador: 'Contabilidad',
};

/**
 * Qué roles pueden acceder a cada ruta.
 * Una ruta sin entrada es accesible para cualquier usuario autenticado.
 */
export const ROUTE_ROLES: Record<string, AppRole[]> = {
  '/dashboard':  ['manager', 'staff', 'contador'],
  '/mesas':      ['manager', 'staff'],
  '/pedidos':    ['manager', 'staff'],
  '/menu':       ['manager', 'staff'],
  '/inventario': ['manager', 'contador'],
  '/reportes':   ['manager', 'contador'],
  '/costeo':     ['manager', 'contador'],
  '/personal':   ['manager'],
  '/ajustes':    ['manager'],
};

export function canAccess(role: string | undefined, route: string): boolean {
  if (!role) return false;
  const allowed = ROUTE_ROLES[route];
  if (!allowed) return true;
  return allowed.includes(role as AppRole);
}
