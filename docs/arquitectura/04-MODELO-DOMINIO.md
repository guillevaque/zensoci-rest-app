# 04 — Modelo de Dominio

Modelo de dominio del ERP Zensoci usando conceptos DDD: entidades, objetos de valor, agregados
y eventos de dominio. Los 5 Bounded Contexts son independientes; cuando comparten datos lo hacen
a través de eventos o identificadores, no por FK directas entre contextos.

---

## Los 5 Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────┐
│ BC-1: IDENTIDAD Y ACCESO                                            │
│   Usuario, Rol, Sesión, Turno                                       │
└─────────────────────────────────────────────────────────────────────┘
            │ usuario_id (solo el ID viaja entre contextos)
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BC-2: OPERACIÓN DE SALA                                             │
│   Mesa, Pedido, DetallePedido, Ticket de Cocina                     │
└─────────────────────────────────────────────────────────────────────┘
            │ pedido_id
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BC-3: VENTAS Y COBRO                                                │
│   Venta, ItemVenta, Pago, Cliente (Receptor)                        │
└─────────────────────────────────────────────────────────────────────┘
            │ venta_id
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BC-4: FACTURACIÓN ELECTRÓNICA                                       │
│   DocumentoDTE, CorrelativoDTE, EmisorDTE, EventoContingencia       │
│   NotaCredito, NotaDebito                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ BC-5: CATÁLOGO Y PRODUCCIÓN                                         │
│   MenuItem, CosteoPlatillo, Receta, LineaReceta,                    │
│   Ingrediente, Empaque, Proveedor, Compra                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## BC-1: Identidad y Acceso

### Entidades

#### Usuario (raíz)
- `id`, `nombre`, `email` (único), `password_hash` (bcrypt), `pin_hash`
- `rol` — Rol (objeto de valor)
- `color_avatar` — hex, `activo` — boolean

**Invariantes:** Email único; PIN único entre empleados activos; no existe usuario sin rol.

#### Sesión
- `id` (token), `usuario_id`, `ip_origen`, `created_at`, `expires_at`

#### Turno
- `id`, `fecha`, `hora_apertura`, `hora_cierre` (nullable)
- `usuario_apertura_id`, `usuario_cierre_id` (nullable), `estado` — EstadoTurno

**Invariante:** Solo puede existir un Turno en estado "activo" por establecimiento.

### Objetos de Valor

#### Rol
`admin` | `manager` | `staff` | `member`

Permisos:
- `admin` — acceso total, incluye configuración fiscal
- `manager` — operación + reportes + cancelaciones
- `staff` — toma pedidos, cobra, sin acceso a config
- `member` — solo toma pedidos (mesero)

#### EstadoTurno
`activo` | `cerrado`

---

## BC-2: Operación de Sala

### Entidades

#### Mesa (raíz)
- `id`, `nombre` ("Mesa 1"…"Mesa 10", "Pickup"), `tipo` — TipoMesa
- `capacidad`, `estado` — EstadoMesa
- `hora_apertura` (nullable), `mesero_id` (nullable), `activo`

**Invariantes:** Solo puede tener un Pedido activo a la vez. Una mesa `fuera_de_servicio` no puede recibir pedidos.

#### Pedido (raíz — Agregado)
- `id`, `numero_pedido`, `fecha`, `hora_apertura`
- `canal` — ENUM(`MESA`, `PICKUP`, `DELIVERY_PROPIO`, `PLATAFORMA_EXTERNA`)
- `mesa_id` (nullable), `mesero_id`, `estado` — EstadoPedido
- `referencia_externa` (nullable), `plataforma` (nullable)
- `cliente_id` (nullable), `direccion_entrega_id` (nullable)
- `motorista_id` (nullable), `hora_estimada_entrega` (nullable)
- `comision_plataforma` (nullable), `notas_generales` (nullable)
- `uuid_idempotencia` — UUID v4 para pedidos presenciales
- `items` — colección de DetallePedido

**Invariantes:** Un Pedido sin ítems no puede ir a cocina. No puede pasar a "pagado" sin Venta asociada.

**Idempotencia por canal:**
- PLATAFORMA_EXTERNA: UNIQUE(plataforma, referencia_externa)
- Presenciales: uuid_idempotencia

#### DetallePedido (parte del agregado Pedido)
- `id`, `pedido_id`, `menu_item_id`
- `nombre_snapshot` — nombre del ítem al momento del pedido
- `precio_snapshot_con_iva`, `precio_snapshot_sin_iva` — inmutables desde el momento del pedido
- `cantidad` (> 0), `notas_item` (nullable), `estado_item` — EstadoItem

### Objetos de Valor

#### TipoMesa
`regular` | `pickup` | `delivery`

#### EstadoMesa
`libre` | `ocupada` | `necesita_check` | `fuera_de_servicio`

#### EstadoPedido
`abierto` | `en_cocina` | `listo` | `entregado` | `pagado` | `cancelado`

Transiciones válidas:
```
abierto → en_cocina → listo → entregado → pagado
abierto | en_cocina | listo | entregado → cancelado
```

#### EstadoItem
`pendiente` | `en_preparacion` | `listo` | `entregado` | `cancelado`

### Eventos de dominio
- `PedidoAbierto(pedido_id, canal, mesa_id, mesero_id, fecha_hora)`
- `ItemAgregadoAPedido(pedido_id, item_id, menu_item_id, cantidad)`
- `ItemCancelado(pedido_id, item_id, motivo)`
- `PedidoEnviadoACocina(pedido_id)`
- `ItemListoEnCocina(pedido_id, item_id)`
- `PedidoListo(pedido_id)`
- `PedidoEntregado(pedido_id)`
- `PedidoCancelado(pedido_id, motivo, autorizado_por)`
- `MesaLiberada(mesa_id, pedido_id)`

---

## BC-3: Ventas y Cobro

### Entidades

#### Venta (raíz — Agregado)
- `id`, `numero_ticket` — secuencial, único, **inmutable**
- `fecha`, `hora`, `cajero_id`, `pedido_id`, `mesa_id`
- `tipo_receptor` — TipoReceptor, `cliente_id` (nullable)
- `subtotal_sin_iva`, `iva`, `propina`, `total` — Dinero
- `condicion_pago` — CondicionPago, `estado` — EstadoVenta
- `items` — colección de ItemVenta, `pagos` — colección de Pago

**Invariantes:**
- `numero_ticket` inmutable después de creado
- Una Venta no puede eliminarse; solo anularse
- `suma(pagos.monto)` debe igualar `total`
- `subtotal_sin_iva + iva = total - propina`
- Una Venta no puede anularse sin emitir primero una Nota de Crédito

#### ItemVenta (parte del agregado Venta)
- `id`, `venta_id`, `menu_item_id` (nullable)
- `descripcion` — snapshot del nombre
- `cantidad`, `precio_sin_iva`, `iva_unitario`, `precio_con_iva`
- `tipo_item` — TipoItemCAT011, `unidad_medida` — UnidadMedidaCAT014

#### Pago (parte del agregado Venta)
- `id`, `venta_id`, `forma_pago` — FormaPagoCAT017
- `monto` — Dinero, `referencia` (nullable)

#### Cliente (raíz)
- `id`, `tipo` — TipoPersona
- `nit` (nullable), `nrc` (nullable — solo para jurídica)
- `nombre`, `email` (nullable), `telefono` (nullable), `direccion` (nullable), `activo`

**Invariante:** Un Cliente jurídico debe tener NIT y NRC para emitir CCF.

### Objetos de Valor

#### Dinero
`cantidad` — DECIMAL(10,4) para precios unitarios, DECIMAL(10,2) para totales; moneda = USD

#### TipoReceptor
`consumidor_final` | `ccf`

#### TipoPersona
`natural` | `juridica`

#### EstadoVenta
`completada` | `anulada`

#### CondicionPago (CAT-016)
`contado` (1) | `credito` (2)

#### FormaPagoCAT017
`efectivo` (01) | `debito` (02) | `credito` (03) | `transferencia` (04) | `cheque` (05) | `otro` (99)

PENDIENTE DE VALIDAR CON FUENTE OFICIAL: código CAT-017 para pagos vía PLATAFORMA_EXTERNA.

#### TipoItemCAT011
`bienes` (1) | `servicios` (2) | `ambos` (3)

#### UnidadMedidaCAT014 (parcial)
`unidad` (59) | `kilogramo` (34) | `gramo` (39) | `litro` (23) | `mililitro` (26) | `otro` (99)

### Eventos de dominio
- `VentaCreada(venta_id, pedido_id, cajero_id, total, tipo_receptor)`
- `PagoRegistrado(venta_id, forma_pago, monto)`
- `VentaAnulada(venta_id, motivo, autorizado_por)`

---

## BC-4: Facturación Electrónica

### Entidades

#### DocumentoDTE (raíz — Agregado)
- `id`, `venta_id`
- `tipo_dte` — TipoDTECAT002
- `ambiente` — AmbienteMHCAT001
- `modelo_facturacion` — ModeloFacturacionCAT003
- `tipo_transmision` — TipoTransmisionCAT004
- `codigo_generacion` — UUID v4, único e **inmutable**
- `numero_control` — formato `DTE-TT-PPPP-XXXXXXXXXXXXXXXXX`, único e **inmutable**
  PENDIENTE DE VALIDAR CON FUENTE OFICIAL: formato exacto del número de control
- `fec_emi`, `hor_emi`
- `json_sin_firma`, `json_firmado`
- `sello_mh` (nullable) — solo cuando estado = "aceptado"
- `estado` — EstadoDTE, `respuesta_mh` (nullable)

**Invariantes:**
- `codigo_generacion` y `numero_control` son inmutables después de generados
- Un DTE no puede transmitirse sin ser firmado primero
- El `sello_mh` solo se almacena cuando el estado es "aceptado"

#### CorrelativoDTE (raíz)
- `id`, `tipo_dte`, `cod_establecimiento`, `cod_punto_venta`
- `ultimo_correlativo` — incremento atómico (SELECT ... FOR UPDATE)

**Invariantes:** Incremento atómico sin race conditions; nunca puede decrementar.

#### EmisorDTE (raíz — Singleton)
- `id`, `nit`, `nrc`, `nombre`, `nombre_comercial`
- `cod_actividad` (CAT-019), `desc_actividad`
- `tipo_establecimiento` (CAT-009), `cod_establecimiento`, `cod_punto_venta`
- `dir_departamento` (CAT-012), `dir_municipio` (CAT-013), `dir_complemento`
- `telefono`, `email`, `ambiente` (CAT-001), `activo`

#### EventoContingencia (raíz)
- `id`, `fecha_inicio`, `fecha_fin` (nullable)
- `causal` — CausalContingenciaCAT005, `descripcion`
- `estado` — `activo` | `cerrado`
- `dtes_afectados` — colección de IDs de DocumentoDTE

#### NotaCredito (raíz)
- `id`, `dte_origen_id`, `venta_id`, `motivo`
- `monto_total`, `documento_dte_id` (el DTE tipo 05 generado)

#### NotaDebito (raíz)
- `id`, `dte_origen_id`, `motivo`, `monto_cargo`, `documento_dte_id` (el DTE tipo 06 generado)

### Objetos de Valor

#### TipoDTECAT002
`factura` (01) | `ccf` (03) | `nota_credito` (05) | `nota_debito` (06)

#### AmbienteMHCAT001
`prueba` (00) | `produccion` (01)

#### ModeloFacturacionCAT003
`previo` (1) | `diferido` (2)

#### TipoTransmisionCAT004
`normal` (1) | `contingencia` (2)

#### CausalContingenciaCAT005
`sin_internet` (1) | `falla_mh` (2) | `falla_firmador` (3) | `corte_energia` (4) | `otro` (5)

#### EstadoDTE
`pendiente_generacion` | `generado` | `validado` | `error_validacion` |
`pendiente_firma` | `firmado` | `error_firma` |
`pendiente_transmision` | `transmitiendo` | `aceptado` | `rechazado` | `error_temporal` | `anulado`

Ver `04-ESTADOS-IDEMPOTENCIA-REINTENTOS.md` para la tabla completa de transiciones.

#### NumeroControl (objeto de valor inmutable)
`DTE-TT-PPPP-XXXXXXXXXXXXXXXXX`
- `TT` = código de tipo DTE (2 dígitos)
- `PPPP` = código de punto de venta (4 dígitos)
- `XXXXXXXXXXXXXXXXX` = correlativo (15 dígitos, cero a la izquierda)

PENDIENTE DE VALIDAR CON FUENTE OFICIAL: formato exacto del número de control en el Manual Técnico vigente del MH.

### Eventos de dominio
- `DTEGenerado(dte_id, venta_id, tipo_dte, codigo_generacion)`
- `DTEFirmado(dte_id)`
- `DTETransmitido(dte_id)`
- `DTEAceptado(dte_id, sello_mh)`
- `DTERechazado(dte_id, codigo_error, descripcion_error)`
- `ContingenciaIniciada(evento_id, causal)`
- `ContingenciaCerrada(evento_id, total_dte_retransmitidos)`
- `NotaCreditoEmitida(nc_id, dte_origen_id)`

---

## BC-5: Catálogo y Producción

### Entidades

#### MenuItem (raíz)
- `id`, `nombre`, `categoria`
- `precio_con_iva`, `precio_sin_iva` — Dinero
- `descripcion` (nullable), `imagen_url` (nullable), `activo`

**Invariante:** `precio_sin_iva * 1.13 ≈ precio_con_iva` (diferencia máxima $0.01 por redondeo).

**Estado actual:** La columna `precio_sin_iva` no existe aún en la tabla `menu`. Se calcula como `price / 1.13` hasta que se agregue. Ver `docs/facturacion-electronica/03-MODELO-DATOS-DTE.md`.

#### CosteoPlatillo (raíz)
- `id`, `menu_item_id` (nullable), `nombre`, `categoria`, `porciones`
- `precio_con_iva`, `precio_sin_iva`, `costo_porcion`, `costo_subreceta`
- `costo_empaque`, `costo_unitario`, `margen`, `pct_costo`, `precio_delivery`
- `lineas` — colección de LineaReceta

#### LineaReceta (parte del agregado CosteoPlatillo)
- `id`, `costeo_platillo_id`, `tipo` — TipoLineaReceta
- `ingrediente_id` (nullable), `empaque_id` (nullable)
- `nombre_referencia` (snapshot), `cantidad`, `unidad`, `pct_merma`
- `precio_referencia` (snapshot), `costo_linea` (calculado)

**Invariante:** Debe tener `ingrediente_id` O `empaque_id`, no ambos, no ninguno.

#### Ingrediente (raíz)
- `id`, `nombre`, `tipo`, `categoria`, `marca` (nullable), `proveedor` (nullable)
- `presentacion_compra`, `unidad`
- `stock_actual`, `stock_minimo`
- `precio_compra_con_iva`, `precio_compra_sin_iva`, `costo_unitario`, `activo`

**Nota técnica:** La tabla `ingredientes` sirve como doble propósito: catálogo (WHERE `costeo_platillo_id IS NULL`) y líneas de receta (WHERE `costeo_platillo_id IS NOT NULL`). Este diseño es deuda técnica (ver R5 en `01-ARQUITECTURA-ACTUAL.md`).

#### Empaque (raíz)
- `id`, `nombre`, `categoria`, `marca` (nullable), `proveedor` (nullable)
- `presentacion`, `unidad`, `unidades_paquete`
- `precio_sin_iva`, `costo_unitario`
- `stock`, `stock_minimo`, `activo`

#### Proveedor (raíz)
- `id`, `nombre`, `contacto` (nullable), `telefono` (nullable), `email` (nullable), `activo`

#### Compra (raíz — Agregado)
- `id`, `fecha`, `proveedor_id`, `usuario_id`, `total`
- `estado` — `borrador` | `confirmada`
- `lineas` — colección de LineaCompra

#### LineaCompra (parte del agregado Compra)
- `id`, `compra_id`, `tipo` — `ingrediente` | `empaque`
- `item_id`, `nombre_snapshot`, `cantidad`, `precio_unitario`, `total_linea`

### Objetos de Valor

#### TipoLineaReceta
`principal` | `secundario` | `empaque`

### Eventos de dominio
- `MenuItemPrecioCambiado(menu_item_id, precio_anterior, precio_nuevo)`
- `MenuItemDesactivado(menu_item_id)`
- `IngredienteStockBajo(ingrediente_id, stock_actual, stock_minimo)`
- `EmpaqueStockBajo(empaque_id, stock_actual, stock_minimo)`
- `CompraConfirmada(compra_id, proveedor_id, items_actualizados)`
- `CostoMargenBajo(costeo_platillo_id, margen_actual, umbral)`

---

## Tabla de agregados

| Agregado | Raíz | Entidades hijas |
|---|---|---|
| Pedido | Pedido | DetallePedido |
| Venta | Venta | ItemVenta, Pago |
| Turno | Turno | TurnoUsuario |
| Compra | Compra | LineaCompra |
| CosteoPlatillo | CosteoPlatillo | LineaReceta |
| DocumentoDTE | DocumentoDTE | (ninguna; referencias por ID) |
| EventoContingencia | EventoContingencia | (lista de IDs de DTE) |

---

## Reglas de consistencia entre contextos

| Regla | Origen | Destino | Mecanismo |
|---|---|---|---|
| Al pagar un pedido, crear una venta | BC-2 Sala | BC-3 Ventas | Evento `PedidoPagado` |
| Al crear una venta, emitir un DTE | BC-3 Ventas | BC-4 Facturación | Evento `VentaCreada` |
| Al cambiar precio del menú, notificar | BC-5 Catálogo | BC-2 Sala | Evento `MenuItemPrecioCambiado` |
| Al agotar stock, alertar al dashboard | BC-5 Catálogo | Dashboard | Evento `IngredienteStockBajo` |
| Al confirmar una compra, actualizar stock | BC-5 Compras | BC-5 Catálogo | Evento `CompraConfirmada` |
| Al aceptar un DTE, actualizar venta | BC-4 Facturación | BC-3 Ventas | Evento `DTEAceptado` |

---

## Mapa de relaciones conceptuales

```
EmisorDTE ─────────────────────────────────────────── alimenta ──► DocumentoDTE
                                                                          ▲
Usuario ────────────────────────────────────────────────────── emite ────┘
  │ toma pedido                                                          ▲
  ▼                                                                      │ genera
Mesa ─── tiene ──► Pedido ─────────────────── se paga ──► Venta ────────┘
                      │                                      │
                      │ contiene                             │ contiene
                      ▼                                      ▼
                 DetallePedido                         ItemVenta ◄── Pago
                      │                                      │
                      │ referencia                           │ referencia
                      ▼                                      ▼
                  MenuItem                           (precio_sin_iva
                      │                              de CosteoPlatillo)
                      ▼
                 CosteoPlatillo
                      │
                      ▼
                  LineaReceta ──► Ingrediente / Empaque

CorrelativoDTE ──► DocumentoDTE ──► EventoContingencia (si aplica)
Cliente ────────────────────────────────────► Venta / DocumentoDTE
```

---

## Estado de entidades en el sistema

### Con soporte completo (DB + PHP + React)
- Usuario (tabla implícita en auth), MenuItem (`menu`), CosteoPlatillo (`costeo_platillos`)
- LineaReceta (filas `ingredientes` con `costeo_platillo_id`)
- Ingrediente (filas `ingredientes` sin `costeo_platillo_id`), Empaque (`empaques`)

### Solo en UI (sin DB ni backend)
- Mesa (hardcodeada en `GestionMesas.tsx`)
- Pedido (hardcodeado en `Pedidos.tsx`)
- DetallePedido (no existe en ninguna capa)

### No existen en ninguna capa
- Venta, ItemVenta, Pago, Cliente, EmisorDTE, DocumentoDTE, CorrelativoDTE, EventoContingencia, Turno
