import React from 'react';
import ReactDOM from 'react-dom';
import { MdCloudUpload, MdClose } from 'react-icons/md';

export type MenuForm = {
  nombre: string;
  categoria?: string;
  precio: number;
  descripcion?: string;
  activo: number;
  image_url?: string;
};

type Props = {
  open: boolean;
  title: string;
  initial: MenuForm;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: MenuForm, imageFile?: File) => void;
};

export default function MenuModal({ open, title, initial, saving = false, onClose, onSubmit }: Props) {
  const [form, setForm] = React.useState<MenuForm>(initial);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [imageFile, setImageFile] = React.useState<File | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setForm(initial);
    setPreview(null);
    setImageFile(undefined);
  }, [initial, open]);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'precio' ? Number(value || 0) : value }));
  };

  const toggleActivo = () => setForm(f => ({ ...f, activo: f.activo ? 0 : 1 }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const removeImage = () => {
    setImageFile(undefined);
    setPreview(null);
    setForm(f => ({ ...f, image_url: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, imageFile);
  };

  const currentImage = preview || form.image_url || null;

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      style={{ position: 'fixed', inset: 0, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          width: 580,
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
        <form onSubmit={submit} style={{ padding: 20 }}>

          {/* Image picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1C2B1A', marginBottom: 6 }}>
              Imagen del plato
            </label>
            <div
              style={{
                border: '2px dashed #C8D8C4',
                borderRadius: 12,
                background: '#F7FAF6',
                position: 'relative',
                overflow: 'hidden',
                minHeight: currentImage ? 0 : 100,
              }}
            >
              {currentImage ? (
                <>
                  <img
                    src={currentImage}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block', borderRadius: 10, background: '#F0F4EF' }}
                  />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '4px 12px' }}
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        background: '#FEE2E2', border: 'none', borderRadius: '50%',
                        width: 26, height: 26, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#991B1B',
                      }}
                      aria-label="Quitar imagen"
                    >
                      <MdClose size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '20px 0', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#6B7A69',
                  }}
                >
                  <MdCloudUpload size={32} style={{ color: '#3C6030' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Seleccionar imagen</span>
                  <span style={{ fontSize: '0.75rem' }}>JPG, PNG, WebP — máx. 5 MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

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
    </div>,
    document.body
  );
}
