import React, { useState, useEffect } from 'react';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { DEPARTAMENTOS, MUNICIPIOS, AMBIENTES, MODELOS_FACTURACION } from '../../types/dte-catalogs';
import type { CodigoDepartamento } from '../../types/dte-catalogs';
import type { CreateConfiguracionFiscal, UpdateConfiguracionFiscal } from '../../types/dte';

// ── Shared field wrapper ──────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{
        fontFamily: 'var(--zs-font-mono)', fontSize: 11, fontWeight: 700,
        color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--zs-font-mono)', fontSize: 13,
  border: '1px solid var(--zs-line)', borderRadius: 8,
  padding: '8px 12px', outline: 'none', background: '#fff',
  color: 'var(--zs-ink)',
};

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{ ...inputStyle, cursor: 'pointer', ...props.style }}>
      {props.children}
    </select>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function FiscalConfigPanel() {
  const { config, loading, error, save } = useFiscalConfig();
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const emptyForm = {
    nit: '', nrc: '', nombre_legal: '', nombre_comercial: '',
    codigo_actividad: '', descripcion_actividad: '',
    departamento: '06', municipio: '0601', distrito: '', complemento: '',
    telefono: '', correo: '',
    codigo_establecimiento: '', codigo_punto_venta: '',
    ambiente: '00' as '00' | '01',
    modelo_facturacion: 1 as 1 | 2,
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (config) {
      setForm({
        nit:                    config.nit ?? '',
        nrc:                    config.nrc ?? '',
        nombre_legal:           config.nombre_legal ?? '',
        nombre_comercial:       config.nombre_comercial ?? '',
        codigo_actividad:       config.codigo_actividad ?? '',
        descripcion_actividad:  config.descripcion_actividad ?? '',
        departamento:           config.departamento ?? '06',
        municipio:              config.municipio ?? '0601',
        distrito:               config.distrito ?? '',
        complemento:            config.complemento ?? '',
        telefono:               config.telefono ?? '',
        correo:                 config.correo ?? '',
        codigo_establecimiento: config.codigo_establecimiento ?? '',
        codigo_punto_venta:     config.codigo_punto_venta ?? '',
        ambiente:               config.ambiente ?? '00',
        modelo_facturacion:     config.modelo_facturacion ?? 1,
      });
    }
  }, [config]);

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      const payload = {
        ...form,
        nombre_comercial:       form.nombre_comercial       || null,
        distrito:               form.distrito               || null,
        codigo_establecimiento: form.codigo_establecimiento || null,
        codigo_punto_venta:     form.codigo_punto_venta     || null,
        modelo_facturacion:     Number(form.modelo_facturacion) as 1 | 2,
      };
      const data: CreateConfiguracionFiscal | UpdateConfiguracionFiscal = config
        ? { ...payload, id: config.id }
        : payload;
      await save(data);
      setEditing(false);
    } catch (err: any) {
      setSaveErr(err.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const municipiosDepto = MUNICIPIOS[form.departamento as CodigoDepartamento] ?? [];

  if (loading) {
    return (
      <div style={{ padding: 32, fontFamily: 'var(--zs-font-mono)', color: 'var(--zs-mute)' }}>
        Cargando configuración fiscal…
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--zs-font-display)', fontSize: 20, color: 'var(--zs-green)', margin: 0 }}>
            Configuración Fiscal DTE
          </h3>
          <p style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 12, color: 'var(--zs-mute)', margin: '4px 0 0' }}>
            Datos del emisor para Factura Electrónica El Salvador (tipoDte=01, version=2)
          </p>
        </div>
        {!editing && (
          <button
            className="btn btn-secondary"
            onClick={() => { setEditing(true); setSaveErr(null); }}
          >
            {config ? 'Editar' : 'Configurar'}
          </button>
        )}
      </div>

      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
          padding: '10px 14px', marginBottom: 16,
          fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: '#991b1b',
        }}>
          {error}
        </div>
      )}

      {!config && !editing && (
        <div style={{
          background: '#fef9c3', border: '1px solid #fde047', borderRadius: 12,
          padding: '16px 20px', fontFamily: 'var(--zs-font-mono)', fontSize: 13,
          color: '#713f12',
        }}>
          No hay configuración fiscal. Haz clic en <strong>Configurar</strong> para comenzar.
        </div>
      )}

      {/* View mode */}
      {config && !editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['NIT',            config.nit],
            ['NRC',            config.nrc],
            ['Nombre legal',   config.nombre_legal],
            ['Nombre comercial', config.nombre_comercial ?? '—'],
            ['Cód. actividad', config.codigo_actividad],
            ['Desc. actividad', config.descripcion_actividad],
            ['Departamento',   DEPARTAMENTOS.find(d => d.codigo === config.departamento)?.nombre ?? config.departamento],
            ['Municipio',      config.municipio],
            ['Complemento',    config.complemento],
            ['Teléfono',       config.telefono],
            ['Correo',         config.correo],
            ['Ambiente',       AMBIENTES.find(a => a.codigo === config.ambiente)?.nombre ?? config.ambiente],
            ['Modelo',         MODELOS_FACTURACION.find(m => m.codigo === config.modelo_facturacion)?.nombre ?? String(config.modelo_facturacion)],
            ['Establecimiento', config.codigo_establecimiento ?? '—'],
            ['Punto de venta', config.codigo_punto_venta ?? '—'],
          ].map(([label, value]) => (
            <div key={String(label)} style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '10px 14px', background: 'var(--zs-cream)',
              border: '1px solid var(--zs-line)', borderRadius: 8,
            }}>
              <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--zs-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <span style={{ fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: 'var(--zs-ink)', fontWeight: 600 }}>{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Section title="Identificación tributaria">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="NIT *">
                <TextInput value={form.nit} onChange={set('nit')} placeholder="00000000-0" maxLength={14} />
              </Field>
              <Field label="NRC *">
                <TextInput value={form.nrc} onChange={set('nrc')} placeholder="00000000" maxLength={8} />
              </Field>
              <Field label="Nombre legal *">
                <TextInput value={form.nombre_legal} onChange={set('nombre_legal')} maxLength={250} style={{ gridColumn: 'span 2' }} />
              </Field>
              <Field label="Nombre comercial">
                <TextInput value={form.nombre_comercial} onChange={set('nombre_comercial')} maxLength={150} />
              </Field>
              <Field label="Cód. actividad económica *">
                <TextInput value={form.codigo_actividad} onChange={set('codigo_actividad')} placeholder="47110" maxLength={6} />
              </Field>
              <Field label="Descripción actividad *">
                <TextInput value={form.descripcion_actividad} onChange={set('descripcion_actividad')} maxLength={150} />
              </Field>
            </div>
          </Section>

          <Section title="Dirección fiscal">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Departamento *">
                <Select value={form.departamento} onChange={e => {
                  const dep = e.target.value as CodigoDepartamento;
                  const firstMuni = MUNICIPIOS[dep]?.[0]?.codigo ?? '';
                  setForm(f => ({ ...f, departamento: dep, municipio: firstMuni }));
                }}>
                  {DEPARTAMENTOS.map(d => (
                    <option key={d.codigo} value={d.codigo}>{d.codigo} — {d.nombre}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Municipio *">
                <Select value={form.municipio} onChange={set('municipio')}>
                  {municipiosDepto.length > 0
                    ? municipiosDepto.map(m => (
                        <option key={m.codigo} value={m.codigo}>{m.codigo} — {m.nombre}</option>
                      ))
                    : <option value={form.municipio}>{form.municipio}</option>
                  }
                </Select>
              </Field>
              <Field label="Complemento *">
                <TextInput value={form.complemento} onChange={set('complemento')} maxLength={200} />
              </Field>
              <Field label="Distrito (opcional)">
                <TextInput value={form.distrito} onChange={set('distrito')} maxLength={10} />
              </Field>
            </div>
          </Section>

          <Section title="Contacto">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Teléfono *">
                <TextInput value={form.telefono} onChange={set('telefono')} maxLength={30} />
              </Field>
              <Field label="Correo electrónico *">
                <TextInput type="email" value={form.correo} onChange={set('correo')} maxLength={100} />
              </Field>
            </div>
          </Section>

          <Section title="Establecimiento DTE">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Cód. establecimiento (4 dígitos)">
                <TextInput value={form.codigo_establecimiento} onChange={set('codigo_establecimiento')} maxLength={4} placeholder="0001" />
              </Field>
              <Field label="Cód. punto de venta">
                <TextInput value={form.codigo_punto_venta} onChange={set('codigo_punto_venta')} maxLength={15} placeholder="0001" />
              </Field>
            </div>
          </Section>

          <Section title="Parámetros operativos">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Ambiente *">
                <Select value={form.ambiente} onChange={set('ambiente')}>
                  {AMBIENTES.map(a => (
                    <option key={a.codigo} value={a.codigo}>{a.codigo} — {a.nombre}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Modelo de facturación *">
                <Select value={form.modelo_facturacion} onChange={e => setForm(f => ({ ...f, modelo_facturacion: Number(e.target.value) as 1 | 2 }))}>
                  {MODELOS_FACTURACION.map(m => (
                    <option key={m.codigo} value={m.codigo}>{m.codigo} — {m.nombre}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Section>

          {saveErr && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
              padding: '10px 14px', fontFamily: 'var(--zs-font-mono)', fontSize: 13, color: '#991b1b',
            }}>
              {saveErr}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setEditing(false); setSaveErr(null); }}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid var(--zs-line)', borderRadius: 12,
      padding: '16px 18px',
    }}>
      <h4 style={{
        fontFamily: 'var(--zs-font-mono)', fontSize: 12, fontWeight: 700,
        color: 'var(--zs-mute)', textTransform: 'uppercase',
        letterSpacing: '0.06em', margin: '0 0 12px',
      }}>
        {title}
      </h4>
      {children}
    </div>
  );
}
