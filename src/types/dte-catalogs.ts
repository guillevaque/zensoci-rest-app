/**
 * Catálogos del Ministerio de Hacienda de El Salvador (DTE).
 * Fuente: Catálogos Facturación Electrónica v2.
 *
 * PENDIENTE: municipios y distritos deben cargarse desde la fuente oficial MH
 * cuando los PDF de catálogos estén disponibles o desde el portal del MH.
 */

// ── CAT-012 Departamentos ─────────────────────────────────────────────────
export const DEPARTAMENTOS = [
  { codigo: '01', nombre: 'Ahuachapán' },
  { codigo: '02', nombre: 'Santa Ana' },
  { codigo: '03', nombre: 'Sonsonate' },
  { codigo: '04', nombre: 'Chalatenango' },
  { codigo: '05', nombre: 'La Libertad' },
  { codigo: '06', nombre: 'San Salvador' },
  { codigo: '07', nombre: 'Cuscatlán' },
  { codigo: '08', nombre: 'La Paz' },
  { codigo: '09', nombre: 'Cabañas' },
  { codigo: '10', nombre: 'San Vicente' },
  { codigo: '11', nombre: 'Usulután' },
  { codigo: '12', nombre: 'San Miguel' },
  { codigo: '13', nombre: 'Morazán' },
  { codigo: '14', nombre: 'La Unión' },
] as const;

export type CodigoDepartamento = (typeof DEPARTAMENTOS)[number]['codigo'];

// ── CAT-013 Municipios (subconjunto representativo) ───────────────────────
// TODO: completar con el catálogo oficial MH — estos son los más frecuentes.
export const MUNICIPIOS: Record<CodigoDepartamento, { codigo: string; nombre: string }[]> = {
  '01': [
    { codigo: '0101', nombre: 'Ahuachapán' },
    { codigo: '0102', nombre: 'Apaneca' },
    { codigo: '0112', nombre: 'Atiquizaya' },
  ],
  '02': [
    { codigo: '0201', nombre: 'Santa Ana' },
    { codigo: '0202', nombre: 'Coatepeque' },
    { codigo: '0209', nombre: 'Chalchuapa' },
  ],
  '03': [
    { codigo: '0301', nombre: 'Sonsonate' },
    { codigo: '0304', nombre: 'Acajutla' },
    { codigo: '0316', nombre: 'Nahuizalco' },
  ],
  '04': [
    { codigo: '0401', nombre: 'Chalatenango' },
    { codigo: '0419', nombre: 'La Palma' },
    { codigo: '0431', nombre: 'San Francisco Morazán' },
  ],
  '05': [
    { codigo: '0501', nombre: 'Nueva San Salvador (Santa Tecla)' },
    { codigo: '0504', nombre: 'Antiguo Cuscatlán' },
    { codigo: '0512', nombre: 'La Libertad' },
    { codigo: '0517', nombre: 'Quezaltepeque' },
    { codigo: '0518', nombre: 'San Juan Opico' },
    { codigo: '0519', nombre: 'San Pablo Tacachico' },
  ],
  '06': [
    { codigo: '0601', nombre: 'San Salvador' },
    { codigo: '0602', nombre: 'Aguilares' },
    { codigo: '0603', nombre: 'Apopa' },
    { codigo: '0604', nombre: 'Ayutuxtepeque' },
    { codigo: '0605', nombre: 'Ciudad Delgado' },
    { codigo: '0606', nombre: 'Cuscatancingo' },
    { codigo: '0607', nombre: 'El Paisnal' },
    { codigo: '0608', nombre: 'Guazapa' },
    { codigo: '0609', nombre: 'Ilopango' },
    { codigo: '0610', nombre: 'Mejicanos' },
    { codigo: '0611', nombre: 'Nejapa' },
    { codigo: '0612', nombre: 'Panchimalco' },
    { codigo: '0613', nombre: 'Rosario de Mora' },
    { codigo: '0614', nombre: 'San Marcos' },
    { codigo: '0615', nombre: 'San Martín' },
    { codigo: '0616', nombre: 'Santiago Texacuangos' },
    { codigo: '0617', nombre: 'Santo Tomás' },
    { codigo: '0618', nombre: 'Soyapango' },
    { codigo: '0619', nombre: 'Tonacatepeque' },
  ],
  '07': [
    { codigo: '0701', nombre: 'Cojutepeque' },
    { codigo: '0704', nombre: 'San Pedro Perulapán' },
    { codigo: '0716', nombre: 'Suchitoto' },
  ],
  '08': [
    { codigo: '0801', nombre: 'Zacatecoluca' },
    { codigo: '0809', nombre: 'Olocuilta' },
    { codigo: '0819', nombre: 'San Luis Talpa' },
  ],
  '09': [
    { codigo: '0901', nombre: 'Sensuntepeque' },
    { codigo: '0906', nombre: 'Ilobasco' },
  ],
  '10': [
    { codigo: '1001', nombre: 'San Vicente' },
    { codigo: '1007', nombre: 'Tecoluca' },
  ],
  '11': [
    { codigo: '1101', nombre: 'Usulután' },
    { codigo: '1104', nombre: 'Jiquilisco' },
    { codigo: '1108', nombre: 'Santiago de María' },
  ],
  '12': [
    { codigo: '1201', nombre: 'San Miguel' },
    { codigo: '1207', nombre: 'Moncagua' },
    { codigo: '1220', nombre: 'Quelepa' },
  ],
  '13': [
    { codigo: '1301', nombre: 'San Francisco Gotera' },
    { codigo: '1307', nombre: 'Jocoro' },
  ],
  '14': [
    { codigo: '1401', nombre: 'La Unión' },
    { codigo: '1411', nombre: 'Pasaquina' },
  ],
};

// ── CAT-022 Tipos de documento de identificación ──────────────────────────
export const TIPOS_DOC_IDENTIFICACION = [
  { codigo: '13', nombre: 'DUI' },
  { codigo: '37', nombre: 'NIT' },
  { codigo: '36', nombre: 'Pasaporte' },
  { codigo: '03', nombre: 'Carnet de residente' },
  { codigo: '02', nombre: 'Documento único de identidad extranjero' },
] as const;

export type CodigoTipoDocIdentificacion =
  (typeof TIPOS_DOC_IDENTIFICACION)[number]['codigo'];

// ── Ambiente DTE ───────────────────────────────────────────────────────────
export const AMBIENTES = [
  { codigo: '00', nombre: 'Pruebas' },
  { codigo: '01', nombre: 'Producción' },
] as const;

// ── Modelo de facturación ──────────────────────────────────────────────────
export const MODELOS_FACTURACION = [
  { codigo: 1, nombre: 'Previo (en línea)' },
  { codigo: 2, nombre: 'Diferido (fuera de línea)' },
] as const;
