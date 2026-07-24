import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { http } from '../services/http';
import { ROUTE_ROLES } from '../config/roles';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function staticRoutesForRole(role) {
  return Object.entries(ROUTE_ROLES)
    .filter(([, roles]) => roles.includes(role))
    .map(([route]) => route);
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser]               = useState(null);
  const [allowedRoutes, setAllowedRoutes] = useState([]);
  const [loading, setLoading]         = useState(true);

  /** Carga permisos desde la API y actualiza allowedRoutes (usado por refreshPermissions) */
  const loadPermissions = useCallback(async (role) => {
    if (!role) { setAllowedRoutes([]); return; }
    const fallback = staticRoutesForRole(role);
    try {
      const data = await http.get('/auth/permissions.php');
      // Merge: servidor decide para rutas que conoce (están en BD);
      // para rutas nuevas (no en BD aún) usa el fallback estático.
      const serverAllowed = new Set(data.routes ?? []);
      const serverKnows   = new Set(data.known  ?? data.routes ?? []);
      const merged = [
        ...serverAllowed,
        ...fallback.filter(r => !serverKnows.has(r)),
      ];
      setAllowedRoutes([...new Set(merged)]);
    } catch {
      setAllowedRoutes(fallback);
    }
  }, []);

  // Al montar: me.php y permissions.php en PARALELO → 1 round-trip de latencia
  useEffect(() => {
    Promise.all([
      AuthService.me().catch(() => ({ user: null })),
      http.get('/auth/permissions.php').catch(() => null),
    ]).then(([{ user: u }, permsData]) => {
      setUser(u ?? null);
      if (u) {
        const fallback = staticRoutesForRole(u.role);
        if (permsData?.routes) {
          const serverAllowed = new Set(permsData.routes);
          const serverKnows   = new Set(permsData.known ?? permsData.routes);
          const merged = [...serverAllowed, ...fallback.filter(r => !serverKnows.has(r))];
          setAllowedRoutes([...new Set(merged)]);
        } else {
          setAllowedRoutes(fallback);
        }
      }
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loginPin = useCallback(async (userId, pin) => {
    const { user: u } = await AuthService.loginPin(userId, pin);
    setUser(u);
    // Menú aparece inmediatamente con valores estáticos; servidor sincroniza en background
    setAllowedRoutes(staticRoutesForRole(u.role));
    navigate('/dashboard', { replace: true });
    loadPermissions(u.role); // sin await — no bloquea la navegación
  }, [navigate, loadPermissions]);

  const loginEmail = useCallback(async (email, password) => {
    const { user: u } = await AuthService.loginEmail(email, password);
    setUser(u);
    setAllowedRoutes(staticRoutesForRole(u.role));
    navigate('/dashboard', { replace: true });
    loadPermissions(u.role);
  }, [navigate, loadPermissions]);

  const logout = useCallback(async () => {
    try { await AuthService.logout(); } catch { /* ignore */ }
    setUser(null);
    setAllowedRoutes([]);
    navigate('/login', { replace: true });
  }, [navigate]);

  /** Recarga permisos desde el servidor (llamar tras editar permisos en el panel admin) */
  const refreshPermissions = useCallback(() => {
    if (user?.role) loadPermissions(user.role);
  }, [user, loadPermissions]);

  const canAccess = useCallback(
    (route) => allowedRoutes.includes(route),
    [allowedRoutes]
  );

  const value = useMemo(
    () => ({ user, loading, loginPin, loginEmail, logout, canAccess, refreshPermissions }),
    [user, loading, loginPin, loginEmail, logout, canAccess, refreshPermissions]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
