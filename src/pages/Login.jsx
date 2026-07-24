import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthService } from '../services/auth.service';
import { ROLE_LABELS } from '../config/roles';

const COLORS = ['#D86835','#3C6030','#5B8C3A','#C0392B','#2C3E50','#E07B54'];
const avatarColor = (u) => COLORS[(Number(u.id ?? 0)) % COLORS.length];

function getDay() {
  const d = new Date();
  const days   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${days[d.getDay()]} ${d.getDate()} · ${months[d.getMonth()]}`;
}
function getTime() {
  return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

// Skeleton de una tarjeta de usuario mientras carga
function UserSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#fff', border: '1px solid var(--zs-line)',
      borderRadius: 12, padding: '8px 10px',
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--zs-line)', flexShrink: 0,
        animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 10, borderRadius: 4, background: 'var(--zs-line)', marginBottom: 5,
          animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 8, borderRadius: 4, background: 'var(--zs-line)', width: '60%',
          animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  );
}

export default function Login() {
  const navigate       = useNavigate();
  const { user, loginPin } = useAuth();

  const [users,    setUsers]    = useState([]);
  const [status,   setStatus]   = useState('loading'); // 'loading' | 'ok' | 'error' | 'empty'
  const [selected, setSelected] = useState(null);
  const [pin,      setPin]      = useState('');
  const [error,    setError]    = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [time,     setTime]     = useState(getTime());

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

  useEffect(() => {
    const t = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchUsers = useCallback(() => {
    setStatus('loading');
    AuthService.getUsers()
      .then(list => {
        if (list.length === 0) {
          setStatus('empty');
        } else {
          setUsers(list);
          setSelected(list[0]);
          setStatus('ok');
        }
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const tap = (k) => {
    if (busy || !selected) return;
    setError(false);
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (k === 'C')  { setPin(''); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setBusy(true);
      loginPin(selected.id, next)
        .catch(() => {
          setError(true);
          setTimeout(() => { setPin(''); setError(false); setBusy(false); }, 450);
        })
        .then(() => setBusy(false));
    }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', background: 'var(--zs-green)', overflow: 'hidden' }}>

      {/* Panel izquierdo – oculto en móvil */}
      <div className="hidden md:flex" style={{
        flex: '1.2', padding: 56,
        flexDirection: 'column', justifyContent: 'space-between',
        color: 'var(--zs-paper)', position: 'relative', overflow: 'hidden',
      }}>
        <img src="/assets/logo-horizontal-paper-tagline.png" alt="Zensoci" style={{ width: 220 }} />
        <div>
          <h1 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 48, lineHeight: 1.0, margin: 0, maxWidth: 420 }}>
            Bienvenidos<br />al <span style={{ color: 'var(--zs-accent2)' }}>turno</span>.
          </h1>
        </div>
        <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, opacity: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span>v1.0 · Cocina Zensoci</span>
          <span>{getDay()} · {time}</span>
        </div>
        <img
          src="/assets/illustrations/char-cool-kale.png"
          alt=""
          style={{ position: 'absolute', right: -60, bottom: -40, width: 280, opacity: 0.7, pointerEvents: 'none' }}
        />
      </div>

      {/* Panel derecho */}
      <div style={{
        flex: 1, background: 'var(--zs-paper)',
        padding: '40px 24px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 20, overflowY: 'auto', minWidth: 0,
      }}>
        {/* Logo en móvil */}
        <div className="flex md:hidden justify-center mb-2">
          <img src="/assets/logo-horizontal-paper-tagline.png" alt="Zensoci"
            style={{ height: 40, objectFit: 'contain', filter: 'invert(1) sepia(1) saturate(3) hue-rotate(60deg)' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 30, color: 'var(--zs-green)', margin: 0 }}>Iniciar sesión</h2>
          <div style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)', marginTop: 2 }}>
            Selecciona tu nombre y marca tu PIN de 4 dígitos.
          </div>
        </div>

        {/* Grid de usuarios */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {status === 'loading' && [1,2,3].map(i => <UserSkeleton key={i} />)}

          {status === 'error' && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)', margin: '0 0 10px' }}>
                No se pudo cargar la lista de usuarios.
              </p>
              <button onClick={fetchUsers} className="btn btn-secondary" style={{ fontSize: 12 }}>
                Reintentar
              </button>
            </div>
          )}

          {status === 'empty' && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-mute)', margin: 0 }}>
                No hay usuarios activos configurados.
              </p>
            </div>
          )}

          {status === 'ok' && users.map(u => (
            <button
              key={u.id}
              onClick={() => { setSelected(u); setPin(''); setError(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff',
                border: selected?.id === u.id ? '1px solid var(--zs-accent2)' : '1px solid var(--zs-line)',
                boxShadow: selected?.id === u.id ? '0 0 0 3px rgba(216,104,53,0.22)' : 'none',
                borderRadius: 12, padding: '8px 10px', cursor: 'pointer',
                fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 12,
                textAlign: 'left',
              }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: 999, background: avatarColor(u),
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--zs-font-display)', fontSize: 14, flexShrink: 0,
              }}>
                {u.name[0].toUpperCase()}
              </span>
              <span>
                <span style={{ display: 'block' }}>{u.name}</span>
                <span style={{ fontWeight: 400, color: 'var(--zs-mute)', fontSize: 10 }}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* PIN dots */}
        <div className={error ? 'pin-shake' : ''} style={{ display: 'flex', gap: 14, justifyContent: 'center', padding: '14px 0' }}>
          {[0,1,2,3].map(i => (
            <span key={i} style={{
              width: 20, height: 20, borderRadius: 999,
              background: i < pin.length ? 'var(--zs-accent2)' : '#fff',
              border: `2px solid ${i < pin.length ? 'var(--zs-accent2)' : 'var(--zs-line-strong)'}`,
              display: 'inline-block',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {['1','2','3','4','5','6','7','8','9'].map(n => (
            <button key={n} onClick={() => tap(n)} style={{
              background: '#fff', border: '1px solid var(--zs-line-strong)', borderRadius: 14,
              padding: '14px 0', cursor: 'pointer',
              fontFamily: 'var(--zs-font-display)', fontSize: 24, color: 'var(--zs-ink)',
              minHeight: 54, transition: 'background 80ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--zs-cream)'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >{n}</button>
          ))}
          <button onClick={() => tap('C')} style={{
            background: 'transparent', border: 'none', borderRadius: 14,
            padding: '14px 0', cursor: 'pointer',
            fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 13,
            color: 'var(--zs-mute)', minHeight: 54,
          }}>
            Borrar
          </button>
          <button onClick={() => tap('0')} style={{
            background: '#fff', border: '1px solid var(--zs-line-strong)', borderRadius: 14,
            padding: '14px 0', cursor: 'pointer',
            fontFamily: 'var(--zs-font-display)', fontSize: 24, color: 'var(--zs-ink)',
            minHeight: 54,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--zs-cream)'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >0</button>
          <button onClick={() => tap('⌫')} style={{
            background: 'transparent', border: 'none', borderRadius: 14,
            padding: '14px 0', cursor: 'pointer',
            fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 18,
            color: 'var(--zs-mute)', minHeight: 54,
          }}>⌫</button>
        </div>
      </div>
    </div>
  );
}
