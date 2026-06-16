import React from 'react';

export type MenuForm = {
  nombre: string;
  categoria?: string;
  precio: number;
  descripcion?: string;
  activo: number;
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
    setForm(f => ({ ...f, [name]: name === 'precio' ? Number(value || 0) : value }));
  };

  const toggleActivo = () => setForm(f => ({ ...f, activo: f.activo ? 0 : 1 }));

  const submit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          width: 560,
          maxWidth: '100%',
          borderRadius: 20,
          boxShadow: '0 16px 48px rgba(0,0,0,0.20)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2EAE0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#1C2B1A', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: '#EEF4EC', color: '#3C6030', border: 'none',
              width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, padding: 0,
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ padding: 20, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1C2B1A', marginBottom: 6 }}>
                Nombre
              </label>
              <input name="nombre" value={form.nombre || ''} onChange={handle} className="input" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1C2B1A', marginBottom: 6 }}>
                Categoría
              </label>
              <input name="categoria" value={form.categoria || ''} onChange={handle} className="input" placeholder="Ej. Platos fuertes" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1C2B1A', marginBottom: 6 }}>
                Precio ($)
              </label>
              <input type="number" step="0.01" name="precio" value={form.precio ?? 0} onChange={handle} className="input" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1C2B1A', marginBottom: 6 }}>
                Disponibilidad
              </label>
              <button
                type="button"
                onClick={toggleActivo}
                className="btn"
                style={{
                  background: form.activo ? '#DCFCE7' : '#FEE2E2',
                  color: form.activo ? '#166534' : '#991B1B',
                  border: 'none',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: form.activo ? '#16A34A' : '#DC2626', display: 'inline-block', marginRight: 6 }}
                />
                {form.activo ? 'Disponible' : 'No disponible'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1C2B1A', marginBottom: 6 }}>
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion || ''}
              onChange={handle}
              rows={3}
              className="input"
              style={{ resize: 'vertical' }}
              placeholder="Describe el platillo…"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
