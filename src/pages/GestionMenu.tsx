import React from 'react';
import {
  listMenuItems,
  crearMenuItem,
  editarMenuItem,
  eliminarMenuItem,
  type MenuItem,
} from '../lib/apiMenu';
import MenuModal, { type MenuForm } from '../components/MenuModal';

const Pill: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
      active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}
  >
    {active ? 'Disponible' : 'No disponible'}
  </span>
);

export const GestionMenu: React.FC = () => {
  const [data, setData] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState<MenuItem | null>(null);

  const cargar = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await listMenuItems({ q: query });
      setData(res || []);
    } catch (e: any) {
      setError(e.message || 'Error al cargar menú');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargar();
  }, []);

  const nuevo = () => {
    setEditing(null);
    setOpen(true);
  };

  const editar = (row: MenuItem) => {
    setEditing(row);
    setOpen(true);
  };

  const guardar = async (form: MenuForm) => {
    try {
      setSaving(true);
      if (editing) {
        await editarMenuItem(editing.id, {
          nombre: form.nombre,
          categoria: form.categoria,
          precio: form.precio,
          descripcion: form.descripcion,
          activo: form.activo,
        });
      } else {
        await crearMenuItem({
          nombre: form.nombre,
          categoria: form.categoria,
          precio: form.precio,
          descripcion: form.descripcion,
          activo: form.activo,
        });
      }
      setOpen(false);
      setEditing(null);
      await cargar(q);
    } catch (e: any) {
      alert(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (row: MenuItem) => {
    if (!confirm(`Eliminar "${row.nombre}"?`)) return;
    await eliminarMenuItem(row.id);
    await cargar(q);
  };

  const totalItems = data.length;

  return (
    <div className="space-y-4">
      {/* Header y botón */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Menú</h1>
        <button onClick={nuevo} className="rounded-md bg-orange-600 px-4 py-2 text-white">
          Añadir Nuevo Platillo
        </button>
      </div>

      {/* Buscador */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
            {/* ícono lupa */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar platillo por nombre"
            className="w-full rounded-md border px-10 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => cargar(q)} className="rounded-md border px-4 py-2">
            Buscar
          </button>
        </div>
      </div>

      {/* Métrica simple */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Ítems</div>
          <div className="text-2xl font-semibold">{totalItems}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Precio promedio</div>
          <div className="text-2xl font-semibold">
            $
            {totalItems
              ? (data.reduce((a, b) => a + Number(b.precio || 0), 0) / totalItems).toFixed(2)
              : '0.00'}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-700">
            <tr>
              <th className="px-4 py-3">Nombre del Platillo</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Disponibilidad</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center">
                  Cargando…
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && !data.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center">
                  Sin resultados
                </td>
              </tr>
            )}

            {data.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.nombre}</div>
                  {row.descripcion ? (
                    <div className="text-xs text-gray-500">{row.descripcion}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  ${Number(row.precio || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <Pill active={!!row.activo} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      className="text-orange-700 underline-offset-2 hover:underline"
                      onClick={() => editar(row)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-600 underline-offset-2 hover:underline"
                      onClick={() => eliminar(row)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <MenuModal
        open={open}
        title={editing ? 'Editar platillo' : 'Nuevo platillo'}
        initial={
          editing
            ? {
                nombre: editing.nombre,
                categoria: editing.categoria || '',
                precio: Number(editing.precio || 0),
                descripcion: editing.descripcion || '',
                activo: editing.activo ? 1 : 0,
              }
            : { nombre: '', categoria: '', precio: 0, descripcion: '', activo: 1 }
        }
        saving={saving}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={guardar}
      />
    </div>
  );
};
