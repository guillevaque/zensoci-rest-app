import { useState, useEffect, useCallback } from 'react';
import { http } from '../services/http';
import { ROUTE_ROLES, type AppRole } from '../config/roles';

type PermissionsMap = Record<string, Record<string, boolean>>; // { role: { route: allowed } }

let cachedAll: PermissionsMap | null = null;

export function usePermissions(role: string | undefined) {
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) { setLoading(false); return; }

    http.get('/auth/permissions.php')
      .then((data: { routes: string[] }) => setAllowedRoutes(data.routes ?? []))
      .catch(() => {
        // Fallback a permisos estáticos si la API falla
        const staticRoutes = Object.entries(ROUTE_ROLES)
          .filter(([, roles]) => roles.includes(role as AppRole))
          .map(([route]) => route);
        setAllowedRoutes(staticRoutes);
      })
      .finally(() => setLoading(false));
  }, [role]);

  const canAccess = useCallback(
    (route: string) => allowedRoutes.includes(route),
    [allowedRoutes]
  );

  return { allowedRoutes, canAccess, loading };
}

/** Solo para el panel de admin — carga permisos de todos los roles */
export function useAllPermissions() {
  const [permissions, setPermissions] = useState<PermissionsMap>(cachedAll ?? {});
  const [loading, setLoading]         = useState(!cachedAll);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    http.get('/auth/permissions.php?all=1')
      .then((data: PermissionsMap) => {
        cachedAll = data;
        setPermissions(data);
      })
      .catch(() => setError('No se pudieron cargar los permisos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updatePermission = useCallback(
    async (role: string, route: string, allowed: boolean) => {
      await http.put('/auth/permissions.php', { role, route, allowed });
      cachedAll = null; // invalida caché
      load();
    },
    [load]
  );

  return { permissions, loading, error, updatePermission, reload: load };
}
