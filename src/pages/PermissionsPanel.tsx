import React, { useState } from 'react';
import { FiChevronRight, FiArrowLeft, FiLock } from 'react-icons/fi';
import { useAllPermissions } from '../hooks/usePermissions';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS, type AppRole } from '../config/roles';

const ROUTES: { route: string; label: string; icon: string }[] = [
  { route: '/dashboard',  label: 'Dashboard',     icon: '⊞' },
  { route: '/mesas',      label: 'Mesas',          icon: '⬡' },
  { route: '/pedidos',    label: 'Pedidos',        icon: '≡' },
  { route: '/menu',       label: 'Menú',           icon: '⊟' },
  { route: '/inventario', label: 'Inventario',     icon: '⬡' },
  { route: '/reportes',   label: 'Reportes',       icon: '↗' },
  { route: '/costeo',     label: 'Costeo',         icon: '$' },
  { route: '/personal',   label: 'Personal',       icon: '⊕' },
  { route: '/ajustes',    label: 'Configuración',  icon: '⚙' },
];

const ALL_ROLES: { role: AppRole; editable: boolean }[] = [
  { role: 'manager',  editable: false },
  { role: 'staff',    editable: true  },
  { role: 'contador', editable: true  },
];

const ROLE_COLORS: Record<AppRole, { bg: string; text: string; badge: string }> = {
  manager:  { bg: '#3C6030', text: '#fff',     badge: '#5B8C3A' },
  staff:    { bg: '#1A3A5C', text: '#fff',     badge: '#2E6DA4' },
  contador: { bg: '#7B4F00', text: '#fff',     badge: '#B07300' },
};

function Toggle({ allowed, saving, onToggle }: { allowed: boolean; saving: boolean; onToggle: () => void }) {
  return (
    <button
      disabled={saving}
      onClick={onToggle}
      aria-label={allowed ? 'Quitar acceso' : 'Dar acceso'}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: allowed ? 'var(--zs-green)' : '#C8CEC8',
        border: 'none', cursor: saving ? 'wait' : 'pointer',
        position: 'relative', transition: 'background 0.2s',
        opacity: saving ? 0.6 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: allowed ? 22 : 3,
        width: 18, height: 18, borderRadius: 9, background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}

// ── Vista de detalle de un rol ─────────────────────────────────────────────
function RoleDetail({
  role, editable, permissions, onBack, onToggle, saving,
}: {
  role: AppRole;
  editable: boolean;
  permissions: Record<string, boolean>;
  onBack: () => void;
  onToggle: (route: string, current: boolean) => void;
  saving: string | null;
}) {
  const colors = ROLE_COLORS[role];
  const allowed = ROUTES.filter(r => permissions[r.route]).length;

  return (
    <div>
      {/* Header del detalle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--zs-green)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--zs-font-mono)', fontSize: 13, fontWeight: 700, padding: '6px 10px 6px 6px', borderRadius: 8, transition: 'background 0.15s' }}
          className="hover:bg-black/[0.05]"
        >
          <FiArrowLeft size={16} /> Roles
        </button>
        <span style={{ color: 'var(--zs-mute)', fontSize: 13 }}>/</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: colors.text, fontSize: 13, fontWeight: 700 }}>
              {ROLE_LABELS[role][0]}
            </span>
          </div>
          <span style={{ fontFamily: 'var(--zs-font-display)', fontWeight: 700, fontSize: 17, color: 'var(--zs-ink)' }}>
            {ROLE_LABELS[role]}
          </span>
          {!editable && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0F4F0', borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)' }}>
              <FiLock size={10} /> Solo lectura
            </span>
          )}
        </div>
      </div>

      {/* Contador de accesos */}
      <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', marginBottom: 16 }}>
        {allowed} de {ROUTES.length} módulos con acceso
      </p>

      {/* Lista de permisos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ROUTES.map((r, idx) => {
          const isAllowed = permissions[r.route] ?? false;
          const isSaving  = saving === `${role}:${r.route}`;
          return (
            <div
              key={r.route}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px', borderRadius: 10,
                background: idx % 2 === 0 ? '#F7FAF7' : '#fff',
                border: '1px solid #EDF1ED',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isAllowed ? `${colors.bg}18` : '#F0F0F0',
                  color: isAllowed ? colors.bg : '#AAA',
                  fontFamily: 'var(--zs-font-mono)', fontSize: 13, fontWeight: 700,
                  transition: 'background 0.2s, color 0.2s',
                }}>
                  {r.icon}
                </div>
                <span style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 600, fontSize: 14, color: isAllowed ? 'var(--zs-ink)' : 'var(--zs-mute)' }}>
                  {r.label}
                </span>
              </div>
              {editable
                ? <Toggle allowed={isAllowed} saving={isSaving} onToggle={() => onToggle(r.route, isAllowed)} />
                : <FiLock size={14} color="#C8CEC8" />
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista principal: tarjetas de roles ────────────────────────────────────
export default function PermissionsPanel() {
  const { refreshPermissions } = useAuth();
  const { permissions, loading, error, updatePermission } = useAllPermissions();
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (role: AppRole, route: string, current: boolean) => {
    const key = `${role}:${route}`;
    setSaving(key);
    try {
      await updatePermission(role, route, !current);
      refreshPermissions();
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #3C6030', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <p style={{ color: '#C0392B', fontFamily: 'var(--zs-font-mono)', fontSize: 13, margin: 0 }}>{error}</p>
      </div>
    );
  }

  // Vista de detalle
  if (selectedRole) {
    const roleInfo = ALL_ROLES.find(r => r.role === selectedRole)!;
    return (
      <RoleDetail
        role={selectedRole}
        editable={roleInfo.editable}
        permissions={permissions[selectedRole] ?? {}}
        onBack={() => setSelectedRole(null)}
        onToggle={(route, current) => handleToggle(selectedRole, route, current)}
        saving={saving}
      />
    );
  }

  // Vista de tarjetas
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--zs-ink)', marginBottom: 4 }}>
        Permisos por Rol
      </h2>
      <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', marginBottom: 20 }}>
        Selecciona un rol para ver y editar sus permisos de acceso.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ALL_ROLES.map(({ role, editable }) => {
          const colors = ROLE_COLORS[role];
          const rolePerms = permissions[role] ?? {};
          const allowedCount = ROUTES.filter(r => rolePerms[r.route]).length;

          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 12,
                background: '#fff', border: '1px solid #E8EDE8',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              className="hover:border-[#3C6030]/40 hover:shadow-sm"
            >
              {/* Avatar del rol */}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: colors.text, fontFamily: 'var(--zs-font-display)', fontSize: 20, fontWeight: 700 }}>
                  {ROLE_LABELS[role][0]}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--zs-ink)' }}>
                    {ROLE_LABELS[role]}
                  </span>
                  {!editable && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#F0F4F0', borderRadius: 5, padding: '1px 6px', fontFamily: 'var(--zs-font-mono)', fontSize: 10, color: 'var(--zs-mute)' }}>
                      <FiLock size={9} /> Fijo
                    </span>
                  )}
                </div>
                {/* Barra de progreso de accesos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#E8EDE8', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(allowedCount / ROUTES.length) * 100}%`, background: colors.bg, borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)', flexShrink: 0 }}>
                    {allowedCount}/{ROUTES.length} módulos
                  </span>
                </div>
              </div>

              <FiChevronRight size={18} color="var(--zs-mute)" style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
