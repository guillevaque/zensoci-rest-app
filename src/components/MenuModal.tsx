import React from 'react';

export type MenuForm = {
  nombre: string;
  categoria?: string;
  precio: number;
  descripcion?: string;
  activo: number; // 1|0
};

type Props = {
  open: boolean;
  title: string;
  initial: MenuForm;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: MenuForm) => void;
};

export default function MenuModal({ open, title, initial, saving = false, onClose, onSubmit }: Props) {
  const [form, setForm] = React.useState<MenuForm>(initial);

  React.useEffect(() => setForm(initial), [initial, open]);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === 'precio' ? Number(value || 0) : value,
    }));
  };

  const toggleActivo = () => setForm((f) => ({ ...f, activo: f.activo ? 0 : 1 }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[560px] max-w-[95vw] rounded-2xl bg-white p-5">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Nombre</span>
              <input
                name="nombre"
                value={form.nombre || ''}
                onChange={handle}
                className="rounded-md border px-3 py-2"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Categoría</span>
              <input
                name="categoria"
                value={form.categoria || ''}
                onChange={handle}
                className="rounded-md border px-3 py-2"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Precio ($)</span>
              <input
                type="number"
                step="0.01"
                name="precio"
                value={form.precio ?? 0}
                onChange={handle}
                className="rounded-md border px-3 py-2"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Disponibilidad</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleActivo}
                  className={`rounded-full px-3 py-1 text-xs ${
                    form.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {form.activo ? 'Disponible' : 'No disponible'}
                </button>
              </div>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Descripción</span>
            <textarea
              name="descripcion"
              value={form.descripcion || ''}
              onChange={handle}
              rows={3}
              className="rounded-md border px-3 py-2"
            />
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-black/5 px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-600 px-4 py-2 text-white disabled:opacity-70"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
