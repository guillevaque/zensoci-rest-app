import React from 'react';
import { useAllPermissions } from '../hooks/usePermissions';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS, type AppRole } from '../config/roles';

const ROUTES: { route: string; label: string }[] = [
  { route: '/dashboard',  label: 'Dashboard' },
  { route: '/mesas',      label: 'Mesas' },
  { route: '/pedidos',    label: 'Pedidos' },
  { route: '/menu',       label: 'Menú' },
  { route: '/inventario', label: 'Inventario' },
  { route: '/reportes',   label: 'Reportes' },
  { route: '/costeo',     label: 'Costeo' },
  { route: '/personal',   label: 'Personal' },
  { route: '/ajustes',    label: 'Configuración' },
];

const EDITABLE_ROLES: AppRole[] = ['staff', 'contador'];

export default function PermissionsPanel() {
  const { refreshPermissions } = useAuth();
  const { permissions, loading, error, updatePermission } = useAllPermissions();
  const [saving, setSaving] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #3C6030', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: '#C0392B', padding: 16 }}>{error}</p>;
  }

  const handleToggle = async (role: string, route: string, current: boolean) => {
    const key = `${role}:${route}`;
    setSaving(key);
    try {
      await updatePermission(role, route, !current);
      refreshPermissions();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--zs-ink)', marginBottom: 4 }}>
        Permisos por Rol
      </h2>
      <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-ink)', opacity: 0.55, marginBottom: 24 }}>
        Los permisos de Gerente no se pueden modificar.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--zs-font-mono)', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 16px', borderBottom: '2px solid #E8EDE8', color: 'var(--zs-ink)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Módulo
              </th>
              {/* Manager column — read-only */}
              <th style={{ padding: '10px 16px', borderBottom: '2px solid #E8EDE8', color: 'var(--zs-ink)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
                {ROLE_LABELS['manager']}
              </th>
              {EDITABLE_ROLES.map(role => (
                <th key={role} style={{ padding: '10px 16px', borderBottom: '2px solid #E8EDE8', color: 'var(--zs-green)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROUTES.map((r, idx) => (
              <tr key={r.route} style={{ background: idx % 2 === 0 ? '#FAFBFA' : '#fff' }}>
                <td style={{ padding: '12px 16px', color: 'var(--zs-ink)', fontWeight: 600, borderBottom: '1px solid #E8EDE8' }}>
                  {r.label}
                </td>
                {/* Manager siempre tiene acceso — no editable */}
                <td style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '1px solid #E8EDE8' }}>
                  <span style={{ fontSize: 18, opacity: 0.4 }}>🔒</span>
                </td>
                {EDITABLE_ROLES.map(role => {
                  const allowed = permissions[role]?.[r.route] ?? false;
                  const key = `${role}:${r.route}`;
                  const isSaving = saving === key;
                  return (
                    <td key={role} style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '1px solid #E8EDE8' }}>
                      <button
                        disabled={isSaving}
                        onClick={() => handleToggle(role, r.route, allowed)}
                        style={{
                          width: 44, height: 24, borderRadius: 12,
                          background: allowed ? 'var(--zs-green)' : '#D0D5CE',
                          border: 'none', cursor: isSaving ? 'wait' : 'pointer',
                          position: 'relative', transition: 'background 0.2s',
                          opacity: isSaving ? 0.6 : 1,
                        }}
                        title={allowed ? 'Quitar acceso' : 'Dar acceso'}
                      >
                        <span style={{
                          position: 'absolute', top: 3, left: allowed ? 22 : 3,
                          width: 18, height: 18, borderRadius: 9,
                          background: '#fff', transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
