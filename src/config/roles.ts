/**
 * Fuente única de verdad para roles y permisos de la aplicación.
 * Para agregar un rol nuevo: añádelo a AppRole, ROLE_LABELS y ROUTE_ROLES.
 * Para cambiar permisos de una ruta: edita solo ROUTE_ROLES.
 */

export type AppRole =
  | 'admin'
  | 'manager'
  | 'gerente'
  | 'mesero'
  | 'cocina'
  | 'caja'
  | 'contador'
  | 'staff';

export const ROLE_LABELS: Record<AppRole, string> = {
  admin:    'Administrador',
  manager:  'Manager',
  gerente:  'Gerente',
  mesero:   'Mesero',
  cocina:   'Cocina',
  caja:     'Caja',
  contador: 'Contador',
  staff:    'Personal',
};

/**
 * Permisos por defecto (fallback si la API no responde).
 * La fuente de verdad real está en role_permissions en DB.
 */
export const ROUTE_ROLES: Record<string, AppRole[]> = {
  '/dashboard':  ['admin', 'manager', 'gerente', 'mesero', 'cocina', 'caja', 'contador', 'staff'],
  '/mesas':      ['admin', 'manager', 'gerente', 'mesero', 'caja', 'staff'],
  '/pedidos':    ['admin', 'manager', 'gerente', 'mesero', 'cocina', 'caja', 'staff'],
  '/menu':       ['admin', 'manager', 'gerente', 'mesero', 'staff'],
  '/inventario': ['admin', 'manager', 'gerente', 'contador'],
  '/reportes':   ['admin', 'manager', 'gerente', 'caja', 'contador'],
  '/costeo':     ['admin', 'manager', 'gerente', 'contador'],
  '/personal':   ['admin', 'manager', 'gerente'],
  '/ajustes':    ['admin', 'manager'],
};

export function canAccess(role: string | undefined, route: string): boolean {
  if (!role) return false;
  const allowed = ROUTE_ROLES[route];
  if (!allowed) return true;
  return allowed.includes(role as AppRole);
}
