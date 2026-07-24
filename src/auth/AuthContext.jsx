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

  const loadPermissions = useCallback(async (role) => {
    if (!role) { setAllowedRoutes([]); return; }
    try {
      const data = await http.get('/auth/permissions.php');
      setAllowedRoutes(data.routes ?? staticRoutesForRole(role));
    } catch {
      setAllowedRoutes(staticRoutesForRole(role));
    }
  }, []);

  // On mount: verify existing session
  useEffect(() => {
    AuthService.me()
      .then(async ({ user: u }) => {
        setUser(u ?? null);
        if (u) await loadPermissions(u.role);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [loadPermissions]);

  const loginPin = useCallback(async (userId, pin) => {
    const { user: u } = await AuthService.loginPin(userId, pin);
    setUser(u);
    await loadPermissions(u.role);
    navigate('/dashboard', { replace: true });
  }, [navigate, loadPermissions]);

  const loginEmail = useCallback(async (email, password) => {
    const { user: u } = await AuthService.loginEmail(email, password);
    setUser(u);
    await loadPermissions(u.role);
    navigate('/dashboard', { replace: true });
  }, [navigate, loadPermissions]);

  const logout = useCallback(async () => {
    try { await AuthService.logout(); } catch { /* ignore */ }
    setUser(null);
    setAllowedRoutes([]);
    navigate('/login', { replace: true });
  }, [navigate]);

  /** Recarga permisos desde la API (útil tras editar permisos en el panel admin) */
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
