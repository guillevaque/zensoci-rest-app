import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  // ── On mount: check existing session ─────────────────────────────────────
  useEffect(() => {
    AuthService.me()
      .then(({ user }) => setUser(user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // ── PIN login (main flow) ─────────────────────────────────────────────────
  const loginPin = useCallback(async (userId, pin) => {
    const { user } = await AuthService.loginPin(userId, pin);
    setUser(user);
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  // ── Email login (admin fallback) ──────────────────────────────────────────
  const loginEmail = useCallback(async (email, password) => {
    const { user } = await AuthService.loginEmail(email, password);
    setUser(user);
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await AuthService.logout(); } catch { /* ignore */ }
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({ user, loading, loginPin, loginEmail, logout }),
    [user, loading, loginPin, loginEmail, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
