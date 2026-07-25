import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { DEPARTAMENTOS, MUNICIPIOS, TIPOS_DOC_IDENTIFICACION } from '../../types/dte-catalogs';
import type { CodigoDepartamento } from '../../types/dte-catalogs';
import type { Cliente, CreateCliente, UpdateCliente } from '../../types/dte';

type Props = {
  cliente?: Cliente | null;
  onSave:  (data: CreateCliente | UpdateCliente) => Promise<unknown>;
  onClose: () => void;
};

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--zs-font-mono)', fontSize: 13,
  border: '1px solid var(--zs-line)', borderRadius: 8,
  padding: '8px 12px', outline: 'none', background: '#fff',
  color: 'var(--zs-ink)', width: '100%', boxSizing: 'border-box',
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{
        fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700,
        color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}{required && <span style={{ color: 'var(--zs-red)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ClienteFormModal({ cliente, onSave, onClose }: Props) {
  const isEdit = !!cliente;

  const [form, setForm] = useState({
    tipo_persona:           'N' as 'N' | 'J',
    tipo_doc_identificacion: '13' as string,
    num_documento:          '',
    nit:                    '',
    nrc:                    '',
    nombre:                 '',
    nombre_comercial:       '',
    es_contribuyente:       false,
    codigo_actividad:       '',
    descripcion_actividad:  '',
    departamento:           '06',
    municipio:              '0601',
    complemento:            '',
    telefono:               '',
    correo:                 '',
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (cliente) {
      setForm({
        tipo_persona:            cliente.tipo_persona,
        tipo_doc_identificacion: cliente.tipo_doc_identificacion,
        num_documento:           cliente.num_documento ?? '',
        nit:                     cliente.nit ?? '',
        nrc:                     cliente.nrc ?? '',
        nombre:                  cliente.nombre,
        nombre_comercial:        cliente.nombre_comercial ?? '',
        es_contribuyente:        cliente.es_contribuyente === 1,
        codigo_actividad:        cliente.codigo_actividad ?? '',
        descripcion_actividad:   cliente.descripcion_actividad ?? '',
        departamento:            cliente.departamento ?? '06',
        municipio:               cliente.municipio ?? '0601',
        complemento:             cliente.complemento ?? '',
        telefono:                cliente.telefono ?? '',
        correo:                  cliente.correo ?? '',
      });
    }
  }, [cliente]);

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }));

  const toggle = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.checked }));

  const municipiosDepto = MUNICIPIOS[form.departamento as CodigoDepartamento] ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        tipo_persona:            form.tipo_persona,
        tipo_doc_identificacion: form.tipo_doc_identificacion,
        num_documento:           form.num_documento || null,
        nit:                     form.nit || null,
        nrc:                     form.nrc || null,
        nombre:                  form.nombre,
        nombre_comercial:        form.nombre_comercial || null,
        es_contribuyente:        form.es_contribuyente,
        codigo_actividad:        form.codigo_actividad || null,
        descripcion_actividad:   form.descripcion_actividad || null,
        departamento:            form.departamento || null,
        municipio:               form.municipio || null,
        complemento:             form.complemento || null,
        telefono:                form.telefono || null,
        correo:                  form.correo || null,
      };
      const data: CreateCliente | UpdateCliente = isEdit
        ? { ...payload, id: cliente!.id }
        : payload;
      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 620,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--zs-line)', flexShrink: 0,
        }}>
          <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 18, color: 'var(--zs-green)', margin: 0 }}>
            {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <FiX size={20} color="var(--zs-mute)" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Tipo de persona" required>
              <select value={form.tipo_persona} onChange={set('tipo_persona')} style={inputStyle}>
                <option value="N">Natural (persona física)</option>
                <option value="J">Jurídica (empresa)</option>
              </select>
            </Field>
            <Field label="Tipo doc. identificación" required>
              <select value={form.tipo_doc_identificacion} onChange={set('tipo_doc_identificacion')} style={inputStyle}>
                {TIPOS_DOC_IDENTIFICACION.map(t => (
                  <option key={t.codigo} value={t.codigo}>{t.codigo} — {t.nombre}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Número de documento">
              <input value={form.num_documento} onChange={set('num_documento')} maxLength={20} style={inputStyle} placeholder="Ej: 00000000-0" />
            </Field>
            <Field label="NIT">
              <input value={form.nit} onChange={set('nit')} maxLength={14} style={inputStyle} placeholder="00000000-0 (sólo dígitos)" />
            </Field>
          </div>

          <Field label="Nombre / Razón social" required>
            <input value={form.nombre} onChange={set('nombre')} maxLength={250} required style={inputStyle} />
          </Field>

          <Field label="Nombre comercial">
            <input value={form.nombre_comercial} onChange={set('nombre_comercial')} maxLength={150} style={inputStyle} />
          </Field>

          {/* Contribuyente toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'var(--zs-font-mono)', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={form.es_contribuyente}
              onChange={toggle('es_contribuyente')}
              style={{ width: 16, height: 16, accentColor: 'var(--zs-accent2)', cursor: 'pointer' }}
            />
            Es contribuyente (tiene NRC y realiza actividad económica)
          </label>

          {form.es_contribuyente && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="NRC">
                <input value={form.nrc} onChange={set('nrc')} maxLength={8} style={inputStyle} placeholder="0-0 (sólo dígitos)" />
              </Field>
              <Field label="Cód. actividad económica">
                <input value={form.codigo_actividad} onChange={set('codigo_actividad')} maxLength={6} style={inputStyle} placeholder="47110" />
              </Field>
              <Field label="Descripción actividad">
                <input value={form.descripcion_actividad} onChange={set('descripcion_actividad')} maxLength={150} style={inputStyle} />
              </Field>
            </div>
          )}

          {/* Dirección */}
          <div style={{ borderTop: '1px solid var(--zs-line)', paddingTop: 14 }}>
            <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
              Dirección
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Departamento">
                <select value={form.departamento} onChange={e => {
                  const dep = e.target.value as CodigoDepartamento;
                  const firstMuni = MUNICIPIOS[dep]?.[0]?.codigo ?? '';
                  setForm(f => ({ ...f, departamento: dep, municipio: firstMuni }));
                }} style={inputStyle}>
                  <option value="">— seleccionar —</option>
                  {DEPARTAMENTOS.map(d => (
                    <option key={d.codigo} value={d.codigo}>{d.codigo} — {d.nombre}</option>
                  ))}
                </select>
              </Field>
              <Field label="Municipio">
                <select value={form.municipio} onChange={set('municipio')} style={inputStyle}>
                  {municipiosDepto.length > 0
                    ? municipiosDepto.map(m => (
                        <option key={m.codigo} value={m.codigo}>{m.codigo} — {m.nombre}</option>
                      ))
                    : <option value={form.municipio}>{form.municipio || '—'}</option>
                  }
                </select>
              </Field>
              <Field label="Complemento (dirección)">
                <input value={form.complemento} onChange={set('complemento')} maxLength={200} style={inputStyle} />
              </Field>
            </div>
          </div>

          {/* Contacto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Teléfono">
              <input value={form.telefono} onChange={set('telefono')} maxLength={30} style={inputStyle} />
            </Field>
            <Field label="Correo electrónico">
              <input type="email" value={form.correo} onChange={set('correo')} maxLength={100} style={inputStyle} />
            </Field>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
              padding: '10px 14px', fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: '#991b1b',
            }}>
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 8, padding: '14px 24px',
          borderTop: '1px solid var(--zs-line)', flexShrink: 0,
        }}>
          <button className="btn btn-primary" onClick={handleSubmit as any} disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
