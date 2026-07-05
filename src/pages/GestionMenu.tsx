import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdSearch, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import MenuModal, { MenuForm } from '../components/MenuModal';
import { MenuAPI } from '../api/menu';

type MenuItem = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion?: string;
  image_url?: string;
  activo?: number;
};

const INITIAL_FORM: MenuForm = { nombre: '', categoria: '', precio: 0, descripcion: '', activo: 1, image_url: undefined };

const STOCK_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  disponible: { label: 'Disponible', bg: '#DCFCE7', color: '#166534' },
  agotado:    { label: 'No disponible', bg: '#FEE2E2', color: '#991B1B' },
};

const PAGE_SIZE = 10;

export function GestionMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; title: string; initial: MenuForm; id?: number }>({
    open: false, title: '', initial: INITIAL_FORM,
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    MenuAPI.list()
      .then(data => setItems(data))
      .catch(e => setError(e?.message || 'Error cargando menú'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, catFilter]);

  const categories = ['Todos', ...Array.from(new Set(items.map(i => i.categoria).filter(Boolean)))];

  const filtered = items.filter(item => {
    const matchCat = catFilter === 'Todos' || item.categoria === catFilter;
    const matchQ = !search || item.nombre.toLowerCase().includes(search.toLowerCase()) || (item.categoria || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => setModal({ open: true, title: 'Nuevo plato', initial: INITIAL_FORM });
  const openEdit = (item: MenuItem) =>
    setModal({
      open: true,
      title: 'Editar plato',
      initial: { nombre: item.nombre, categoria: item.categoria, precio: item.precio, descripcion: item.descripcion, activo: item.activo, image_url: item.image_url },
      id: item.id,
    });

  const handleSubmit = async (form: MenuForm, imageFile?: File) => {
    setSaving(true);
    try {
      let imageUrl = form.image_url;

      if (imageFile) {
        try {
          const res = await MenuAPI.uploadImage(imageFile);
          imageUrl = res.url;
        } catch (uploadErr: any) {
          setSaving(false);
          alert('Error al subir la imagen: ' + (uploadErr?.message || 'sin detalles'));
          return;
        }
      }

      const payload = { ...form, image_url: imageUrl };

      if (modal.id) {
        await MenuAPI.update(modal.id, payload);
      } else {
        await MenuAPI.create(payload);
      }
      setModal(m => ({ ...m, open: false }));
      load();
    } catch (err: any) {
      alert('Error al guardar: ' + (err?.message || 'sin detalles'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    try {
      await MenuAPI.remove(item.id);
      load();
    } catch {
      alert('Error al eliminar');
    }
  };

  const getStock = (item: MenuItem) => item.activo ? 'disponible' : 'agotado';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">MENÚ</h1>
          <p className="page-subtitle">Platos, categorías y disponibilidad</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <MdAdd size={16} /> Nuevo Plato
        </button>
      </div>

      {/* Search + Category filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <MdSearch size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B7A69', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 32 }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className="btn"
              style={catFilter === cat
                ? { background: '#3C6030', color: '#fff' }
                : { background: '#fff', color: '#6B7A69', border: '1px solid #E2EAE0' }}
            >
              {cat}{cat === 'Todos' ? ` (${items.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#3C6030', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div className="py-10 text-center" style={{ color: '#DC2626' }}>{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="zs-table" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ width: 72 }}></th>
                  <th>Plato</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Precio</th>
                  <th style={{ width: 140 }}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(item => {
                  const stock = getStock(item);
                  const sb = STOCK_BADGE[stock];
                  return (
                    <tr key={item.id}>
                      <td>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.nombre}
                            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10 }}
                          />
                        ) : (
                          <div
                            style={{ width: 56, height: 56, borderRadius: 10, background: '#EEF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}
                          >
                            🍽
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-sm" style={{ color: '#1C2B1A' }}>{item.nombre}</div>
                        {item.descripcion && (
                          <div className="text-xs truncate" style={{ color: '#6B7A69', maxWidth: 200 }}>{item.descripcion}</div>
                        )}
                      </td>
                      <td className="text-sm" style={{ color: '#6B7A69' }}>{item.categoria || '—'}</td>
                      <td>
                        <span className="badge" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
                      </td>
                      <td className="font-bold text-sm" style={{ color: '#D86835' }}>${Number(item.precio).toFixed(2)}</td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', gap: 4 }}
                            onClick={() => openEdit(item)}
                          >
                            <MdEdit size={13} /> Editar
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                            onClick={() => handleDelete(item)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center" style={{ color: '#6B7A69' }}>
            No hay platos{search ? ` con "${search}"` : catFilter !== 'Todos' ? ` en "${catFilter}"` : ''}.
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filtered.length > PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #E2EAE0' }}>
            <span style={{ fontSize: '0.8125rem', color: '#6B7A69' }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} platos
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-ghost"
                style={{ padding: '4px 8px', opacity: page === 1 ? 0.4 : 1 }}
                aria-label="Página anterior"
              >
                <MdChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#6B7A69', fontSize: '0.8125rem' }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className="btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.8125rem',
                        minWidth: 32,
                        background: page === p ? '#3C6030' : '#fff',
                        color: page === p ? '#fff' : '#6B7A69',
                        border: '1px solid #E2EAE0',
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-ghost"
                style={{ padding: '4px 8px', opacity: page === totalPages ? 0.4 : 1 }}
                aria-label="Página siguiente"
              >
                <MdChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <MenuModal
        open={modal.open}
        title={modal.title}
        initial={modal.initial}
        saving={saving}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
