# JSON Schemas — Documentos Tributarios Electrónicos (DTE) El Salvador

## Origen oficial

Ministerio de Hacienda de El Salvador — Sistema de Transmisión de DTE  
Fuente: svfe-json-schemas (repositorio oficial DGII/MH)

## Versiones disponibles

| Carpeta | Descripción                                    |
|---------|------------------------------------------------|
| `v1/`   | Schemas versión 1 (Factura consumidor final)   |
| `v2/`   | Schemas versión 2                              |
| `v3/`   | Schemas versión 3                              |
| `v4/`   | Schemas versión 4 (vigente a 2026)             |

## Tipos de DTE

Cada tipo de documento utiliza su propio schema y versión.  
**No se debe seleccionar automáticamente el schema por número de carpeta mayor.**  
La versión correcta depende del tipo de DTE y la fecha de emisión — consultar el  
Manual Técnico para la Integración Tecnológica del Sistema de Transmisión (versión vigente).

| Código | Tipo de documento              |
|--------|-------------------------------|
| `01`   | Factura                       |
| `03`   | Comprobante de crédito fiscal |
| `04`   | Nota de remisión              |
| `05`   | Nota de crédito               |
| `06`   | Nota de débito                |
| `07`   | Comprobante de retención      |
| `08`   | Comprobante de liquidación    |
| `09`   | Documento contable de liquidación |
| `11`   | Facturas de exportación       |
| `14`   | Sujeto excluido               |
| `15`   | Comprobante de donación       |

## Incorporación

- **Fecha de incorporación al repositorio:** 2026-07-26
- **Origen:** svfe-json-schemas (fuente oficial MH El Salvador)
- **Nota:** Los contenidos de los schemas NO deben modificarse.
  Cualquier actualización debe provenir de la fuente oficial.

## Uso en el código

```php
$schemaPath = __DIR__ . '/v4/FE_DTE01_v4.json';
$schema     = json_decode(file_get_contents($schemaPath), true);
// Validar $dteJson contra $schema antes de enviar al Firmador
```

## Referencias

- Manual Técnico para la Integración Tecnológica del Sistema de Transmisión v2
- Portal DTE: https://dte.mh.gob.sv/
