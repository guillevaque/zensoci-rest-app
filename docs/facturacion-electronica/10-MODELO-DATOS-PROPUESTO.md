# 10 — Modelo de Datos Propuesto

Diseño conceptual de todas las entidades nuevas que soportan el ERP omnicanal de Zensoci.
No contiene SQL, CREATE TABLE ni tipos de datos específicos. Solo estructura conceptual.

Las entidades existentes (`menu`, `ingredientes`, `costeo_platillos`, `empaques`) no se incluyen
aquí — se documentan en el doc 03-Analisis-Base-Datos.md.

---

## Entidad: `mesas`

**Propósito:** Representa los espacios físicos del restaurante. Incluye tipos especiales
(Pickup, Delivery) como filas de la misma tabla.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `nombre` | "Mesa 1", "Pickup", "Delivery" | No | Sí |
| `tipo` | ENUM: regular, pickup, delivery | No | Sí |
| `capacidad` | Número máximo de personas | No | No |
| `estado` | ENUM: libre, ocupada, necesita_check, fuera_de_servicio | No | Sí |
| `hora_apertura` | Cuando se asignó al pedido actual | No | No |
| `activo` | Soft delete | No | Sí |
| `orden_visual` | Para ordenar en la UI | No | No |
| `created_at` | Timestamp de creación | Sí | Sí |

**PK:** `id`
**Índices:** `(estado)` para filtrar mesas libres rápidamente
**Campos únicos:** `nombre` (no puede haber dos mesas con el mismo nombre)
**Campos opcionales:** `capacidad`, `hora_apertura`, `orden_visual`
**Nota:** Las 11 mesas actuales (hardcodeadas en GestionMesas.tsx) deben migrarse como datos iniciales

---

## Entidad: `clientes`

**Propósito:** Catálogo de clientes frecuentes y receptores de DTE tipo CCF.
Para consumidor final anónimo no se crea registro.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `tipo_persona` | ENUM: natural, juridica | No | Sí |
| `nit` | NIT del cliente | No | No |
| `nrc` | NRC (solo personas jurídicas) | No | No |
| `nombre` | Nombre o razón social | No | Sí |
| `email` | Correo electrónico | No | No |
| `telefono` | Teléfono de contacto | No | No |
| `activo` | Soft delete | No | Sí |
| `created_at` | Timestamp de creación | Sí | Sí |
| `updated_at` | Última modificación | No | Sí |

**PK:** `id`
**Índices:** `(nit)`, `(nombre)` para búsqueda rápida
**Campos únicos:** `nit` (cuando no es null); un mismo NIT no puede tener dos registros activos
**Campos opcionales:** `nit`, `nrc`, `email`, `telefono`
**Datos sensibles:** `nit`, `nrc` — acceso restringido por rol

---

## Entidad: `direcciones_entrega`

**Propósito:** Direcciones de entrega asociadas a clientes para el canal DELIVERY_PROPIO.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `cliente_id` | FK a clientes | Sí | Sí |
| `alias` | Nombre descriptivo ("Casa", "Trabajo") | No | No |
| `departamento` | CAT-012 del MH | No | Sí |
| `municipio` | CAT-013 del MH | No | Sí |
| `complemento` | Dirección detallada | No | Sí |
| `referencia` | Punto de referencia | No | No |
| `latitud` | Coordenada GPS | No | No |
| `longitud` | Coordenada GPS | No | No |
| `activo` | Soft delete | No | Sí |
| `created_at` | Timestamp | Sí | Sí |

**PK:** `id`
**Relaciones:** `cliente_id` → `clientes.id`
**Índices:** `(cliente_id)` para listar direcciones de un cliente
**Campos opcionales:** `alias`, `referencia`, `latitud`, `longitud`

---

## Entidad: `pedidos`

**Propósito:** Núcleo operativo del sistema. Representa la solicitud de consumo desde su
creación hasta que se convierte en Venta.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `uuid_idempotencia` | Previene duplicados | Sí | Sí |
| `canal` | ENUM: MESA, PICKUP, DELIVERY_PROPIO, PLATAFORMA_EXTERNA | Sí | Sí |
| `numero_pedido` | Correlativo diario por canal | Sí | Sí |
| `fecha` | Fecha del pedido | Sí | Sí |
| `hora_apertura` | Timestamp de creación | Sí | Sí |
| `hora_cierre` | Timestamp de cierre | No | No |
| `estado` | ENUM de estados del pedido | No | Sí |
| `mesa_id` | FK a mesas (solo MESA) | Sí | No |
| `usuario_id` | Usuario que creó el pedido | Sí | Sí |
| `cliente_id` | FK a clientes (requerido en DELIVERY_PROPIO) | Sí | No |
| `direccion_entrega_id` | FK a direcciones_entrega (requerido en DELIVERY_PROPIO) | Sí | No |
| `plataforma` | Nombre de la plataforma (ej: "pedidosya") | Sí | No |
| `referencia_externa` | ID del pedido en la plataforma externa | Sí | No |
| `comision_plataforma` | Comisión cobrada por la plataforma (DECIMAL) | No | No |
| `motorista_id` | FK a usuarios (solo DELIVERY_PROPIO) | No | No |
| `hora_estimada_entrega` | Estimación de entrega | No | No |
| `notas_generales` | Instrucciones generales | No | No |
| `subtotal_con_iva` | Total calculado de los ítems | No | Sí |
| `created_at` | Timestamp | Sí | Sí |
| `updated_at` | Última modificación | No | Sí |

**PK:** `id`
**Relaciones:**
- `mesa_id` → `mesas.id`
- `usuario_id` → `usuarios.id`
- `cliente_id` → `clientes.id`
- `direccion_entrega_id` → `direcciones_entrega.id`
- `motorista_id` → `usuarios.id`

**Índices:** `(canal, estado)`, `(fecha)`, `(mesa_id)`, `(plataforma, referencia_externa)`, `(usuario_id)`

**Campos únicos:**
- `uuid_idempotencia` — único globalmente
- `(plataforma, referencia_externa)` — único cuando ambos no son null (previene duplicados de PedidosYa)

**Campos inmutables:** `uuid_idempotencia`, `canal`, `numero_pedido`, `fecha`, `hora_apertura`,
`mesa_id`, `usuario_id`, `cliente_id`, `direccion_entrega_id`, `plataforma`, `referencia_externa`, `created_at`

**Campos opcionales:** `mesa_id`, `cliente_id`, `direccion_entrega_id`, `plataforma`,
`referencia_externa`, `comision_plataforma`, `motorista_id`, `hora_estimada_entrega`,
`notas_generales`, `hora_cierre`

**Datos sensibles:** Ninguno directo. `comision_plataforma` es información comercial sensible.

---

## Entidad: `pedido_items`

**Propósito:** Los ítems de un pedido con sus snapshots de precio al momento de agregar.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `pedido_id` | FK a pedidos | Sí | Sí |
| `menu_item_id` | FK a menu (puede ser null si ítem eliminado) | Sí | No |
| `nombre_snapshot` | Nombre del ítem al momento de agregar | Sí | Sí |
| `precio_snapshot_con_iva` | Precio con IVA al momento de agregar | Sí | Sí |
| `precio_snapshot_sin_iva` | Precio sin IVA calculado al agregar | Sí | Sí |
| `cantidad` | Unidades pedidas | No | Sí |
| `notas_item` | Instrucciones especiales | No | No |
| `estado_item` | ENUM: pendiente, en_preparacion, listo, entregado, cancelado | No | Sí |
| `created_at` | Timestamp | Sí | Sí |

**PK:** `id`
**Relaciones:** `pedido_id` → `pedidos.id`, `menu_item_id` → `menu.id`
**Índices:** `(pedido_id)`, `(estado_item)` para el KDS
**Campos inmutables:** Todos los campos `*_snapshot`, `pedido_id`, `menu_item_id`, `created_at`
**Campos opcionales:** `menu_item_id` (puede ser null si el ítem ya no existe), `notas_item`

---

## Entidad: `ventas`

**Propósito:** Registro fiscal inmutable de cada transacción completada. Fuente de verdad
financiera. No se puede eliminar, solo anular.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `numero_ticket` | Correlativo secuencial inmutable | Sí | Sí |
| `fecha` | Fecha de la venta | Sí | Sí |
| `hora` | Hora de la venta | Sí | Sí |
| `cajero_id` | Usuario que procesó el cobro | Sí | Sí |
| `pedido_id` | FK al pedido de origen | Sí | Sí |
| `mesa_id` | Copia de la mesa al momento (snapshot) | Sí | No |
| `canal` | Canal de origen (snapshot del pedido) | Sí | Sí |
| `tipo_receptor` | ENUM: consumidor_final, ccf | Sí | Sí |
| `cliente_id` | FK a clientes (para CCF) | Sí | No |
| `receptor_nit_snapshot` | NIT del receptor al momento de la venta | Sí | No |
| `receptor_nrc_snapshot` | NRC del receptor al momento de la venta | Sí | No |
| `receptor_nombre_snapshot` | Nombre del receptor | Sí | No |
| `receptor_email_snapshot` | Email del receptor | Sí | No |
| `subtotal_sin_iva` | Base imponible (DECIMAL) | Sí | Sí |
| `iva` | Monto IVA 13% (DECIMAL) | Sí | Sí |
| `propina` | Propina voluntaria (DECIMAL, default 0) | Sí | Sí |
| `total` | Total a pagar (DECIMAL) | Sí | Sí |
| `condicion_pago` | CAT-016: contado (1) o crédito (2) | Sí | Sí |
| `estado` | ENUM: completada, anulada | No | Sí |
| `motivo_anulacion` | Texto libre si se anuló | No | No |
| `anulada_por_id` | Usuario que anuló | No | No |
| `anulada_at` | Timestamp de anulación | No | No |
| `created_at` | Timestamp de creación | Sí | Sí |

**PK:** `id`
**Relaciones:** `cajero_id` → `usuarios.id`, `pedido_id` → `pedidos.id`, `cliente_id` → `clientes.id`
**Índices:** `(fecha)`, `(cajero_id)`, `(pedido_id)`, `(estado)`, `(canal)`
**Campos únicos:** `numero_ticket`, `pedido_id` (un pedido genera exactamente una venta)
**Campos inmutables:** Todos excepto `estado`, `motivo_anulacion`, `anulada_por_id`, `anulada_at`
**Campos opcionales:** `mesa_id`, `cliente_id`, campos `receptor_*_snapshot` (null si consumidor final), `propina`, `motivo_anulacion`
**Datos sensibles:** `receptor_nit_snapshot`, `receptor_nrc_snapshot` — acceso restringido

**Nota sobre los snapshots del receptor:** Los datos del receptor se copian en la venta al
momento del cobro. Si el cliente actualiza sus datos luego, la venta conserva los valores
originales (que son los que fueron al DTE).

---

## Entidad: `venta_items`

**Propósito:** Detalle de cada ítem en la venta con los valores fiscales definitivos.
Este es el cuerpoDocumento del DTE.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `venta_id` | FK a ventas | Sí | Sí |
| `menu_item_id` | FK a menu (nullable) | Sí | No |
| `descripcion` | Nombre del ítem (snapshot) | Sí | Sí |
| `cantidad` | Unidades vendidas | Sí | Sí |
| `precio_sin_iva` | Precio unitario sin IVA (DECIMAL) | Sí | Sí |
| `iva_unitario` | IVA por unidad (DECIMAL) | Sí | Sí |
| `precio_con_iva` | Precio unitario con IVA (DECIMAL) | Sí | Sí |
| `subtotal_sin_iva` | `precio_sin_iva * cantidad` (DECIMAL) | Sí | Sí |
| `iva_total` | `iva_unitario * cantidad` (DECIMAL) | Sí | Sí |
| `subtotal_con_iva` | `precio_con_iva * cantidad` (DECIMAL) | Sí | Sí |
| `tipo_item` | CAT-011: 1=Bienes (default) | Sí | Sí |
| `unidad_medida` | CAT-014: 59=Unidad (default) | Sí | Sí |
| `created_at` | Timestamp | Sí | Sí |

**PK:** `id`
**Relaciones:** `venta_id` → `ventas.id`, `menu_item_id` → `menu.id`
**Índices:** `(venta_id)`
**Campos inmutables:** Todos
**Campos opcionales:** `menu_item_id` (puede ser null si el ítem ya no existe en el menú)

---

## Entidad: `pagos`

**Propósito:** Registra cada forma de pago aplicada a una venta. Una venta puede tener
múltiples pagos (pago mixto).

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `venta_id` | FK a ventas | Sí | Sí |
| `forma_pago` | CAT-017: 01=Efectivo, 02=Débito, etc. | Sí | Sí |
| `monto` | Monto de este pago (DECIMAL) | Sí | Sí |
| `referencia` | Voucher, número de transferencia, etc. | Sí | No |
| `created_at` | Timestamp | Sí | Sí |

**PK:** `id`
**Relaciones:** `venta_id` → `ventas.id`
**Índices:** `(venta_id)`
**Campos inmutables:** Todos
**Campos opcionales:** `referencia`
**Invariante:** suma de `monto` por `venta_id` = `ventas.total`

---

## Entidad: `configuracion_fiscal`

**Propósito:** Datos del emisor DTE del restaurante. Existe solo un registro activo.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `nit` | NIT del emisor | No | Sí |
| `nrc` | NRC del emisor | No | Sí |
| `nombre` | Nombre legal | No | Sí |
| `nombre_comercial` | Nombre comercial | No | No |
| `cod_actividad` | CAT-019 | No | Sí |
| `desc_actividad` | Descripción de la actividad | No | No |
| `tipo_establecimiento` | CAT-009 | No | Sí |
| `cod_establecimiento` | Código del establecimiento (MH) | No | Sí |
| `cod_punto_venta` | Código del punto de venta (MH) | No | Sí |
| `dir_departamento` | CAT-012 | No | Sí |
| `dir_municipio` | CAT-013 | No | Sí |
| `dir_complemento` | Dirección detallada | No | Sí |
| `telefono` | Teléfono de contacto | No | No |
| `email` | Correo electrónico fiscal | No | No |
| `ambiente` | CAT-001: 00=prueba, 01=producción | No | Sí |
| `activo` | Indica si es el registro activo | No | Sí |
| `created_at` | Timestamp | Sí | Sí |
| `updated_at` | Última modificación | No | Sí |

**PK:** `id`
**Índices:** `(activo)` — siempre se filtra por el registro activo
**Campos únicos:** Solo un registro puede tener `activo = 1`
**Datos sensibles:** `nit`, `nrc` — acceso solo para admin. `passwordPri` del Firmador
**NUNCA** se guarda en esta tabla; va en variable de entorno del servidor.

---

## Entidad: `dte_documentos`

**Propósito:** Registro de cada DTE en su ciclo de vida completo.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `venta_id` | FK a ventas | Sí | Sí |
| `tipo_dte` | CAT-002: 01, 03, 05, 06 | Sí | Sí |
| `ambiente` | CAT-001 al momento de emitir | Sí | Sí |
| `modelo_facturacion` | CAT-003 | Sí | Sí |
| `tipo_transmision` | CAT-004: 1=normal, 2=contingencia | Sí | Sí |
| `codigo_generacion` | UUID v4 único | Sí | Sí |
| `numero_control` | Formato DTE-TT-PPPP-XXXXXXXXXXXXXXX | Sí | Sí |
| `fec_emi` | Fecha de emisión | Sí | Sí |
| `hor_emi` | Hora de emisión | Sí | Sí |
| `json_sin_firma` | JSON construido antes de firmar (TEXT) | Sí | No |
| `json_firmado` | JSON después del Firmador (TEXT) | Sí | No |
| `sello_mh` | Sello recibido del MH | Sí | No |
| `estado` | ENUM de estados del DTE (ver doc 11) | No | Sí |
| `respuesta_mh` | JSON completo de respuesta del MH | Sí | No |
| `created_at` | Timestamp de creación | Sí | Sí |
| `updated_at` | Última actualización de estado | No | Sí |

**PK:** `id`
**Relaciones:** `venta_id` → `ventas.id`
**Índices:** `(venta_id)`, `(estado)`, `(fec_emi)`, `(tipo_dte)`
**Campos únicos:** `codigo_generacion`, `numero_control`, `venta_id` (una venta → un DTE activo)
**Campos inmutables:** `codigo_generacion`, `numero_control`, `tipo_dte`, `ambiente`, `fec_emi`,
`hor_emi`, `json_sin_firma`, `json_firmado`, `sello_mh`, `respuesta_mh`, `venta_id`, `created_at`

---

## Entidad: `dte_intentos`

**Propósito:** Historial de cada intento de firma o transmisión para un DTE. Esencial para
diagnóstico de fallas y auditoría del proceso.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `dte_id` | FK a dte_documentos | Sí | Sí |
| `etapa` | ENUM: firma, transmision | Sí | Sí |
| `resultado` | ENUM: exito, error | Sí | Sí |
| `codigo_error` | Código de error del MH o del Firmador | Sí | No |
| `descripcion_error` | Descripción del error | Sí | No |
| `duracion_ms` | Tiempo de respuesta en milisegundos | Sí | No |
| `created_at` | Timestamp del intento | Sí | Sí |

**PK:** `id`
**Relaciones:** `dte_id` → `dte_documentos.id`
**Índices:** `(dte_id)`, `(created_at)`
**Campos inmutables:** Todos (solo INSERT, nunca UPDATE)

---

## Entidad: `dte_eventos_estado`

**Propósito:** Historial de todos los cambios de estado de cada DTE. Permite reconstruir
el ciclo de vida completo de cualquier documento.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `dte_id` | FK a dte_documentos | Sí | Sí |
| `estado_anterior` | Estado antes del cambio | Sí | No |
| `estado_nuevo` | Estado después del cambio | Sí | Sí |
| `usuario_id` | Quién disparó el cambio (si fue manual) | Sí | No |
| `motivo` | Descripción del cambio | Sí | No |
| `created_at` | Timestamp | Sí | Sí |

**PK:** `id`
**Relaciones:** `dte_id` → `dte_documentos.id`, `usuario_id` → `usuarios.id`
**Índices:** `(dte_id)`, `(created_at)`
**Campos inmutables:** Todos (solo INSERT)

---

## Entidad: `dte_correlativos`

**Propósito:** Mantiene el contador por tipo de DTE y punto de venta. Garantiza que los
números de control sean secuenciales y únicos incluso bajo carga concurrente.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `tipo_dte` | CAT-002: "01", "03", "05", "06" | Sí | Sí |
| `cod_establecimiento` | Código del establecimiento | Sí | Sí |
| `cod_punto_venta` | Código del punto de venta | Sí | Sí |
| `ultimo_correlativo` | Número del último DTE emitido | No | Sí |
| `updated_at` | Última actualización | No | Sí |

**PK:** `id`
**Índices:** Ninguno adicional (la búsqueda es siempre por la clave única)
**Campos únicos:** `(tipo_dte, cod_establecimiento, cod_punto_venta)`
**Invariante de concurrencia:** El incremento debe usar `SELECT ... FOR UPDATE` o equivalente
para prevenir race conditions. El `ultimo_correlativo` nunca puede decrementar.

---

## Entidad: `auditoria`

**Propósito:** Registro inmutable de todas las acciones críticas de negocio.

**Campos conceptuales:**

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `usuario_id` | Quién realizó la acción | Sí | Sí |
| `accion` | Nombre de la acción (ej: "venta.crear") | Sí | Sí |
| `entidad` | Tabla afectada | Sí | Sí |
| `entidad_id` | ID del registro afectado | Sí | Sí |
| `datos_antes` | JSON con los valores antes del cambio | Sí | No |
| `datos_despues` | JSON con los valores después del cambio | Sí | No |
| `ip_origen` | IP del cliente | Sí | No |
| `created_at` | Timestamp del evento | Sí | Sí |

**PK:** `id`
**Relaciones:** `usuario_id` → `usuarios.id` (no FK estricta para que no bloquee si se borra usuario)
**Índices:** `(usuario_id)`, `(entidad, entidad_id)`, `(created_at)`, `(accion)`
**Campos inmutables:** Todos (solo INSERT, nunca UPDATE ni DELETE)
**Nota de retención:** Los registros de auditoría se conservan indefinidamente o según la
política fiscal vigente de El Salvador.
**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Período mínimo de retención de registros
contables y fiscales según la ley tributaria de El Salvador.

---

## Diagrama de relaciones entre entidades nuevas

```
usuarios
  │ cajero_id, usuario_id, motorista_id
  ▼
pedidos ──────────────────────────────────────────────────────┐
  │ (canal, referencia_externa, plataforma)                   │ pedido_id
  │                                                           ▼
  ├─► pedido_items ────────────────────────────────────►  ventas ──────────────────────┐
  │     (nombre_snapshot, precio_snapshot_sin_iva)         │                           │
  │                                                        ├─► venta_items             │
  ├─► mesas (FK mesa_id)                                   │     (snapshot fiscal)      │
  ├─► clientes (FK cliente_id)                             ├─► pagos                   │
  └─► direcciones_entrega (FK)                             │     (forma_pago, monto)   │
        └─► clientes (FK cliente_id)                       │                           │
                                                           └─► dte_documentos ◄────────┘
                                                                 │  (codigo_generacion,
                                                                 │   numero_control)
                                                                 ├─► dte_intentos
                                                                 ├─► dte_eventos_estado
                                                                 └─► dte_correlativos (lee)

configuracion_fiscal ──────────────────────────────────► dte_documentos (emisor)
auditoria ◄────── todos los módulos (INSERT only)
```
