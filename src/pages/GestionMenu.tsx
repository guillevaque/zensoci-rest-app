import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit } from 'react-icons/md';
import MenuModal, { MenuForm } from '../components/MenuModal';
import { MenuAPI } from '../api/menu';

type MenuItem = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion?: string;
  activo?: number;
};

const INITIAL_FORM: MenuForm = { nombre: '', categoria: '', precio: 0, descripcion: '', activo: 1 };

const STOCK_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  disponible: { label: 'Disponible', bg: '#DCFCE7', color: '#166534' },
  agotado:    { label: 'No disponible', bg: '#FEE2E2', color: '#991B1B' },
};

export function GestionMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
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

  const categories = ['Todos', ...Array.from(new Set(items.map(i => i.categoria).filter(Boolean)))];

  const visible = items.filter(item => {
    const matchCat = catFilter === 'Todos' || item.categoria === catFilter;
    const matchQ = !search || item.nombre.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const openAdd = () => setModal({ open: true, title: 'Nuevo plato', initial: INITIAL_FORM });
  const openEdit = (item: MenuItem) =>
    setModal({ open: true, title: 'Editar plato', initial: { nombre: item.nombre, categoria: item.categoria, precio: item.precio, descripcion: item.descripcion, activo: item.activo }, id: item.id });

  const handleSubmit = async (form: MenuForm) => {
    setSaving(true);
    try {
      if (modal.id) {
        await MenuAPI.update(modal.id, form);
      } else {
        await MenuAPI.create(form);
      }
      setModal(m => ({ ...m, open: false }));
      load();
    } catch {
      alert('Error al guardar');
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

  const getStock = (item: MenuItem) => {
    if (!item.activo) return 'agotado';
    return 'disponible';
  };

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

      {/* Category filter pills */}
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
                <th style={{ width: 56 }}></th>
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
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ background: '#EEF4EC' }}
                      >
                        🍽
                      </div>
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
        {!loading && !error && visible.length === 0 && (
          <div className="py-12 text-center" style={{ color: '#6B7A69' }}>
            No hay platos{catFilter !== 'Todos' ? ` en "${catFilter}"` : ''}.
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
