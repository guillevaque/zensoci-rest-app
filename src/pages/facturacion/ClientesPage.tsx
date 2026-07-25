import React, { useState } from 'react';
import {
  FiPlus, FiSearch, FiEdit2, FiMapPin, FiToggleLeft, FiToggleRight,
  FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { useClientes } from '../../hooks/useClientes';
import { CONSUMIDOR_FINAL_ID } from '../../types/dte';
import type { Cliente, CreateCliente, UpdateCliente } from '../../types/dte';
import ClienteFormModal from './ClienteFormModal';
import DireccionesModal from './DireccionesModal';

const TH: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontWeight: 700,
  color: 'var(--zs-mute)', fontSize: 11, letterSpacing: '0.06em',
  textTransform: 'uppercase', whiteSpace: 'nowrap',
  background: 'var(--zs-paper-warm)',
  borderBottom: '2px solid var(--zs-line)',
  position: 'sticky', top: 0,
};
const TD: React.CSSProperties = {
  padding: '10px 12px', color: 'var(--zs-ink)', verticalAlign: 'middle',
  fontFamily: 'var(--zs-font-mono)', fontSize: 13,
};

export default function ClientesPage() {
  const { clientes, total, page, lastPage, loading, error, search, setPage, create, update, toggle } =
    useClientes();

  const [searchVal, setSearchVal]     = useState('');
  const [showForm,  setShowForm]      = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [dirCliente,  setDirCliente]  = useState<Cliente | null>(null);

  const handleSearch = (val: string) => {
    setSearchVal(val);
    search(val);
  };

  const handleSave = async (data: CreateCliente | UpdateCliente) => {
    if ('id' in data) {
      await update(data as UpdateCliente);
    } else {
      await create(data as CreateCliente);
    }
    setShowForm(false);
    setEditCliente(null);
  };

  const openEdit = (c: Cliente) => { setEditCliente(c); setShowForm(true); };
  const openDirs = (c: Cliente) => setDirCliente(c);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '12px 20px', borderBottom: '1px solid var(--zs-line)',
        background: 'var(--zs-cream)', flexShrink: 0,
      }}>
        <button
          className="btn btn-primary"
          style={{ gap: 6, paddingLeft: 14, paddingRight: 16 }}
          onClick={() => { setEditCliente(null); setShowForm(true); }}
        >
          <FiPlus size={15} /> Nuevo cliente
        </button>

        <div style={{ flex: 1 }} />

        {/* Buscador */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid var(--zs-line)',
          borderRadius: 999, padding: '7px 14px',
        }}>
          <FiSearch size={14} color="var(--zs-mute)" />
          <input
            value={searchVal}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nombre, NIT, NRC…"
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-ink)',
              minWidth: 220,
            }}
          />
        </div>

        {/* Paginación */}
        <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', whiteSpace: 'nowrap' }}>
          {total === 0 ? '0' : `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)}`} / {total}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { Icon: FiChevronLeft,  action: () => setPage(page - 1), disabled: page <= 1 },
            { Icon: FiChevronRight, action: () => setPage(page + 1), disabled: page >= lastPage },
          ].map(({ Icon, action, disabled }, i) => (
            <button key={i} onClick={action} disabled={disabled} style={{
              width: 30, height: 30, border: '1px solid var(--zs-line)',
              borderRadius: 8, background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: disabled ? 0.4 : 1,
            }}>
              <Icon size={14} color="var(--zs-mute)" />
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: '12px 20px', padding: '10px 14px',
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
          fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: '#991b1b',
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        {loading && clientes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--zs-font-mono)', color: 'var(--zs-mute)' }}>
            Cargando clientes…
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--zs-font-mono)', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={TH}>Nombre</th>
                <th style={TH}>Tipo</th>
                <th style={TH}>Documento</th>
                <th style={TH}>NIT</th>
                <th style={TH}>NRC</th>
                <th style={TH}>Teléfono</th>
                <th style={TH}>Correo</th>
                <th style={{ ...TH, textAlign: 'center' }}>Estado</th>
                <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...TD, textAlign: 'center', padding: 40, color: 'var(--zs-mute)' }}>
                    No hay clientes registrados.
                  </td>
                </tr>
              ) : clientes.map((c, idx) => {
                const isCF = c.id === CONSUMIDOR_FINAL_ID;
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid var(--zs-line)',
                      background: idx % 2 === 0 ? '#fff' : 'var(--zs-cream)',
                      opacity: c.activo ? 1 : 0.55,
                    }}
                  >
                    <td style={{ ...TD, fontWeight: 700, color: isCF ? 'var(--zs-mute)' : 'var(--zs-ink)' }}>
                      {c.nombre}
                      {isCF && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: '#f3f4f6', color: 'var(--zs-mute)', borderRadius: 999, padding: '1px 7px' }}>
                          sistema
                        </span>
                      )}
                    </td>
                    <td style={TD}>
                      <span style={{
                        background: c.tipo_persona === 'J' ? '#ede9fe' : '#f0fdf4',
                        color:      c.tipo_persona === 'J' ? '#5b21b6' : '#166534',
                        borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      }}>
                        {c.tipo_persona === 'J' ? 'Jurídica' : 'Natural'}
                      </span>
                    </td>
                    <td style={{ ...TD, color: 'var(--zs-mute)' }}>{c.num_documento ?? '—'}</td>
                    <td style={TD}>{c.nit ?? '—'}</td>
                    <td style={TD}>{c.nrc ?? '—'}</td>
                    <td style={{ ...TD, color: 'var(--zs-mute)' }}>{c.telefono ?? '—'}</td>
                    <td style={{ ...TD, color: 'var(--zs-mute)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.correo ?? '—'}
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <span style={{
                        background: c.activo ? '#d1fae5' : '#fee2e2',
                        color:      c.activo ? '#065f46' : '#991b1b',
                        borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      }}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        {!isCF && (
                          <>
                            <button
                              title="Editar"
                              onClick={() => openEdit(c)}
                              style={{ width: 28, height: 28, border: '1px solid var(--zs-line)', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <FiEdit2 size={13} color="var(--zs-mute)" />
                            </button>
                            <button
                              title="Direcciones"
                              onClick={() => openDirs(c)}
                              style={{ width: 28, height: 28, border: '1px solid var(--zs-line)', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <FiMapPin size={13} color="var(--zs-mute)" />
                            </button>
                            <button
                              title={c.activo ? 'Desactivar' : 'Activar'}
                              onClick={() => toggle(c.id, !c.activo)}
                              style={{ width: 28, height: 28, border: '1px solid var(--zs-line)', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {c.activo
                                ? <FiToggleRight size={15} color="var(--zs-green)" />
                                : <FiToggleLeft  size={15} color="var(--zs-mute)" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ClienteFormModal
          cliente={editCliente}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditCliente(null); }}
        />
      )}
      {dirCliente && (
        <DireccionesModal
          cliente={dirCliente}
          onClose={() => setDirCliente(null)}
        />
      )}
    </div>
  );
}
