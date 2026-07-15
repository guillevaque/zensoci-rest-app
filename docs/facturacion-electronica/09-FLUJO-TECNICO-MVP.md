# 09 — Flujo Técnico del MVP DTE

Este documento describe el flujo técnico paso a paso de la emisión de una Factura (tipo 01)
desde que el operador confirma el cobro hasta que el MH acepta el documento.

---

## Diagrama de flujo completo

```
Operador confirma cobro en React
          │
          ▼
POST /api/caja/cobrar.php
  { pedido_id, tipo_dte, pagos[] }
          │
          ├─ [V] Validar sesión y rol
          ├─ [V] Pedido existe y está en estado LISTO/ENTREGADO
          ├─ [V] Suma de pagos = total del pedido
          │
          ├─ BEGIN TRANSACTION
          │   ├─ INSERT ventas (snapshot fiscal)
          │   ├─ INSERT venta_items (snapshot de cada ítem)
          │   ├─ INSERT pagos (forma de pago, monto, referencia)
          │   ├─ UPDATE pedidos → PAGADO
          │   └─ UPDATE mesas → LIBRE (si canal = MESA)
          ├─ COMMIT ──────────────── La venta YA EXISTE de aquí en adelante
          │
          ├─ INSERT dte_documentos (estado = PENDIENTE_GENERACION, venta_id)
          │
          ├─ [G] Generar JSON del DTE
          │       ├─ Leer emisor desde config_fiscal
          │       ├─ Asignar codigo_generacion (UUID v4)
          │       ├─ Obtener siguiente correlativo (SELECT FOR UPDATE)
          │       ├─ Construir numero_control
          │       ├─ Construir identificacion{}
          │       ├─ Construir emisor{}
          │       ├─ Construir receptor{} (consumidor final)
          │       ├─ Construir cuerpoDocumento[] desde venta_items
          │       └─ Construir resumen{} desde ventas + pagos
          │
          ├─ UPDATE dte_documentos → GENERADO, guardar json_sin_firma
          │
          ├─ [Val] Validar JSON contra JSON Schema oficial del MH
          │       ├─ Si inválido → UPDATE → ERROR_VALIDACION
          │       └─                 Registrar dte_intentos con error
          │
          ├─ UPDATE dte_documentos → VALIDADO
          │
          ├─ [F] POST al Firmador Docker
          │       ├─ Body: { nit, activo, passwordPri, dteJson }
          │       ├─ Si error/timeout → UPDATE → ERROR_FIRMA
          │       └─                    Registrar dte_intentos con error
          │
          ├─ UPDATE dte_documentos → FIRMADO, guardar json_firmado
          │
          ├─ [T] POST al API del MH
          │       ├─ Body: el json_firmado
          │       ├─ Si aceptado → UPDATE → ACEPTADO, guardar sello_mh
          │       ├─ Si rechazado → UPDATE → RECHAZADO, guardar descripcion_error
          │       └─ Si timeout/5xx → UPDATE → ERROR_TEMPORAL
          │                           Registrar dte_intentos con error
          │
          └─ Responder a React:
              - Si ACEPTADO: { ok: true, numero_control, sello_mh }
              - Si ERROR: { ok: false, estado_dte, error }
```

---

## Detalle: Construcción del JSON del DTE

### Sección `identificacion`

| Campo DTE | Fuente | Nota |
|---|---|---|
| `tipoDte` | Parámetro del request (`tipo_dte`) | `"01"` para Factura |
| `numeroControl` | `dte_correlativos` | Formato: `DTE-01-{cod_pv}-{15 dígitos}` |
| `codigoGeneracion` | UUID v4 generado en PHP | Único e inmutable |
| `tipoModelo` | Constante `1` (previo) | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| `tipoOperacion` | Constante `1` (normal) | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| `tipoContingencia` | `null` (no aplica en MVP normal) | |
| `motivoContin` | `null` | |
| `fecEmi` | Fecha actual del servidor | `YYYY-MM-DD` |
| `horEmi` | Hora actual del servidor | `HH:MM:SS` |
| `tipoMoneda` | Constante `"USD"` | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| `version` | PENDIENTE DE VALIDAR CON FUENTE OFICIAL | Depende del Manual Técnico vigente |

### Sección `emisor`

| Campo DTE | Fuente |
|---|---|
| `nit` | `config_fiscal.nit` |
| `nrc` | `config_fiscal.nrc` |
| `nombre` | `config_fiscal.nombre` |
| `codActividad` | `config_fiscal.cod_actividad` (CAT-019) |
| `descActividad` | `config_fiscal.desc_actividad` |
| `tipoEstablecimiento` | `config_fiscal.tipo_establecimiento` (CAT-009) |
| `direccion.departamento` | `config_fiscal.dir_departamento` (CAT-012) |
| `direccion.municipio` | `config_fiscal.dir_municipio` (CAT-013) |
| `direccion.complemento` | `config_fiscal.dir_complemento` |
| `telefono` | `config_fiscal.telefono` |
| `correo` | `config_fiscal.email` |
| `codEstableMH` | `config_fiscal.cod_establecimiento` |
| `codEstable` | `config_fiscal.cod_establecimiento` |
| `codPuntoVentaMH` | `config_fiscal.cod_punto_venta` |
| `codPuntoVenta` | `config_fiscal.cod_punto_venta` |

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Diferencia entre `codEstableMH` y `codEstable`,
entre `codPuntoVentaMH` y `codPuntoVenta` según el JSON Schema oficial del MH.

### Sección `receptor` (consumidor final)

| Campo DTE | Valor para consumidor final |
|---|---|
| `tipoDocumento` | `null` |
| `numDocumento` | `null` |
| `nombre` | `"Consumidor Final"` |
| `correoElectronico` | `null` |
| `telefono` | `null` |

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Estructura exacta del receptor para consumidor
final según el JSON Schema del MH para tipo de DTE 01.

### Sección `cuerpoDocumento` (por ítem de la venta)

| Campo DTE | Fuente | Cálculo |
|---|---|---|
| `numItem` | Correlativo 1, 2, 3... | |
| `tipoItem` | Constante `1` (Bienes) | PENDIENTE DE VALIDAR |
| `numeroDocumento` | `null` | |
| `cantidad` | `venta_items.cantidad` | |
| `codigo` | `venta_items.menu_item_id` (opcional) | PENDIENTE DE VALIDAR si es requerido |
| `uniMedida` | Constante `59` (Unidad, CAT-014) | PENDIENTE DE VALIDAR |
| `descripcion` | `venta_items.descripcion` (snapshot) | |
| `precioUni` | `venta_items.precio_sin_iva` | DECIMAL con 8 decimales según esquema |
| `montoDescu` | `0` (sin descuento en el MVP) | |
| `ventaNoSuj` | `0` | |
| `ventaExenta` | `0` | |
| `ventaGravada` | `precio_sin_iva * cantidad` | |
| `tributos` | `["20"]` (IVA 13%) | PENDIENTE DE VALIDAR formato exacto |
| `psv` | `0` | |
| `noGravado` | `0` | |
| `ivaItem` | `ventaGravada * 0.13` | PENDIENTE DE VALIDAR si va aquí o en resumen |

### Sección `resumen`

| Campo DTE | Cálculo | Nota |
|---|---|---|
| `totalNoSuj` | `0` | |
| `totalExenta` | `0` | |
| `totalGravada` | suma de `ventaGravada` de todos los ítems | |
| `subTotalVentas` | `totalGravada` | |
| `descuNoSuj` | `0` | |
| `descuExenta` | `0` | |
| `descuGravada` | `0` | |
| `porcentajeDescuento` | `0` | |
| `totalDescu` | `0` | |
| `tributos` | `[{ codigo: "20", descripcion: "IVA", valor: totalGravada * 0.13 }]` | PENDIENTE DE VALIDAR |
| `subTotal` | `totalGravada` | |
| `ivaRete1` | `0` | |
| `reteRenta` | `0` | |
| `montoTotalOperacion` | `totalGravada + iva` | = precio_con_iva total |
| `totalNoGravado` | `0` | |
| `totalPagar` | `montoTotalOperacion` | |
| `totalLetras` | `"VEINTE 00/100 DÓLARES"` | función en PHP |
| `saldoFavor` | `0` | |
| `condicionOperacion` | `1` (Contado, CAT-016) | PENDIENTE DE VALIDAR |
| `pagos` | `[{ codigo: forma_pago_cat017, montoPago: monto, referencia }]` | |
| `numPagoElectronico` | `null` | |

---

## Cálculo del precio_sin_iva

En el MVP, `menu.price` contiene el precio **con IVA**. El DTE requiere el precio **sin IVA**.

```
precio_sin_iva = precio_con_iva / 1.13
```

Este cálculo se realiza en `ventas_helpers.php` al construir el snapshot de `venta_items`.

Se usa `DECIMAL(10,4)` para almacenar el resultado. No se usa FLOAT.

**Solución permanente (fuera del MVP):** Agregar columna `precio_sin_iva` a la tabla `menu`
para eliminar la división en tiempo de cobro.

---

## Generación del UUID v4 en PHP puro

```php
// Sin dependencias externas
function generar_uuid_v4(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // version 4
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // variant bits
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
```

`random_bytes()` está disponible en PHP 7.0+. Verificar versión de PHP en Hostinger.

---

## Formato del numero_control

```
DTE-{tipoDte}-{codPuntoVenta}-{correlativo}
```

Ejemplo:
```
DTE-01-0001-000000000000001
```

- `tipoDte`: 2 dígitos (`01` para Factura)
- `codPuntoVenta`: 4 dígitos (del emisor, con ceros a la izquierda)
- `correlativo`: 15 dígitos (con ceros a la izquierda)

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Formato exacto del `numeroControl` según el
Manual Técnico vigente del MH. La longitud total del campo es fija.

---

## Manejo de errores post-COMMIT

Si la venta ya fue guardada (COMMIT exitoso) pero el DTE falla en algún paso:

| Paso que falló | Estado del DTE | Acción |
|---|---|---|
| Validación JSON | `ERROR_VALIDACION` | Error en el builder; requiere corrección del código |
| Firmador timeout | `ERROR_FIRMA` | Reintento manual o automático (cron) |
| Firmador error 4xx | `ERROR_FIRMA` | Revisar credenciales; problema de configuración |
| MH rechazado | `RECHAZADO` | Revisar código de error del MH; posible error en el JSON |
| MH timeout/5xx | `ERROR_TEMPORAL` | Reintento con backoff exponencial |

En ningún caso se revierte la venta. El cobro ya ocurrió. El DTE se puede reintentar
desde el historial de DTEs.

---

## Reintentos (estrategia básica del MVP)

El MVP implementa reintento manual desde la interfaz (botón "Reintentar DTE" en el historial).
El reintento automático vía cron job es Fase siguiente.

**Estados reintentables:**
- `ERROR_FIRMA` — reintenta desde el paso de firma
- `ERROR_TEMPORAL` — reintenta desde el paso de transmisión al MH
- `RECHAZADO` — NO se reintenta automáticamente; requiere revisión manual

**No reintentable:** `ERROR_VALIDACION` — indica un bug en el builder que necesita corrección.

---

## Respuesta al frontend

### Caso éxito (DTE aceptado)
```json
{
  "ok": true,
  "venta_id": 42,
  "numero_ticket": 127,
  "dte_id": 15,
  "numero_control": "DTE-01-0001-000000000000015",
  "sello_mh": "2024ABC...",
  "estado_dte": "aceptado"
}
```

### Caso error en DTE (venta SÍ fue creada)
```json
{
  "ok": true,
  "venta_id": 42,
  "numero_ticket": 127,
  "dte_id": 15,
  "estado_dte": "error_firma",
  "error_dte": "El Firmador no respondió dentro del tiempo límite",
  "mensaje": "La venta fue registrada. El DTE se puede reintentar desde el historial."
}
```

### Caso error crítico (venta NO fue creada)
```json
{
  "ok": false,
  "error": "No se pudo registrar la venta",
  "detalle": "Error de base de datos: ..."
}
```
