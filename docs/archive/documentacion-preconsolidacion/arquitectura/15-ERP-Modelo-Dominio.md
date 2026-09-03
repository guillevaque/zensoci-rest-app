# 15 — ERP Zensoci: Modelo de Dominio

Este documento define el modelo de dominio del ERP Zensoci usando conceptos de Domain-Driven Design:
entidades, objetos de valor, agregados, repositorios y eventos de dominio.

---

## Dominios funcionales (Bounded Contexts)

El ERP se divide en **5 contextos delimitados** (Bounded Contexts). Cada contexto es responsable
de su propio modelo; cuando dos contextos comparten datos, lo hacen a través de eventos o de
identificadores, no por FK directas entre contextos.

```
┌─────────────────────────────────────────────────────────────────────┐
│ BOUNDED CONTEXT 1: IDENTIDAD Y ACCESO                               │
│   Usuario, Rol, Sesión, Turno                                       │
└─────────────────────────────────────────────────────────────────────┘
            │ usuario_id (solo el ID viaja entre contextos)
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BOUNDED CONTEXT 2: OPERACIÓN DE SALA                                │
│   Mesa, Pedido, DetallePedido, Ticket de Cocina                     │
└─────────────────────────────────────────────────────────────────────┘
            │ pedido_id
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BOUNDED CONTEXT 3: VENTAS Y COBRO                                   │
│   Venta, ItemVenta, Pago, Cliente (Receptor)                        │
└─────────────────────────────────────────────────────────────────────┘
            │ venta_id
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BOUNDED CONTEXT 4: FACTURACIÓN ELECTRÓNICA                          │
│   DocumentoDTE, CorrelativoDTE, EmisorDTE, EventoContingencia       │
│   NotaCredito, NotaDebito                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ BOUNDED CONTEXT 5: CATÁLOGO Y PRODUCCIÓN                            │
│   MenuItem, CosteoPlatillo, Receta, LineaReceta,                    │
│   Ingrediente, Empaque, Proveedor, Compra                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Bounded Context 1: Identidad y Acceso

### Entidades

#### Usuario (Entidad raíz)
- `id` — identificador único
- `nombre` — nombre para mostrar
- `email` — único en el sistema
- `password_hash` — contraseña cifrada (bcrypt)
- `pin_hash` — PIN de 4 dígitos cifrado
- `rol` — `Rol` (objeto de valor)
- `color_avatar` — código hexadecimal de color
- `activo` — boolean

**Invariantes:**
- El email debe ser único en el sistema
- El PIN debe ser único entre empleados activos
- No puede existir un usuario sin rol

#### Sesión (Entidad)
- `id` — token de sesión
- `usuario_id` — referencia al Usuario
- `ip_origen` — IP de la sesión
- `created_at` — cuando se inició
- `expires_at` — cuando expira

#### Turno (Entidad)
- `id`
- `fecha`
- `hora_apertura`
- `hora_cierre` (nullable)
- `usuario_apertura_id`
- `usuario_cierre_id` (nullable)
- `estado` — `EstadoTurno`

**Invariantes:**
- Solo puede existir un Turno en estado "activo" por establecimiento

### Objetos de Valor

#### Rol
Enumeración: `admin` | `manager` | `staff` | `member`

**Permisos implícitos:**
- `admin` — acceso total, incluye configuración fiscal
- `manager` — operación + reportes + cancelaciones
- `staff` — toma pedidos, cobra, no accede a config
- `member` — solo toma pedidos (mesero)

#### EstadoTurno
Enumeración: `activo` | `cerrado`

---

## Bounded Context 2: Operación de Sala

### Entidades

#### Mesa (Entidad raíz)
- `id`
- `nombre` — "Mesa 1", "Pickup", "Delivery"
- `tipo` — `TipoMesa`
- `capacidad` — número de personas
- `estado` — `EstadoMesa`
- `hora_apertura` (nullable) — cuándo se ocupó
- `mesero_id` (nullable) — Usuario asignado
- `activo` — boolean

**Invariantes:**
- Solo puede tener un Pedido activo en un momento dado
- Una mesa en estado `fuera_de_servicio` no puede recibir pedidos

#### Pedido (Entidad raíz — Agregado)
- `id`
- `numero_pedido` — secuencial por turno
- `fecha`
- `hora_apertura`
- `mesa_id`
- `mesero_id`
- `estado` — `EstadoPedido`
- `notas_generales` (nullable)
- `items` — colección de `DetallePedido`

**Invariantes:**
- Un Pedido sin ítems no puede ir a cocina
- Un Pedido no puede cambiar a "pagado" si no tiene Venta asociada
- Solo el mesero asignado o un manager puede cancelar el pedido

#### DetallePedido (Entidad, parte del agregado Pedido)
- `id`
- `pedido_id`
- `menu_item_id`
- `nombre_snapshot` — nombre del ítem al momento del pedido
- `precio_snapshot` — precio con IVA al momento del pedido
- `cantidad`
- `notas_item` (nullable)
- `estado_item` — `EstadoItem`

**Invariantes:**
- El `precio_snapshot` no cambia aunque el menú se actualice
- La `cantidad` debe ser mayor que cero

### Objetos de Valor

#### TipoMesa
Enumeración: `regular` | `pickup` | `delivery`

#### EstadoMesa
Enumeración: `libre` | `ocupada` | `necesita_check` | `fuera_de_servicio`

#### EstadoPedido
Enumeración: `abierto` | `en_cocina` | `listo` | `entregado` | `pagado` | `cancelado`

**Transiciones válidas:**
```
abierto → en_cocina
en_cocina → listo
listo → entregado
entregado → pagado
abierto | en_cocina | listo | entregado → cancelado
```

#### EstadoItem
Enumeración: `pendiente` | `en_preparacion` | `listo` | `entregado` | `cancelado`

### Eventos de dominio

- `PedidoAbierto(pedido_id, mesa_id, mesero_id, fecha_hora)`
- `ItemAgregadoAPedido(pedido_id, item_id, menu_item_id, cantidad)`
- `ItemCancelado(pedido_id, item_id, motivo)`
- `PedidoEnviado ACocina(pedido_id)`
- `ItemListoEnCocina(pedido_id, item_id)`
- `PedidoListo(pedido_id)`
- `PedidoEntregado(pedido_id)`
- `PedidoCancelado(pedido_id, motivo, autorizado_por)`
- `MesaLiberada(mesa_id, pedido_id)`

---

## Bounded Context 3: Ventas y Cobro

### Entidades

#### Venta (Entidad raíz — Agregado)
- `id`
- `numero_ticket` — secuencial, único, inmutable
- `fecha`
- `hora`
- `cajero_id` — Usuario (cajero)
- `pedido_id` — referencia al BC de Sala
- `mesa_id` — referencia contextual
- `tipo_receptor` — `TipoReceptor`
- `cliente_id` (nullable) — referencia a Cliente
- `subtotal_sin_iva` — `Dinero`
- `iva` — `Dinero`
- `propina` — `Dinero`
- `total` — `Dinero`
- `condicion_pago` — `CondicionPago`
- `estado` — `EstadoVenta`
- `items` — colección de `ItemVenta`
- `pagos` — colección de `Pago`

**Invariantes:**
- El `numero_ticket` es inmutable después de creado
- Una Venta no puede eliminarse; solo anularse
- `suma(pagos.monto)` debe igual `total`
- `subtotal_sin_iva + iva = total - propina`
- Una Venta no puede anularse sin emitir primero una Nota de Crédito

#### ItemVenta (Entidad, parte del agregado Venta)
- `id`
- `venta_id`
- `menu_item_id` (nullable)
- `descripcion` — snapshot del nombre
- `cantidad`
- `precio_sin_iva` — precio unitario sin IVA
- `iva_unitario`
- `precio_con_iva`
- `tipo_item` — `TipoItemCAT011`
- `unidad_medida` — `UnidadMedidaCAT014`

#### Pago (Entidad, parte del agregado Venta)
- `id`
- `venta_id`
- `forma_pago` — `FormaPagoCAT017`
- `monto` — `Dinero`
- `referencia` (nullable) — voucher, número de transferencia, etc.

#### Cliente (Entidad raíz)
- `id`
- `tipo` — `TipoPersona`
- `nit` (nullable)
- `nrc` (nullable) — solo para jurídica
- `nombre`
- `email` (nullable)
- `telefono` (nullable)
- `direccion` (nullable)
- `activo`

**Invariantes:**
- Un Cliente de tipo "jurídica" debe tener NIT y NRC para emitir CCF
- El NIT debe tener formato válido antes de guardar

### Objetos de Valor

#### Dinero
- `cantidad` — decimal con 2 dígitos de precisión en visualización, 4 en cálculos
- `moneda` — siempre USD para Zensoci

#### TipoReceptor
Enumeración: `consumidor_final` | `ccf`

#### TipoPersona
Enumeración: `natural` | `juridica`

#### EstadoVenta
Enumeración: `completada` | `anulada`

#### CondicionPago (CAT-016)
Enumeración: `contado` (1) | `credito` (2)

#### FormaPagoCAT017
Enumeración: `efectivo` (01) | `debito` (02) | `credito` (03) | `transferencia` (04) |
`cheque` (05) | `otro` (99)

#### TipoItemCAT011
Enumeración: `bienes` (1) | `servicios` (2) | `ambos` (3)

#### UnidadMedidaCAT014
Enumeración (parcial): `unidad` (59) | `kilogramo` (34) | `gramo` (39) | `litro` (23) |
`mililitro` (26) | `otro` (99)

### Eventos de dominio

- `VentaCreada(venta_id, pedido_id, cajero_id, total, tipo_receptor)`
- `PagoRegistrado(venta_id, forma_pago, monto)`
- `VentaAnulada(venta_id, motivo, autorizado_por)`

---

## Bounded Context 4: Facturación Electrónica

### Entidades

#### DocumentoDTE (Entidad raíz — Agregado)
- `id`
- `venta_id` — referencia al BC de Ventas
- `tipo_dte` — `TipoDTECAT002`
- `ambiente` — `AmbienteMHCAT001`
- `modelo_facturacion` — `ModeloFacturacionCAT003`
- `tipo_transmision` — `TipoTransmisionCAT004`
- `codigo_generacion` — UUID v4, único e inmutable
- `numero_control` — formato `DTE-TT-PPPP-XXXXXXXXXXXXXXXXX`, único e inmutable
- `fec_emi` — fecha de emisión
- `hor_emi` — hora de emisión
- `json_sin_firma` — JSON del DTE antes de firmar
- `json_firmado` — JSON del DTE firmado (recibido del Firmador)
- `sello_mh` (nullable) — sello recibido del MH tras transmisión exitosa
- `estado` — `EstadoDTE`
- `respuesta_mh` (nullable) — JSON de respuesta del MH

**Invariantes:**
- El `codigo_generacion` es inmutable después de generado
- El `numero_control` es inmutable después de asignado
- Un DTE no puede transmitirse sin ser firmado primero
- El `sello_mh` solo se almacena cuando el estado es "aceptado"

#### CorrelativoDTE (Entidad raíz)
- `id`
- `tipo_dte`
- `cod_establecimiento`
- `cod_punto_venta`
- `ultimo_correlativo` — número entero que se incrementa con cada DTE

**Invariantes:**
- El incremento debe ser atómico (sin race conditions)
- El correlativo nunca puede decrementar

#### EmisorDTE (Entidad raíz — Singleton)
- `id`
- `nit`
- `nrc`
- `nombre`
- `nombre_comercial`
- `cod_actividad` — CAT-019
- `desc_actividad`
- `tipo_establecimiento` — CAT-009
- `cod_establecimiento`
- `cod_punto_venta`
- `dir_departamento` — CAT-012
- `dir_municipio` — CAT-013
- `dir_complemento`
- `telefono`
- `email`
- `ambiente` — CAT-001
- `activo`

#### EventoContingencia (Entidad raíz)
- `id`
- `fecha_inicio`
- `fecha_fin` (nullable)
- `causal` — `CausalContingenciaCAT005`
- `descripcion`
- `estado` — `activo` | `cerrado`
- `dtes_afectados` — colección de ids de DocumentoDTE

#### NotaCredito (Entidad raíz)
- `id`
- `dte_origen_id` — DTE que se anula
- `venta_id`
- `motivo`
- `monto_total`
- `documento_dte_id` — el DTE tipo 05 generado

#### NotaDebito (Entidad raíz)
- `id`
- `dte_origen_id`
- `motivo`
- `monto_cargo`
- `documento_dte_id` — el DTE tipo 06 generado

### Objetos de Valor

#### TipoDTECAT002
Enumeración: `factura` (01) | `ccf` (03) | `nota_credito` (05) | `nota_debito` (06)

#### AmbienteMHCAT001
Enumeración: `prueba` (00) | `produccion` (01)

#### ModeloFacturacionCAT003
Enumeración: `previo` (1) | `diferido` (2)

#### TipoTransmisionCAT004
Enumeración: `normal` (1) | `contingencia` (2)

#### CausalContingenciaCAT005
Enumeración: `sin_internet` (1) | `falla_mh` (2) | `falla_firmador` (3) |
`corte_energia` (4) | `otro` (5)

#### EstadoDTE
Enumeración: `borrador` | `firmado` | `transmitido` | `aceptado` | `rechazado` | `anulado`

**Transiciones válidas:**
```
borrador → firmado → transmitido → aceptado
                   → rechazado
aceptado → anulado (con NC aceptada)
```

#### NumeroControl
Objeto de valor inmutable: `DTE-TT-PPPP-XXXXXXXXXXXXXXXXX`
- `TT` = código de tipo DTE (2 dígitos)
- `PPPP` = código de punto de venta (4 dígitos)
- `XXXXXXXXXXXXXXXXX` = correlativo (15 dígitos, cero a la izquierda)

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

## Bounded Context 5: Catálogo y Producción

### Entidades

#### MenuItem (Entidad raíz)
- `id`
- `nombre`
- `categoria`
- `precio_con_iva` — `Dinero`
- `precio_sin_iva` — `Dinero`
- `descripcion` (nullable)
- `imagen_url` (nullable)
- `activo`

**Invariantes:**
- `precio_sin_iva * 1.13 ≈ precio_con_iva` (diferencia máxima de $0.01 por redondeo)
- El precio no puede ser negativo ni cero

#### CosteoPlatillo (Entidad raíz)
- `id`
- `menu_item_id` (nullable) — puede no estar ligado aún al menú
- `nombre`
- `categoria`
- `porciones`
- `precio_con_iva`
- `precio_sin_iva`
- `costo_porcion`
- `costo_subreceta`
- `costo_empaque`
- `costo_unitario`
- `margen`
- `pct_costo`
- `precio_delivery`
- `lineas` — colección de `LineaReceta`

#### LineaReceta (Entidad, parte del agregado CosteoPlatillo)
- `id`
- `costeo_platillo_id`
- `tipo` — `TipoLineaReceta`
- `ingrediente_id` (nullable) — si tipo es principal o secundario
- `empaque_id` (nullable) — si tipo es empaque
- `nombre_referencia` — nombre al momento de la captura (snapshot)
- `cantidad`
- `unidad`
- `pct_merma`
- `precio_referencia` — snapshot del precio de compra
- `costo_linea` — calculado

**Invariantes:**
- Debe tener `ingrediente_id` O `empaque_id`, no ambos, no ninguno
- El `costo_linea` = `cantidad * precio_referencia * (1 + pct_merma/100)`

#### Ingrediente (Entidad raíz)
- `id`
- `nombre`
- `tipo`
- `categoria`
- `marca` (nullable)
- `proveedor` (nullable)
- `presentacion_compra`
- `unidad`
- `stock_actual`
- `stock_minimo`
- `precio_compra_con_iva`
- `precio_compra_sin_iva`
- `costo_unitario`
- `activo`

#### Empaque (Entidad raíz)
- `id`
- `nombre`
- `categoria`
- `marca` (nullable)
- `proveedor` (nullable)
- `presentacion`
- `unidad`
- `unidades_paquete`
- `precio_sin_iva`
- `costo_unitario`
- `stock`
- `stock_minimo`
- `activo`

#### Proveedor (Entidad raíz)
- `id`
- `nombre`
- `contacto` (nullable)
- `telefono` (nullable)
- `email` (nullable)
- `direccion` (nullable)
- `activo`

#### Compra (Entidad raíz — Agregado)
- `id`
- `fecha`
- `proveedor_id`
- `usuario_id`
- `total`
- `estado` — `borrador` | `confirmada`
- `lineas` — colección de `LineaCompra`

#### LineaCompra (Entidad, parte del agregado Compra)
- `id`
- `compra_id`
- `tipo` — `ingrediente` | `empaque`
- `item_id`
- `nombre_snapshot`
- `cantidad`
- `precio_unitario`
- `total_linea`

### Objetos de Valor

#### TipoLineaReceta
Enumeración: `principal` | `secundario` | `empaque`

### Eventos de dominio

- `MenuItemPrecioCambiado(menu_item_id, precio_anterior, precio_nuevo)`
- `MenuItemDesactivado(menu_item_id)`
- `IngredienteStockBajo(ingrediente_id, stock_actual, stock_minimo)`
- `EmpaqueStockBajo(empaque_id, stock_actual, stock_minimo)`
- `CompraConfirmada(compra_id, proveedor_id, items_actualizados)`
- `CostoMargenBajo(costeo_platillo_id, margen_actual, umbral)`

---

## Diagrama de dependencias entre contextos

```
CATÁLOGO Y PRODUCCIÓN
  MenuItem ─────────────────────────────────────────────────────┐
  (menu_item_id, precio_sin_iva)                                │
                                                                │
OPERACIÓN DE SALA                                              │
  Mesa ──► Pedido ──► DetallePedido                            │
                (nombre_snapshot, precio_snapshot ◄── MenuItem)│
                            │                                   │
                            │ pedido_id                         │
                            ▼                                   ▼
VENTAS Y COBRO                                                  │
  Venta ──► ItemVenta ──────────────────── (menu_item_id) ◄────┘
     │ ──► Pago
     │
     │ venta_id
     ▼
FACTURACIÓN ELECTRÓNICA
  DocumentoDTE
     │
     ├── EmisorDTE (datos fiscales del restaurante)
     ├── Receptor (datos del cliente — viene de Venta.cliente_id → BC Ventas)
     ├── Cuerpo (ítems — viene de Venta.items)
     └── CorrelativoDTE (asigna numero_control)
```

---

## Tabla de agregados y sus raíces

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

| Regla | Contexto origen | Contexto destino | Mecanismo |
|---|---|---|---|
| Al pagar un pedido, se crea una venta | Sala | Ventas | Evento `PedidoPagado` |
| Al crear una venta, se emite un DTE | Ventas | Facturación | Evento `VentaCreada` |
| Al cambiar precio del menú, notificar | Catálogo | Sala (pedidos en curso) | Evento `MenuItemPrecioCambiado` |
| Al agotar stock, alertar al dashboard | Catálogo | Dashboard | Evento `IngredienteStockBajo` |
| Al confirmar una compra, actualizar stock | Compras | Catálogo | Evento `CompraConfirmada` |
| Al aceptar un DTE, actualizar venta | Facturación | Ventas | Evento `DTEAceptado` |
