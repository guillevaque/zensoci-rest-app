/**
 * Tipos TypeScript para la Factura Electrónica DTE El Salvador.
 * Derivados del esquema JSON fe-f-v2.json (tipoDte="01", version=2).
 *
 * FASE 1: configuración fiscal, clientes, direcciones.
 * NO incluye: Firmador, Ministerio de Hacienda, JWT, credenciales.
 */

// ── Configuración del emisor (tabla configuracion_fiscal) ─────────────────
export type ConfiguracionFiscal = {
  id: number;
  nit: string;
  nrc: string;
  nombre_legal: string;
  nombre_comercial: string | null;
  codigo_actividad: string;
  descripcion_actividad: string;
  departamento: string;
  municipio: string;
  distrito: string | null;
  complemento: string;
  telefono: string;
  correo: string;
  codigo_establecimiento: string | null;
  codigo_punto_venta: string | null;
  ambiente: '00' | '01';
  modelo_facturacion: 1 | 2;
  activo: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type CreateConfiguracionFiscal = Omit<
  ConfiguracionFiscal,
  'id' | 'activo' | 'created_at' | 'updated_at'
>;

export type UpdateConfiguracionFiscal = Partial<CreateConfiguracionFiscal> & {
  id: number;
};

// ── Cliente / Receptor (tabla clientes) ───────────────────────────────────
export type TipoPersona = 'N' | 'J';
export type TipoDocIdentificacion = '13' | '37' | '36' | '03' | '02';

export type Cliente = {
  id: number;
  tipo_persona: TipoPersona;
  tipo_doc_identificacion: TipoDocIdentificacion;
  num_documento: string | null;
  nit: string | null;
  nrc: string | null;
  nombre: string;
  nombre_comercial: string | null;
  es_contribuyente: 0 | 1;
  codigo_actividad: string | null;
  descripcion_actividad: string | null;
  departamento: string | null;
  municipio: string | null;
  complemento: string | null;
  telefono: string | null;
  correo: string | null;
  activo: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type CreateCliente = Omit<
  Cliente,
  'id' | 'activo' | 'created_at' | 'updated_at'
>;

export type UpdateCliente = Partial<CreateCliente> & { id: number };

// ── Respuesta paginada de clientes ────────────────────────────────────────
export type ClientesPage = {
  data: Cliente[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
};

// ── Dirección de cliente (tabla cliente_direcciones) ──────────────────────
export type ClienteDireccion = {
  id: number;
  cliente_id: number;
  etiqueta: string;
  departamento: string;
  municipio: string;
  distrito: string | null;
  complemento: string;
  es_principal: 0 | 1;
  activo: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type CreateClienteDireccion = {
  cliente_id: number;
  etiqueta?: string;
  departamento: string;
  municipio: string;
  distrito?: string;
  complemento: string;
  es_principal?: boolean;
};

export type UpdateClienteDireccion = Partial<
  Omit<CreateClienteDireccion, 'cliente_id'>
> & { id: number };

// ── Constante: ID del Consumidor Final en la DB ───────────────────────────
export const CONSUMIDOR_FINAL_ID = 1;
