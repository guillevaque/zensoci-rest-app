import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiStar } from 'react-icons/fi';
import { DEPARTAMENTOS, MUNICIPIOS } from '../../types/dte-catalogs';
import type { CodigoDepartamento } from '../../types/dte-catalogs';
import { ClientesService } from '../../services/clientes.service';
import type { Cliente, ClienteDireccion, CreateClienteDireccion } from '../../types/dte';

type Props = {
  cliente: Cliente;
  onClose: () => void;
};

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--zs-font-mono)', fontSize: 13,
  border: '1px solid var(--zs-line)', borderRadius: 8,
  padding: '8px 12px', outline: 'none', background: '#fff',
  color: 'var(--zs-ink)', width: '100%', boxSizing: 'border-box',
};

const emptyNew = (): Omit<CreateClienteDireccion, 'cliente_id'> => ({
  etiqueta:    'Sucursal',
  departamento: '06',
  municipio:   '0601',
  distrito:    '',
  complemento: '',
  es_principal: false,
});

export default function DireccionesModal({ cliente, onClose }: Props) {
  const [dirs,    setDirs]    = useState<ClienteDireccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [adding,  setAdding]  = useState(false);
  const [newDir,  setNewDir]  = useState(emptyNew());
  const [saving,  setSaving]  = useState(false);

  const loadDirs = async () => {
    setLoading(true);
    try {
      const data = await ClientesService.getDirecciones(cliente.id);
      setDirs(data);
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDirs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setNew = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setNewDir(f => ({ ...f, [key]: e.target.value }));

  const handleAdd = async () => {
    setSaving(true);
    setError(null);
    try {
      await ClientesService.addDireccion({ ...newDir, cliente_id: cliente.id });
      setNewDir(emptyNew());
      setAdding(false);
      await loadDirs();
    } catch (err: any) {
      setError(err.message ?? 'Error al agregar');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrincipal = async (id: number) => {
    try {
      await ClientesService.setPrincipal(id);
      await loadDirs();
    } catch (err: any) {
      setError(err.message ?? 'Error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ClientesService.deleteDireccion(id);
      await loadDirs();
    } catch (err: any) {
      setError(err.message ?? 'Error al eliminar');
    }
  };

  const municipiosDepto = MUNICIPIOS[newDir.departamento as CodigoDepartamento] ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--zs-line)', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 17, color: 'var(--zs-green)', margin: 0 }}>
              Direcciones
            </h3>
            <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', margin: '2px 0 0' }}>
              {cliente.nombre}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <FiX size={20} color="var(--zs-mute)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: '#991b1b' }}>
              {error}
            </div>
          )}

          {loading ? (
            <p style={{ fontFamily: 'var(--zs-font-mono)', color: 'var(--zs-mute)', fontSize: 13 }}>Cargando…</p>
          ) : dirs.length === 0 && !adding ? (
            <p style={{ fontFamily: 'var(--zs-font-mono)', color: 'var(--zs-mute)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Sin direcciones registradas.
            </p>
          ) : (
            dirs.map(dir => (
              <div key={dir.id} style={{
                border: dir.es_principal ? '2px solid var(--zs-green)' : '1px solid var(--zs-line)',
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--zs-ink)' }}>
                      {dir.etiqueta}
                    </span>
                    {dir.es_principal === 1 && (
                      <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>
                        Principal
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', margin: 0 }}>
                    {DEPARTAMENTOS.find(d => d.codigo === dir.departamento)?.nombre ?? dir.departamento}
                    {' — '}{dir.municipio}
                    {' — '}{dir.complemento}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {!dir.es_principal && (
                    <button
                      title="Marcar como principal"
                      onClick={() => handleSetPrincipal(dir.id)}
                      style={{ width: 28, height: 28, border: '1px solid var(--zs-line)', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiStar size={13} color="var(--zs-mute)" />
                    </button>
                  )}
                  <button
                    title="Eliminar"
                    onClick={() => handleDelete(dir.id)}
                    style={{ width: 28, height: 28, border: '1px solid var(--zs-line)', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiTrash2 size={13} color="var(--zs-red)" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Add form */}
          {adding && (
            <div style={{ border: '2px dashed var(--zs-accent2)', borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--zs-accent2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Nueva dirección
              </p>
              <input value={newDir.etiqueta} onChange={setNew('etiqueta')} placeholder="Etiqueta (ej: Sucursal centro)" style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select value={newDir.departamento} onChange={e => {
                  const dep = e.target.value as CodigoDepartamento;
                  const firstMuni = MUNICIPIOS[dep]?.[0]?.codigo ?? '';
                  setNewDir(f => ({ ...f, departamento: dep, municipio: firstMuni }));
                }} style={inputStyle}>
                  {DEPARTAMENTOS.map(d => (
                    <option key={d.codigo} value={d.codigo}>{d.codigo} — {d.nombre}</option>
                  ))}
                </select>
                <select value={newDir.municipio} onChange={setNew('municipio')} style={inputStyle}>
                  {municipiosDepto.length > 0
                    ? municipiosDepto.map(m => <option key={m.codigo} value={m.codigo}>{m.codigo} — {m.nombre}</option>)
                    : <option value={newDir.municipio}>{newDir.municipio || '—'}</option>
                  }
                </select>
              </div>
              <input value={newDir.complemento} onChange={setNew('complemento')} placeholder="Complemento / dirección detallada" maxLength={200} style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Guardando…' : 'Agregar'}</button>
                <button className="btn btn-secondary" onClick={() => { setAdding(false); setNewDir(emptyNew()); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!adding && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--zs-line)', flexShrink: 0 }}>
            <button
              className="btn btn-secondary"
              style={{ gap: 6 }}
              onClick={() => setAdding(true)}
            >
              <FiPlus size={14} /> Agregar dirección
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
