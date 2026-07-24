import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUserPlus, FiEdit2, FiPower, FiTrash2, FiX, FiEye, FiEyeOff, FiAlertCircle,
} from 'react-icons/fi';
import { ROLE_LABELS, type AppRole } from '../config/roles';
import { PersonalService, type StaffUser } from '../services/personal.service';
import { useAuth } from '../auth/AuthContext';

const PALETTE = ['#D86835','#3C6030','#5B8C3A','#C0392B','#2C3E50','#E07B54','#7B4F00','#1A3A5C'];
const ROLES_LIST = Object.entries(ROLE_LABELS) as [AppRole, string][];

const EMPTY_FORM = {
  name: '', role: 'staff' as AppRole, color: PALETTE[0],
  email: '', pin: '', pinConfirm: '', showPin: false,
  resetPinOpen: false, newPin: '', newPinConfirm: '', showNewPin: false,
};

// ── Subcomponentes ────────────────────────────────────────────────────────

function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--zs-font-display)', fontSize: size * 0.42, flexShrink: 0,
      boxShadow: 'var(--zs-shadow-1)',
    }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {PALETTE.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)} style={{
          width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
          border: value === c ? '3px solid var(--zs-ink)' : '3px solid transparent',
          outline: value === c ? '2px solid var(--zs-paper-warm)' : 'none', outlineOffset: 1,
          boxShadow: 'var(--zs-shadow-1)',
        }} />
      ))}
    </div>
  );
}

function PinInput({ value, onChange, show, onToggleShow, placeholder = '4 dígitos' }: {
  value: string; onChange: (v: string) => void;
  show: boolean; onToggleShow: () => void; placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder={placeholder}
        className="input"
        style={{ paddingRight: 40 }}
      />
      <button type="button" onClick={onToggleShow} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--zs-mute)',
        display: 'flex', alignItems: 'center',
      }}>
        {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
      </button>
    </div>
  );
}

// ── Modal crear / editar ──────────────────────────────────────────────────

function UserModal({ mode, user, onClose, onSaved }: {
  mode: 'create' | 'edit';
  user?: StaffUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (mode === 'edit' && user) {
      setForm({ ...EMPTY_FORM, name: user.name, role: user.role, color: user.color, email: user.email ?? '' });
    }
  }, [mode, user]);

  const set = (field: string, val: unknown) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }

    if (mode === 'create') {
      if (!/^\d{4}$/.test(form.pin))          { setError('PIN debe ser 4 dígitos numéricos'); return; }
      if (form.pin !== form.pinConfirm)        { setError('Los PINs no coinciden'); return; }
    }

    if (form.resetPinOpen) {
      if (!/^\d{4}$/.test(form.newPin))        { setError('Nuevo PIN debe ser 4 dígitos'); return; }
      if (form.newPin !== form.newPinConfirm)  { setError('Los nuevos PINs no coinciden'); return; }
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        await PersonalService.create({
          name: form.name.trim(), role: form.role,
          pin: form.pin, color: form.color,
          email: form.email.trim() || undefined,
        });
      } else if (user) {
        await PersonalService.update({
          id: user.id,
          name: form.name.trim(), role: form.role,
          color: form.color, email: form.email.trim() || undefined,
        });
        if (form.resetPinOpen && form.newPin) {
          await PersonalService.resetPin(user.id, form.newPin);
        }
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(28,26,23,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={onClose}>
      <div
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
          boxShadow: 'var(--zs-shadow-3)', maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 20, color: 'var(--zs-green)', margin: 0 }}>
            {mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--zs-mute)', display: 'flex', padding: 4,
          }}><FiX size={20} /></button>
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preview del avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={form.name || '?'} color={form.color} size={52} />
            <div>
              <div style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--zs-ink)' }}>
                {form.name || 'Sin nombre'}
              </div>
              <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)' }}>
                {ROLE_LABELS[form.role]}
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              Nombre completo
            </label>
            <input className="input" value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ej. María López" />
          </div>

          {/* Rol */}
          <div>
            <label style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              Rol
            </label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value as AppRole)}>
              {ROLES_LIST.map(([r, label]) => (
                <option key={r} value={r}>{label}</option>
              ))}
            </select>
          </div>

          {/* Color de avatar */}
          <div>
            <label style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
              Color de avatar
            </label>
            <ColorPicker value={form.color} onChange={c => set('color', c)} />
          </div>

          {/* Email (opcional) */}
          <div>
            <label style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              Email <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional — para login con contraseña)</span>
            </label>
            <input className="input" type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="usuario@ejemplo.com" />
          </div>

          {/* PIN — solo al crear */}
          {mode === 'create' && (
            <>
              <div>
                <label style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                  PIN de acceso (4 dígitos)
                </label>
                <PinInput value={form.pin} onChange={v => set('pin', v)}
                  show={form.showPin} onToggleShow={() => set('showPin', !form.showPin)} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                  Confirmar PIN
                </label>
                <PinInput value={form.pinConfirm} onChange={v => set('pinConfirm', v)}
                  show={form.showPin} onToggleShow={() => set('showPin', !form.showPin)}
                  placeholder="Repetir PIN" />
              </div>
            </>
          )}

          {/* Resetear PIN — solo al editar */}
          {mode === 'edit' && (
            <div style={{ borderTop: '1px solid var(--zs-line)', paddingTop: 14 }}>
              <button type="button"
                onClick={() => set('resetPinOpen', !form.resetPinOpen)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13,
                  color: form.resetPinOpen ? 'var(--zs-red)' : 'var(--zs-green)',
                }}>
                {form.resetPinOpen ? '✕ Cancelar cambio de PIN' : '🔑 Cambiar PIN'}
              </button>
              {form.resetPinOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  <PinInput value={form.newPin} onChange={v => set('newPin', v)}
                    show={form.showNewPin} onToggleShow={() => set('showNewPin', !form.showNewPin)}
                    placeholder="Nuevo PIN (4 dígitos)" />
                  <PinInput value={form.newPinConfirm} onChange={v => set('newPinConfirm', v)}
                    show={form.showNewPin} onToggleShow={() => set('showNewPin', !form.showNewPin)}
                    placeholder="Confirmar nuevo PIN" />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(204,72,46,0.08)', border: '1px solid rgba(204,72,46,0.25)',
            }}>
              <FiAlertCircle size={14} color="var(--zs-red)" />
              <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-red)' }}>{error}</span>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} disabled={saving} className="btn btn-ghost" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
              {saving ? 'Guardando…' : mode === 'create' ? 'Crear usuario' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Confirm delete ────────────────────────────────────────────────────────

function ConfirmDelete({ user, onClose, onConfirm }: {
  user: StaffUser; onClose: () => void; onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const go = async () => { setLoading(true); await onConfirm(); setLoading(false); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(28,26,23,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: 28, maxWidth: 360, width: '100%',
        boxShadow: 'var(--zs-shadow-3)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, color: 'var(--zs-ink)', margin: '0 0 8px' }}>
          ¿Desactivar usuario?
        </h3>
        <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)', margin: '0 0 20px' }}>
          <strong>{user.name}</strong> ya no podrá iniciar sesión. Puedes reactivarlo después.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={go} disabled={loading} className="btn btn-danger" style={{ flex: 1 }}>
            {loading ? 'Desactivando…' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card de usuario ───────────────────────────────────────────────────────

function UserCard({ user, isMe, onEdit, onToggle, onDelete }: {
  user: StaffUser; isMe: boolean;
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const active = user.status === 'active';
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--zs-line)', borderRadius: 16,
      padding: '16px', boxShadow: 'var(--zs-shadow-1)',
      opacity: active ? 1 : 0.65,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <Avatar name={user.name} color={user.color} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--zs-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name} {isMe && <span style={{ fontSize: 10, color: 'var(--zs-accent2)' }}>(tú)</span>}
          </div>
          {user.email && (
            <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, color: 'var(--zs-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 999,
              fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10,
              background: 'var(--zs-paper)', border: '1px solid var(--zs-line)', color: 'var(--zs-mute)',
            }}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 999,
              fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 10,
              background: active ? 'rgba(109,151,71,0.15)' : 'var(--zs-line)',
              color: active ? 'var(--zs-acc)' : 'var(--zs-mute)',
            }}>
              {active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--zs-line)', paddingTop: 12 }}>
        <button onClick={onEdit} className="btn btn-ghost" style={{ flex: 1, fontSize: 12, padding: '6px 0', justifyContent: 'center', gap: 5 }}>
          <FiEdit2 size={13} /> Editar
        </button>
        {!isMe && (
          <>
            <button onClick={onToggle} className="btn btn-ghost" style={{ flex: 1, fontSize: 12, padding: '6px 0', justifyContent: 'center', gap: 5, color: active ? 'var(--zs-mute)' : 'var(--zs-acc)' }}>
              <FiPower size={13} /> {active ? 'Desactivar' : 'Activar'}
            </button>
            <button onClick={onDelete} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: 'var(--zs-red)', borderColor: 'transparent' }}>
              <FiTrash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────

export default function Personal() {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState<StaffUser[]>([]);
  const [status,  setStatus]  = useState<'loading' | 'ok' | 'error'>('loading');
  const [filter,  setFilter]  = useState<string>('all');
  const [modal,   setModal]   = useState<{ mode: 'create' | 'edit'; user?: StaffUser } | null>(null);
  const [delUser, setDelUser] = useState<StaffUser | null>(null);

  const load = useCallback(() => {
    setStatus('loading');
    PersonalService.getAll()
      .then(list => { setUsers(list); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (u: StaffUser) => {
    try {
      await PersonalService.update({ id: u.id, status: u.status === 'active' ? 'inactive' : 'active' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async () => {
    if (!delUser) return;
    try { await PersonalService.remove(delUser.id); load(); }
    catch (e: any) { alert(e.message); }
    finally { setDelUser(null); }
  };

  // Roles que realmente existen en la lista
  const presentRoles = [...new Set(users.map(u => u.role))];
  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 20, fontWeight: 400, color: 'var(--zs-green)', margin: 0 }}>
            Usuarios
          </h2>
          {status === 'ok' && (
            <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', margin: 0 }}>
              {users.filter(u => u.status === 'active').length} activos · {users.length} total
            </p>
          )}
        </div>
        <button onClick={() => setModal({ mode: 'create' })} className="btn btn-primary" style={{ gap: 7 }}>
          <FiUserPlus size={15} /> Nuevo usuario
        </button>
      </div>

      {/* Filtros por rol */}
      {status === 'ok' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `Todos (${users.length})` },
            ...presentRoles.map(r => ({
              key: r,
              label: `${ROLE_LABELS[r] ?? r} (${users.filter(u => u.role === r).length})`,
            })),
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12,
              padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              background: filter === f.key ? 'var(--zs-green)' : '#fff',
              color: filter === f.key ? 'var(--zs-paper)' : 'var(--zs-ink)',
              border: filter === f.key ? '1px solid var(--zs-green)' : '1px solid var(--zs-line-strong)',
              whiteSpace: 'nowrap',
            }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Estados */}
      {status === 'loading' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '3px solid var(--zs-green)', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontFamily: 'var(--zs-font-mono)', color: 'var(--zs-mute)', marginBottom: 12 }}>
            No se pudo cargar la lista de usuarios.
          </p>
          <button onClick={load} className="btn btn-secondary">Reintentar</button>
        </div>
      )}

      {status === 'ok' && filtered.length === 0 && (
        <p style={{ fontFamily: 'var(--zs-font-mono)', color: 'var(--zs-mute)', textAlign: 'center', padding: 32 }}>
          No hay usuarios con este filtro.
        </p>
      )}

      {/* Grid de tarjetas */}
      {status === 'ok' && filtered.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(u => (
            <UserCard
              key={u.id}
              user={u}
              isMe={u.id === me?.id}
              onEdit={() => setModal({ mode: 'edit', user: u })}
              onToggle={() => handleToggle(u)}
              onDelete={() => setDelUser(u)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {delUser && (
        <ConfirmDelete
          user={delUser}
          onClose={() => setDelUser(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
