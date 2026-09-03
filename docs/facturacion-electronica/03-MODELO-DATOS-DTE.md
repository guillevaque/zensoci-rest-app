# 03 — Modelo de Datos DTE

Entidades de datos del sistema, incluyendo las existentes (con análisis de brechas DTE)
y las nuevas a crear. Sin SQL ni CREATE TABLE — solo estructura conceptual.

---

## Entidades existentes

### `menu`

| Columna | Tipo | Notas DTE |
|---|---|---|
| `id` | INT PK | `menu_item_id` en snapshots |
| `name` | VARCHAR | `nombre_snapshot` en venta_items |
| `category` | VARCHAR | |
| `price` | DECIMAL | **Precio CON IVA** — DTE requiere sin IVA |
| `description` | VARCHAR | |
| `image_url` | VARCHAR | |
| `active` | TINYINT(1) | |

**Brecha DTE:** `price` contiene precio con IVA. El DTE requiere precio sin IVA.
Solución temporal: `precio_sin_iva = price / 1.13` al generar snapshot.
Solución permanente: agregar columna `precio_sin_iva` a `menu`.

### `ingredientes`

Tabla dual: catálogo de inventario (`costeo_platillo_id IS NULL`) + líneas de receta.
Tiene `precio_compra_sin_iva` y `costo_unitario` pero no se usa directamente en el DTE.

### `costeo_platillos`

Tiene `precio_sin_iva` ya calculado. Se puede usar como referencia pero no como fuente
de verdad del DTE — la fuente es el snapshot en `venta_items`.

### `empaques`

Catálogo de materiales de empaque. Tiene `purchase_price_no_iva` y `unit_cost`.

---

## Brechas DTE en las entidades existentes

### Catálogos MH requeridos (todos faltan)

| Catálogo | Uso en DTE | Estado |
|---|---|---|
| CAT-001 Ambiente | `00`=prueba, `01`=producción | **FALTA** — necesita config |
| CAT-002 Tipo DTE | `01`=Factura, `03`=CCF, `05`=NC, `06`=ND | **FALTA** |
| CAT-003 Modelo Facturación | `1`=previo, `2`=diferido | **FALTA** |
| CAT-004 Tipo Transmisión | `1`=normal, `2`=contingencia | **FALTA** |
| CAT-005 Tipo Contingencia | 5 causales | **FALTA** |
| CAT-011 Tipo de ítem | `1`=Bienes, `2`=Servicios | **FALTA** — constante `1` en MVP |
| CAT-012 Departamento | Código 2 dígitos | **FALTA** en config emisor |
| CAT-013 Municipio | Código 2 dígitos | **FALTA** en config emisor |
| CAT-014 Unidad de Medida | Código numérico (ej. `59`=Unidad) | **FALTA** — constante `59` en MVP |
| CAT-015 Tributos | `20`=IVA 13% | **FALTA** — PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| CAT-016 Condición Operación | `1`=Contado, `2`=Crédito | **FALTA** |
| CAT-017 Forma de Pago | `01`=Efectivo, `02`=Débito, `03`=Crédito | **FALTA** |
| CAT-019 Actividad Económica | Código 5 dígitos | **FALTA** en config emisor |

### Mapeo de unidades de medida (CAT-014)

| Texto libre actual en `ingredientes.unidad` | Código CAT-014 |
|---|---|
| Gramos | 39 |
| Kilogramo | 34 |
| Mililitro | 26 |
| Litro | 23 |
| Unidad | 59 |
| Otro | 99 |

Para DTE de ventas, todos los ítems del menú se venden por "Unidad" (código `59`).

### Datos del emisor (todo falta)

| Campo DTE | Fuente posible | Estado |
|---|---|---|
| NIT del emisor | Config Settings | **FALTA** |
| NRC del emisor | Config Settings | **FALTA** |
| Nombre comercial | Hardcodeado en UI | Existe pero no en DB |
| Código de actividad económica | CAT-019 | **FALTA** |
| Dirección | Hardcodeada en UI | Existe pero no en DB |
| Código de establecimiento | MH | **FALTA** |
| Código de punto de venta | MH | **FALTA** |
| Teléfono | Placeholder en Settings | **FALTA dato real** |
| Email | PENDIENTE | **FALTA** |

### Firmador Docker (brecha crítica de infraestructura)

El Firmador corre solo en `localhost:8113` de la máquina del desarrollador.
El backend PHP en Hostinger no puede llamarlo.

Opciones a definir:
1. Desplegar el Firmador en servidor accesible desde Hostinger
2. Usar proxy / túnel seguro
3. Llamada desde el frontend (no recomendada)

**Esta es la brecha de infraestructura más crítica. Ningún avance DTE es posible sin resolverla.**

---

## Entidades nuevas a crear

### `mesas`

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

Índices: `(estado)`. Único: `nombre`. Las 11 mesas de GestionMesas.tsx se migran como datos iniciales.

---

### `clientes`

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
| `created_at` | Timestamp | Sí | Sí |
| `updated_at` | Última modificación | No | Sí |

Índices: `(nit)`, `(nombre)`. Único: `nit` cuando no es null.
Sensible: `nit`, `nrc` — acceso restringido por rol.
Para consumidor final anónimo no se crea registro.

---

### `direcciones_entrega`

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `cliente_id` | FK a clientes | Sí | Sí |
| `alias` | "Casa", "Trabajo" | No | No |
| `departamento` | CAT-012 del MH | No | Sí |
| `municipio` | CAT-013 del MH | No | Sí |
| `complemento` | Dirección detallada | No | Sí |
| `referencia` | Punto de referencia | No | No |
| `latitud` | Coordenada GPS | No | No |
| `longitud` | Coordenada GPS | No | No |
| `activo` | Soft delete | No | Sí |
| `created_at` | Timestamp | Sí | Sí |

Índices: `(cliente_id)`.

---

### `pedidos`

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
| `referencia_externa` | ID del pedido en la plataforma | Sí | No |
| `comision_plataforma` | Comisión cobrada (DECIMAL) — no entra en DTE | No | No |
| `motorista_id` | FK a usuarios (solo DELIVERY_PROPIO) | No | No |
| `hora_estimada_entrega` | Estimación de entrega | No | No |
| `notas_generales` | Instrucciones generales | No | No |
| `subtotal_con_iva` | Total calculado de los ítems | No | Sí |
| `created_at` | Timestamp | Sí | Sí |
| `updated_at` | Última modificación | No | Sí |

Índices: `(canal, estado)`, `(fecha)`, `(mesa_id)`, `(plataforma, referencia_externa)`, `(usuario_id)`.
Únicos: `uuid_idempotencia`; `(plataforma, referencia_externa)` cuando ambos no son null.

---

### `pedido_items`

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `pedido_id` | FK a pedidos | Sí | Sí |
| `menu_item_id` | FK a menu (nullable si ítem eliminado) | Sí | No |
| `nombre_snapshot` | Nombre del ítem al momento de agregar | Sí | Sí |
| `precio_snapshot_con_iva` | Precio con IVA al agregar | Sí | Sí |
| `precio_snapshot_sin_iva` | Precio sin IVA calculado al agregar | Sí | Sí |
| `cantidad` | Unidades pedidas | No | Sí |
| `notas_item` | Instrucciones especiales | No | No |
| `estado_item` | ENUM: pendiente, en_preparacion, listo, entregado, cancelado | No | Sí |
| `created_at` | Timestamp | Sí | Sí |

Índices: `(pedido_id)`, `(estado_item)`. Todos los campos `*_snapshot` son inmutables.

---

### `ventas`

Registro fiscal inmutable de cada transacción. Fuente de verdad financiera. No se elimina, solo se anula.

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `numero_ticket` | Correlativo secuencial inmutable | Sí | Sí |
| `fecha` | Fecha de la venta | Sí | Sí |
| `hora` | Hora de la venta | Sí | Sí |
| `cajero_id` | Usuario que procesó el cobro | Sí | Sí |
| `pedido_id` | FK al pedido de origen | Sí | Sí |
| `mesa_id` | Snapshot de la mesa | Sí | No |
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

Índices: `(fecha)`, `(cajero_id)`, `(pedido_id)`, `(estado)`, `(canal)`.
Únicos: `numero_ticket`, `pedido_id` (un pedido → exactamente una venta).
Sensible: `receptor_nit_snapshot`, `receptor_nrc_snapshot` — acceso restringido.

> Los datos del receptor se copian en la venta al momento del cobro. Si el cliente actualiza
> sus datos luego, la venta conserva los valores originales (que son los que fueron al DTE).

---

### `venta_items`

Detalle de cada ítem en la venta con los valores fiscales definitivos. Es el `cuerpoDocumento` del DTE.

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

Índices: `(venta_id)`. Todos los campos son inmutables.

---

### `pagos`

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `venta_id` | FK a ventas | Sí | Sí |
| `forma_pago` | CAT-017: 01=Efectivo, 02=Débito, etc. | Sí | Sí |
| `monto` | Monto de este pago (DECIMAL) | Sí | Sí |
| `referencia` | Voucher, número de transferencia | Sí | No |
| `created_at` | Timestamp | Sí | Sí |

Índices: `(venta_id)`. Invariante: suma de `monto` por `venta_id` = `ventas.total`.

---

### `configuracion_fiscal`

Datos del emisor DTE. Solo un registro activo.

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

Índices: `(activo)`. Único: solo un registro puede tener `activo = 1`.
**`passwordPri` del Firmador NUNCA se guarda aquí. Solo en variable de entorno del servidor.**

---

### `dte_documentos`

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
| `estado` | ENUM de estados del DTE | No | Sí |
| `respuesta_mh` | JSON completo de respuesta del MH | Sí | No |
| `created_at` | Timestamp de creación | Sí | Sí |
| `updated_at` | Última actualización de estado | No | Sí |

Índices: `(venta_id)`, `(estado)`, `(fec_emi)`, `(tipo_dte)`.
Únicos: `codigo_generacion`, `numero_control`, `venta_id` (una venta → un DTE activo).

---

### `dte_intentos`

Historial de cada intento de firma o transmisión. Solo INSERT, nunca UPDATE.

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

Índices: `(dte_id)`, `(created_at)`.

---

### `dte_eventos_estado`

Historial de cambios de estado de cada DTE. Solo INSERT, nunca UPDATE.

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `dte_id` | FK a dte_documentos | Sí | Sí |
| `estado_anterior` | Estado antes del cambio | Sí | No |
| `estado_nuevo` | Estado después del cambio | Sí | Sí |
| `usuario_id` | Quién disparó el cambio (si fue manual) | Sí | No |
| `motivo` | Descripción del cambio | Sí | No |
| `created_at` | Timestamp | Sí | Sí |

Índices: `(dte_id)`, `(created_at)`.

---

### `dte_correlativos`

Mantiene el contador por tipo de DTE. El incremento usa `SELECT ... FOR UPDATE` para concurrencia.

| Campo | Propósito | Inmutable | Requerido |
|---|---|---|---|
| `id` | PK autoincrement | Sí | Sí |
| `tipo_dte` | CAT-002: "01", "03", "05", "06" | Sí | Sí |
| `cod_establecimiento` | Código del establecimiento | Sí | Sí |
| `cod_punto_venta` | Código del punto de venta | Sí | Sí |
| `ultimo_correlativo` | Número del último DTE emitido | No | Sí |
| `updated_at` | Última actualización | No | Sí |

Único: `(tipo_dte, cod_establecimiento, cod_punto_venta)`.
Invariante: `ultimo_correlativo` nunca puede decrementar.

---

### `auditoria`

Registro inmutable de acciones críticas de negocio. Solo INSERT, nunca UPDATE ni DELETE.

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

Índices: `(usuario_id)`, `(entidad, entidad_id)`, `(created_at)`, `(accion)`.

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Período mínimo de retención de registros
contables y fiscales según la ley tributaria de El Salvador.

---

## Diagrama de relaciones

```
usuarios
  │ cajero_id, usuario_id, motorista_id
  ▼
pedidos ────────────────────────────────────────────────────┐
  │ (canal, referencia_externa, plataforma)                 │ pedido_id
  │                                                         ▼
  ├─► pedido_items ─────────────────────────────────►  ventas ──────────────────────┐
  │     (nombre_snapshot, precio_snapshot_sin_iva)       │                           │
  │                                                      ├─► venta_items             │
  ├─► mesas (FK mesa_id)                                 │     (snapshot fiscal)     │
  ├─► clientes (FK cliente_id)                           ├─► pagos                   │
  └─► direcciones_entrega (FK)                           │     (forma_pago, monto)   │
        └─► clientes (FK cliente_id)                     │                           │
                                                         └─► dte_documentos ◄────────┘
                                                               │  (codigo_generacion,
                                                               │   numero_control)
                                                               ├─► dte_intentos
                                                               ├─► dte_eventos_estado
                                                               └─► dte_correlativos (lee)

configuracion_fiscal ────────────────────────────► dte_documentos (emisor)
auditoria ◄────── todos los módulos (INSERT only)
```

---

## Qué puede reutilizarse para DTE

| Elemento existente | Reutilización |
|---|---|
| `src/services/http.ts` | Llamadas al Firmador y a los endpoints del MH |
| `src/auth/AuthContext.jsx` | Identificar el cajero emisor del DTE |
| Roles de usuario (`admin`, `manager`, `staff`) | Controlar quién puede emitir DTE |
| `costeo_platillos.precio_sin_iva` | Referencia de precio sin IVA |
| `menu.id` y `menu.name` | Descripción del ítem en el DTE |
| Estructura de Layout + Sidebar | Agregar sección "Facturación" sin rediseñar |
| `Settings.tsx` | Base para el formulario de configuración del emisor DTE |
| Patrón CRUD PHP (`ingredients.php`, `menu.php`) | Mismo patrón para `dte_documentos.php` |
