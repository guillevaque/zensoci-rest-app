import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Wraps routes that require authentication.
 * Shows a loading spinner while session is being verified.
 * Redirects to /login if not authenticated.
 * Redirects to / if authenticated but missing required role.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#F4F7F4',
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid #3C6030', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
