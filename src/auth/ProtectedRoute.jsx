import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Protege rutas que requieren autenticación.
 * Props:
 *   route  — ruta a proteger usando permisos dinámicos del servidor (recomendado)
 *   roles  — lista de roles permitidos, fallback estático (legacy)
 */
export default function ProtectedRoute({ children, route, roles }) {
  const { user, loading, canAccess } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F4F7F4' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #3C6030', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Check dinámico por ruta (permisos del servidor)
  if (route && !canAccess(route)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check estático por lista de roles (legacy)
  if (!route && roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
