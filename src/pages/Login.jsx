import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_USERS = [
  { id: 1, name: 'Andrés',  role: 'Mesero',  color: '#D86835', pin: '1234' },
  { id: 2, name: 'Marisol', role: 'Cajera',  color: '#3C6030', pin: '2222' },
  { id: 3, name: 'Carlos',  role: 'Cocina',  color: '#5B8C3A', pin: '3333' },
  { id: 4, name: 'Lucía',   role: 'Mesera',  color: '#C0392B', pin: '4444' },
  { id: 5, name: 'Pablo',   role: 'Manager', color: '#2C3E50', pin: '5555' },
  { id: 6, name: 'Sofía',   role: 'Mesera',  color: '#E07B54', pin: '6666' },
];

function getDay() {
  const d = new Date();
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${days[d.getDay()]} ${d.getDate()} · ${months[d.getMonth()]}`;
}

function getTime() {
  return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export default function Login() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(MOCK_USERS[0]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [time, setTime] = useState(getTime());

  useEffect(() => {
    const t = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleKey = (k) => {
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    setError('');
    if (next.length === 4) {
      setTimeout(() => {
        if (next === selected.pin) {
          navigate('/dashboard');
        } else {
          setError('PIN incorrecto');
          setPin('');
        }
      }, 180);
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const NUM_BTN = {
    height: 60, borderRadius: 14, border: '1.5px solid #E2EAE0',
    background: '#fff', fontWeight: 700, fontSize: '1.25rem', color: '#1C2B1A',
    cursor: 'pointer', transition: 'background 0.1s', width: '100%',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── Left panel ── */}
      <div
        style={{
          width: '42%', background: '#3C6030', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '2.5rem', position: 'relative', overflow: 'hidden',
        }}
        className="hidden md:flex"
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: '2rem', color: '#fff', letterSpacing: '-0.02em' }}>ZENSOCI</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', letterSpacing: '0.22em', marginTop: 3 }}>
            COCINA VEGANA
          </div>
        </div>

        <div style={{ fontWeight: 900, fontSize: '2.5rem', color: '#D86835', lineHeight: 1.1, textTransform: 'uppercase' }}>
          Bienvenidos<br />al turno.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>v1.0 · Cocina Zensoci</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', fontWeight: 600 }}>
            {getDay()} · <span style={{ color: '#D86835' }}>{time}</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        style={{
          flex: 1, background: '#F9F6F1', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '2rem', overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{ fontWeight: 900, fontSize: '1.7rem', color: '#1C2B1A', marginBottom: 6, letterSpacing: '-0.01em' }}>
            INICIAR SESIÓN
          </h1>
          <p style={{ color: '#6B7A69', fontSize: '0.875rem', marginBottom: 26 }}>
            Selecciona tu nombre y marca tu PIN de 4 dígitos.
          </p>

          {/* User grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 26 }}>
            {MOCK_USERS.map(u => (
              <button
                key={u.id}
                onClick={() => { setSelected(u); setPin(''); setError(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px',
                  border: selected.id === u.id ? `2px solid #D86835` : '2px solid #E2EAE0',
                  borderRadius: 12, background: '#fff', cursor: 'pointer',
                  boxShadow: selected.id === u.id ? '0 0 0 3px rgba(216,104,53,0.15)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    width: 30, height: 30, borderRadius: '50%', background: u.color,
                    color: '#fff', fontWeight: 800, fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  {u.name[0]}
                </div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1C2B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#6B7A69' }}>{u.role}</div>
                </div>
              </button>
            ))}
          </div>

          {/* PIN dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
            {[0,1,2,3].map(i => (
              <div
                key={i}
                style={{
                  width: 15, height: 15, borderRadius: '50%',
                  background: i < pin.length ? '#D86835' : '#D1D5DB',
                  transition: 'background 0.15s',
                }}
              />
            ))}
          </div>

          {error && (
            <p style={{ textAlign: 'center', color: '#DC2626', fontSize: '0.8rem', marginBottom: 10, fontWeight: 600 }}>
              {error}
            </p>
          )}

          {/* Numpad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => handleKey(String(n))} style={NUM_BTN}>{n}</button>
            ))}
            <button
              onClick={() => setPin('')}
              style={{ ...NUM_BTN, fontSize: '0.8rem', fontWeight: 600, color: '#6B7A69' }}
            >
              Borrar
            </button>
            <button onClick={() => handleKey('0')} style={NUM_BTN}>0</button>
            <button onClick={handleDelete} style={{ ...NUM_BTN, fontSize: '1.1rem', color: '#6B7A69' }}>⌫</button>
          </div>

          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.72rem', marginTop: 20 }}>
            Demo: PIN de Andrés es <strong>1234</strong>, de Marisol es <strong>2222</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
