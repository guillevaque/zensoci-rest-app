# 13 — ERP Zensoci: Catálogo Completo de Módulos

Este documento describe los **28 módulos** del ERP Zensoci, su responsabilidad, datos que gestiona,
APIs que expone y consume, dependencias, eventos que produce y recibe, riesgos y prioridad de
implementación.

---

## Nomenclatura

| Campo | Descripción |
|---|---|
| **Dominio** | Agrupación funcional de alto nivel |
| **Responsabilidad** | Qué problema resuelve este módulo |
| **Tablas principales** | Tablas que este módulo _es dueño_ |
| **APIs expuestas** | Endpoints que este módulo provee |
| **APIs consumidas** | Endpoints de otros módulos que usa |
| **Depende de** | Módulos que deben existir antes |
| **Lo consumen** | Módulos que usan datos de este |
| **Eventos que produce** | Hechos de negocio que notifica |
| **Eventos que recibe** | Hechos de negocio a los que reacciona |
| **Riesgos** | Puntos de falla o complejidad |
| **Prioridad** | P1 crítico / P2 alta / P3 media / P4 futura |

---

## DOMINIO 1: SEGURIDAD Y ACCESO

---

### MOD-01 — Seguridad (Auth)

**Dominio:** Seguridad y Acceso

**Responsabilidad:** Controla el acceso al sistema. Autentica usuarios por PIN o email+contraseña,
mantiene la sesión activa, y verifica el rol para cada operación sensible.

**Tablas principales:**
- `usuarios` — identidad, credenciales, rol, estado
- `sesiones` — token o cookie activa, IP, timestamp, expiración

**APIs expuestas:**
- `POST /api/auth/login` — login por email+contraseña
- `POST /api/auth/login-pin` — login rápido por PIN
- `GET  /api/auth/me` — devuelve usuario autenticado
- `POST /api/auth/logout` — cierra sesión
- `GET  /api/auth/users` — lista usuarios con avatar para pantalla de PIN

**APIs consumidas:** Ninguna (es la base)

**Depende de:** Ninguno

**Lo consumen:** Todos los módulos — cualquier operación que requiera identidad del actor

**Eventos que produce:**
- `auth.login.success` — usuario autenticó correctamente
- `auth.login.failed` — intento fallido (para logs de seguridad)
- `auth.logout` — sesión cerrada

**Eventos que recibe:** Ninguno

**Riesgos:**
- Sesiones PHP en Hostinger pueden expirar inesperadamente; manejar con gracia en frontend
- PINs cortos (4 dígitos) son débiles; mitigar con límite de intentos fallidos
- Si la tabla `usuarios` no tiene índice en `email`, cada login hace full scan

**Prioridad:** **P1** — todo lo demás depende de esto

---

### MOD-02 — Usuarios

**Dominio:** Seguridad y Acceso

**Responsabilidad:** Gestión del equipo: crear, modificar y desactivar cuentas de empleados,
asignar roles, colores de avatar, y PINs de acceso rápido.

**Tablas principales:**
- `usuarios` — nombre, email, password_hash, pin_hash, rol, color_avatar, activo, turno_activo_id

**Roles disponibles:** `admin`, `manager`, `staff`, `member`

**APIs expuestas:**
- `GET    /api/usuarios` — lista del equipo (solo admin/manager)
- `POST   /api/usuarios` — crear usuario
- `PUT    /api/usuarios/:id` — modificar
- `DELETE /api/usuarios/:id` — desactivar (soft delete)
- `PUT    /api/usuarios/:id/pin` — cambiar PIN
- `PUT    /api/usuarios/:id/password` — cambiar contraseña

**APIs consumidas:**
- `GET /api/auth/me` — para saber quién hace el cambio (auditoría)

**Depende de:** MOD-01 Seguridad

**Lo consumen:**
- MOD-05 Pedidos (mesero asignado)
- MOD-07 POS/Caja (cajero en turno)
- MOD-10 DTE (responsable de emisión)
- MOD-27 Turnos (usuarios en turno)
- MOD-26 Auditoría

**Eventos que produce:**
- `usuario.creado`
- `usuario.desactivado`
- `usuario.rol_cambiado`

**Eventos que recibe:** Ninguno

**Riesgos:**
- Un admin desactivado con sesión activa sigue teniendo acceso hasta expiración de cookie
- Si el único admin se desactiva, el sistema queda sin acceso; prevenir con validación

**Prioridad:** **P1**

---

## DOMINIO 2: OPERACIÓN DE SALA

---

### MOD-03 — Clientes (Receptores)

**Dominio:** Operación de Sala / Fiscal

**Responsabilidad:** Gestión del catálogo de clientes frecuentes y datos de receptor para DTE.
Para consumidor final puede ser anónimo; para CCF requiere NIT/NRC completo.

**Tablas principales:**
- `clientes` — tipo (natural/jurídica), nit, nrc, nombre, email, telefono, direccion, activo

**APIs expuestas:**
- `GET    /api/clientes` — búsqueda por nombre, NIT o NRC
- `POST   /api/clientes` — crear cliente
- `PUT    /api/clientes/:id` — actualizar
- `GET    /api/clientes/:id` — detalle

**APIs consumidas:** Ninguna directa

**Depende de:** MOD-01 Seguridad

**Lo consumen:**
- MOD-08 Ventas (receptor de la transacción)
- MOD-10 DTE (receptor del documento)

**Eventos que produce:**
- `cliente.creado`
- `cliente.actualizado`

**Eventos que recibe:** Ninguno

**Riesgos:**
- NIT puede cambiar por corrección; necesitar historial de versiones o al menos timestamp de cambio
- Datos incompletos de CCF causarán rechazo del DTE; validar antes de guardar

**Prioridad:** **P2** — necesario para DTE tipo CCF; para Factura básica puede obviarse

---

### MOD-04 — Mesas

**Dominio:** Operación de Sala

**Responsabilidad:** Gestión del layout del restaurante. Cada mesa tiene un estado en tiempo real
(libre, ocupada, necesita atención). Incluye el tipo especial "Pickup" para pedidos para llevar.

**Tablas principales:**
- `mesas` — nombre, capacidad, tipo (regular/pickup), estado, activo, orden_visual
- `mesa_estado_log` — historial de cambios de estado (para métricas de tiempo de ocupación)

**Estados posibles:** `libre`, `ocupada`, `necesita_check`, `fuera_de_servicio`

**APIs expuestas:**
- `GET  /api/mesas` — lista con estado actual
- `PUT  /api/mesas/:id/estado` — cambiar estado
- `GET  /api/mesas/:id/pedido-activo` — pedido abierto en esa mesa
- `POST /api/mesas` — crear mesa (admin)
- `PUT  /api/mesas/:id` — configurar mesa (admin)

**APIs consumidas:**
- `GET /api/pedidos?mesa_id=` — para mostrar qué hay en cada mesa

**Depende de:** MOD-01 Seguridad

**Lo consumen:**
- MOD-05 Pedidos (a qué mesa pertenece)
- MOD-07 POS/Caja (cobrar mesa específica)
- MOD-13 Dashboard (cuántas mesas ocupadas)

**Eventos que produce:**
- `mesa.abierta` — cuando se asigna a un pedido
- `mesa.liberada` — cuando el pedido se cierra o cancela
- `mesa.necesita_check` — cuando el mesero activa estado de revisión

**Eventos que recibe:**
- `pedido.pagado` → libera la mesa automáticamente
- `pedido.cancelado` → libera la mesa automáticamente

**Riesgos:**
- Estado inconsistente si el servidor cae entre el pago y la liberación de la mesa
- Múltiples usuarios pueden intentar abrir pedido en misma mesa simultáneamente; lock optimista

**Prioridad:** **P1** — sin mesas no hay pedidos reales

---

### MOD-05 — Pedidos

**Dominio:** Operación de Sala

**Responsabilidad:** Núcleo operativo del restaurante. Gestiona el ciclo de vida de la orden
desde que el mesero la toma hasta que la cocina la entrega. No incluye cobro (eso es Ventas).

**Tablas principales:**
- `pedidos` — numero_pedido, fecha, hora_apertura, mesa_id, usuario_id (mesero), estado, notas
- `pedido_items` — pedido_id, menu_id, nombre_snapshot, cantidad, precio_snapshot, notas_item, estado_item

**Estados del pedido:** `abierto`, `en_cocina`, `listo`, `entregado`, `pagado`, `cancelado`

**Estados del ítem:** `pendiente`, `en_preparacion`, `listo`, `entregado`, `cancelado`

**APIs expuestas:**
- `GET    /api/pedidos` — lista con filtros (mesa, estado, fecha)
- `POST   /api/pedidos` — abrir pedido
- `GET    /api/pedidos/:id` — detalle con ítems
- `PUT    /api/pedidos/:id` — actualizar estado o notas
- `POST   /api/pedidos/:id/items` — agregar ítem(s)
- `PUT    /api/pedidos/:id/items/:item_id` — modificar ítem (cantidad, notas)
- `DELETE /api/pedidos/:id/items/:item_id` — cancelar ítem
- `PUT    /api/pedidos/:id/mesa` — cambiar de mesa

**APIs consumidas:**
- `GET /api/mesas/:id` — validar que la mesa esté libre
- `GET /api/menu` — obtener precio y nombre del ítem al momento del pedido
- `GET /api/auth/me` — mesero que toma el pedido

**Depende de:** MOD-01, MOD-02, MOD-04 Mesas, MOD-14 Menú

**Lo consumen:**
- MOD-06 Cocina/KDS (ítems pendientes de preparar)
- MOD-07 POS/Caja (pedido a cobrar)
- MOD-08 Ventas (origen de la venta)
- MOD-13 Dashboard (pedidos del día)

**Eventos que produce:**
- `pedido.abierto` — nuevo pedido creado
- `pedido.item_agregado` — ítem enviado a cocina
- `pedido.item_cancelado`
- `pedido.listo` — cocina marcó todo listo
- `pedido.entregado` — mesero entregó en mesa
- `pedido.cancelado`
- `pedido.pagado` — post-cobro

**Eventos que recibe:**
- `cocina.item_listo` → actualizar estado del ítem
- `venta.completada` → marcar pedido como pagado

**Riesgos:**
- Los precios del menú cambian; el snapshot de precio al momento del pedido es crítico para no
  cobrar mal
- Ítems cancelados después de enviarse a cocina deben notificar al KDS
- Pedidos muy largos con múltiples rondas de ítems necesitan historial de agregados

**Prioridad:** **P1**

---

### MOD-06 — Cocina / KDS (Kitchen Display System)

**Dominio:** Operación de Sala / Producción

**Responsabilidad:** Vista de cocina que muestra los ítems pendientes de preparación en tiempo
real. Permite marcar cada ítem o pedido completo como "en preparación" o "listo".

**Tablas principales:**
- Ninguna propia — lee y escribe en `pedido_items` del MOD-05

**APIs expuestas:**
- `GET /api/cocina/queue` — ítems pendientes ordenados por tiempo de espera
- `PUT /api/cocina/items/:id/estado` — marcar en_preparacion / listo

**APIs consumidas:**
- `GET /api/pedidos` — ítems pendientes
- `PUT /api/pedidos/:id/items/:id` — actualizar estado del ítem

**Depende de:** MOD-05 Pedidos

**Lo consumen:** Ninguno directo (solo interfaz de cocina)

**Eventos que produce:**
- `cocina.item_en_preparacion`
- `cocina.item_listo`
- `cocina.pedido_completo` — todos los ítems de un pedido están listos

**Eventos que recibe:**
- `pedido.item_agregado` → aparece en la pantalla de cocina
- `pedido.item_cancelado` → se elimina de la vista

**Riesgos:**
- Sin websockets o SSE, el KDS requiere polling constante (cada 5-10 segundos mínimo)
- Con internet lento o corte, el KDS queda desactualizado — la cocina no sabe qué preparar

**Prioridad:** **P2** — necesario para operación sin papel, pero puede empezarse con tickets impresos

---

## DOMINIO 3: PUNTO DE VENTA Y COBRO

---

### MOD-07 — POS / Caja

**Dominio:** Punto de Venta

**Responsabilidad:** Interfaz del cajero para procesar el cobro. Muestra el resumen del pedido,
calcula totales con IVA, registra la forma de pago, y dispara la generación de la Venta y el DTE.

**Tablas principales:** Ninguna propia — orquesta otros módulos

**APIs expuestas:**
- `POST /api/caja/cobrar` — cobro completo: valida pedido, crea venta, dispara DTE

**APIs consumidas:**
- `GET  /api/pedidos/:id` — ítems y totales
- `POST /api/ventas` — registrar la venta
- `GET  /api/clientes` — buscar receptor (para CCF)
- `POST /api/dte/emitir` — generar y transmitir DTE

**Depende de:** MOD-01, MOD-05 Pedidos, MOD-08 Ventas, MOD-09 Pagos, MOD-10 DTE

**Lo consumen:** Ninguno (es la interfaz terminal del flujo operativo)

**Eventos que produce:**
- `caja.cobro_iniciado`
- `caja.cobro_completado`

**Eventos que recibe:**
- `dte.aceptado` → mostrar sello y número de control al cajero
- `dte.rechazado` → mostrar error y opción de contingencia

**Riesgos:**
- Si el DTE falla, ¿la venta se revierte o se guarda en contingencia? La respuesta afecta toda
  la arquitectura del cobro
- El cajero no debe poder cerrar la pantalla de cobro si el pago fue registrado pero el DTE falló

**Prioridad:** **P1** — sin esto no hay cobro real

---

### MOD-08 — Ventas

**Dominio:** Punto de Venta / Fiscal

**Responsabilidad:** Registro permanente e inmutable de cada transacción completada. Es la fuente
de verdad financiera. Una venta no se puede eliminar, solo anular con nota de crédito.

**Tablas principales:**
- `ventas` — numero_ticket, fecha, hora, user_id (cajero), pedido_id, mesa_id, condicion_pago,
  subtotal_sin_iva, iva, propina, total, tipo_receptor, cliente_id, estado
- `venta_items` — venta_id, menu_id, descripcion_snapshot, cantidad, precio_sin_iva, iva_unitario,
  precio_con_iva, tipo_item (CAT-011), unidad_medida (CAT-014)

**Estados posibles:** `completada`, `anulada`

**APIs expuestas:**
- `POST /api/ventas` — crear venta
- `GET  /api/ventas` — lista con filtros (fecha, cajero, tipo receptor)
- `GET  /api/ventas/:id` — detalle con ítems y pagos
- `PUT  /api/ventas/:id/anular` — anular (solo genera NC, no elimina)

**APIs consumidas:**
- `GET /api/pedidos/:id` — ítems del pedido a vender
- `GET /api/menu/:id` — precio_sin_iva al momento de la venta
- `GET /api/clientes/:id` — datos del receptor

**Depende de:** MOD-05 Pedidos, MOD-03 Clientes, MOD-14 Menú

**Lo consumen:**
- MOD-07 POS/Caja (disparado durante cobro)
- MOD-09 Pagos (asociados a una venta)
- MOD-10 DTE (datos del cuerpo del documento)
- MOD-13 Dashboard (KPIs de ventas)
- MOD-22 Reportes (libro de ventas)
- MOD-28 Cortes de Caja

**Eventos que produce:**
- `venta.creada`
- `venta.anulada`

**Eventos que recibe:**
- `pago.registrado` → marca la venta como completada
- `dte.aceptado` → asocia el sello del MH a la venta

**Riesgos:**
- El `numero_ticket` debe ser secuencial y nunca repetirse; race condition bajo carga
- Precios sin IVA deben calcularse con precisión decimal correcta (`price / 1.13` tiene error de
  redondeo a partir del 4to decimal)

**Prioridad:** **P1**

---

### MOD-09 — Pagos

**Dominio:** Punto de Venta / Fiscal

**Responsabilidad:** Registra cómo se pagó cada venta. Una venta puede tener múltiples formas de
pago (pago mixto). El total de pagos debe cuadrar con el total de la venta.

**Tablas principales:**
- `pagos` — venta_id, forma_pago (CAT-017), monto, referencia, created_at

**Formas de pago (CAT-017):** `01` Efectivo, `02` Débito, `03` Crédito, `04` Transferencia,
`05` Cheque, `99` Otro

**APIs expuestas:**
- `POST /api/pagos` — registrar pago(s) para una venta
- `GET  /api/pagos?venta_id=` — pagos de una venta

**APIs consumidas:**
- `GET /api/ventas/:id` — validar total esperado

**Depende de:** MOD-08 Ventas

**Lo consumen:**
- MOD-10 DTE (forma de pago en el resumen del documento)
- MOD-22 Reportes (ventas por forma de pago)
- MOD-28 Cortes de Caja (totales por forma de pago)

**Eventos que produce:**
- `pago.registrado` — con detalle de forma(s) de pago y montos

**Eventos que recibe:** Ninguno

**Riesgos:**
- Pago con tarjeta: el voucher/referencia de Stripe debe almacenarse pero no es bloqueante para
  el DTE
- Si el cajero cobra de más o de menos por redondeo, queda inconsistencia con el DTE

**Prioridad:** **P1**

---

## DOMINIO 4: FACTURACIÓN ELECTRÓNICA DTE

---

### MOD-10 — DTE (Documentos Tributarios Electrónicos)

**Dominio:** Facturación Electrónica

**Responsabilidad:** Genera, firma y transmite los documentos tributarios al Ministerio de Hacienda
de El Salvador. Soporta Factura (01) y CCF (03). Mantiene el estado de cada documento y gestiona
el correlativo.

**Tablas principales:**
- `dte_documentos` — venta_id, tipo_dte, ambiente, modelo, transmision, codigo_generacion (UUID),
  numero_control, fec_emi, hor_emi, json_sin_firma, json_firmado, sello_mh, estado, respuesta_mh
- `dte_correlativos` — tipo_dte, cod_establecimiento, cod_punto_venta, ultimo_correlativo
- `dte_emisor` — datos fiscales del restaurante (NIT, NRC, dirección, etc.)

**Estados del documento:** `borrador`, `firmado`, `transmitido`, `aceptado`, `rechazado`, `anulado`

**APIs expuestas:**
- `POST /api/dte/emitir` — genera JSON, firma, transmite (flujo completo)
- `GET  /api/dte` — lista de documentos con filtros
- `GET  /api/dte/:id` — detalle + JSON completo
- `POST /api/dte/:id/reenviar` — reintentar transmisión
- `GET  /api/dte/:id/pdf` — representación gráfica del DTE (futuro)

**APIs consumidas:**
- `GET  /api/ventas/:id` — datos de la venta
- `GET  /api/ventas/:id/items` — cuerpo del documento
- `GET  /api/ventas/:id/pagos` — forma de pago para resumen
- `GET  /api/dte/emisor` — datos del emisor
- `POST http://firmador/firmardocumento/` — servicio Firmador Docker
- `POST https://api.mh.gob.sv/fe/...` — API del MH

**Depende de:** MOD-08 Ventas, MOD-09 Pagos, MOD-03 Clientes, MOD-20 Configuración Fiscal

**Lo consumen:**
- MOD-07 POS/Caja (muestra sello al cajero)
- MOD-11 Notas de Crédito
- MOD-12 Notas de Débito
- MOD-22 Reportes (libro de ventas DTE)

**Eventos que produce:**
- `dte.generado` — JSON construido
- `dte.firmado` — Firmador devolvió JSON firmado
- `dte.transmitido` — enviado al MH
- `dte.aceptado` — MH devolvió sello
- `dte.rechazado` — MH devolvió error
- `dte.contingencia_activada`

**Eventos que recibe:**
- `venta.creada` → inicia flujo de emisión del DTE
- `contingencia.activa` → cambia tipo_transmision a 2

**Riesgos:**
- El Firmador corre en Docker local; Hostinger no puede alcanzarlo — es la brecha técnica más crítica
- El MH puede tardar o no responder; necesitar timeout y cola de reintento
- UUID v4 en PHP requiere extensión o librería; verificar disponibilidad en Hostinger
- Correlativo debe ser atómico; race condition bajo carga puede duplicar número de control

**Prioridad:** **P2** — depende de Ventas (P1). Es el objetivo de negocio del proyecto.

---

### MOD-11 — Notas de Crédito

**Dominio:** Facturación Electrónica

**Responsabilidad:** Emite Notas de Crédito (tipo 05) para anular o ajustar una Factura o CCF
ya aceptada por el MH. La nota de crédito referencia al DTE original.

**Tablas principales:**
- `notas_credito` — dte_origen_id, venta_id, motivo, monto_ajuste
- Comparte `dte_documentos` con tipo_dte = '05'

**APIs expuestas:**
- `POST /api/notas-credito` — crear nota de crédito
- `GET  /api/notas-credito` — historial

**APIs consumidas:**
- `GET /api/dte/:id` — DTE original a anular
- `POST /api/dte/emitir` — emitir el DTE tipo 05

**Depende de:** MOD-10 DTE, MOD-08 Ventas

**Lo consumen:**
- MOD-22 Reportes

**Eventos que produce:**
- `nota_credito.emitida`

**Eventos que recibe:**
- `venta.anulada` → puede disparar generación de NC

**Riesgos:**
- El MH solo acepta NC dentro de cierto período del documento original; manejar validación de plazo
- Una NC parcial (ajuste de monto, no anulación total) es más compleja de implementar

**Prioridad:** **P3** — necesario pero no para el MVP

---

### MOD-12 — Notas de Débito

**Dominio:** Facturación Electrónica

**Responsabilidad:** Emite Notas de Débito (tipo 06) para aumentar el valor de un DTE ya emitido.
Caso de uso: cargo adicional no incluido en la factura original.

**Tablas principales:**
- `notas_debito` — dte_origen_id, motivo, monto_cargo
- Comparte `dte_documentos` con tipo_dte = '06'

**APIs expuestas:**
- `POST /api/notas-debito` — crear nota de débito
- `GET  /api/notas-debito` — historial

**APIs consumidas:**
- `GET /api/dte/:id` — DTE original
- `POST /api/dte/emitir` — emitir tipo 06

**Depende de:** MOD-10 DTE

**Lo consumen:** MOD-22 Reportes

**Eventos que produce:**
- `nota_debito.emitida`

**Eventos que recibe:** Ninguno directo

**Riesgos:** Mismos que NC; aplica el mismo período límite del MH

**Prioridad:** **P4** — raro en restaurante, puede posponerse indefinidamente

---

### MOD-13 — Contingencia

**Dominio:** Facturación Electrónica

**Responsabilidad:** Gestiona los períodos en que el sistema emite DTEs en modo contingencia
(sin conexión al MH o al Firmador). Mantiene la cola de documentos pendientes de retransmitir.

**Tablas principales:**
- `contingencias` — fecha_inicio, fecha_fin, causal (CAT-005), descripcion, estado
- `contingencia_dte` — contingencia_id, dte_id

**Causales (CAT-005):** 1=Sin internet, 2=Falla MH, 3=Falla Firmador, 4=Corte energía, 5=Otro

**APIs expuestas:**
- `POST /api/contingencia/iniciar` — activar modo contingencia
- `PUT  /api/contingencia/:id/cerrar` — fin del evento
- `POST /api/contingencia/:id/retransmitir` — enviar DTEs pendientes al MH
- `GET  /api/contingencia` — historial de eventos

**APIs consumidas:**
- `POST /api/dte/:id/reenviar` — reintento de cada DTE en cola

**Depende de:** MOD-10 DTE

**Lo consumen:** MOD-07 POS/Caja, MOD-22 Reportes

**Eventos que produce:**
- `contingencia.iniciada`
- `contingencia.cerrada`
- `contingencia.dte_retransmitido`

**Eventos que recibe:**
- `dte.rechazado` o timeout → puede disparar activación de contingencia

**Riesgos:**
- Los DTEs en contingencia se emiten con `tipo_transmision = 2` pero el MH los valida después;
  si el MH los rechaza, la venta ya fue cobrada
- El plazo para retransmitir es limitado; superar el plazo hace inválidos los documentos

**Prioridad:** **P3** — necesario para operación real, pero puede posponerse al MVP

---

## DOMINIO 5: MENÚ Y PRODUCCIÓN

---

### MOD-14 — Menú

**Dominio:** Menú y Producción

**Responsabilidad:** Catálogo de todos los platillos y productos que el restaurante ofrece.
Permite activar/desactivar ítems, cambiar precios, categorías e imágenes.

**Tablas principales:**
- `menu` — nombre, categoria, precio_con_iva, precio_sin_iva, descripcion, imagen_url, activo

**Nota:** Hoy `menu.price` es precio CON IVA. Se necesita agregar `precio_sin_iva` para DTE.

**APIs expuestas:**
- `GET    /api/menu` — lista activos; con `?all=1` incluye inactivos
- `POST   /api/menu` — crear ítem
- `PUT    /api/menu/:id` — modificar
- `DELETE /api/menu/:id` — desactivar (soft delete)
- `POST   /api/menu/:id/imagen` — subir imagen

**APIs consumidas:** Ninguna

**Depende de:** MOD-01 Seguridad

**Lo consumen:**
- MOD-05 Pedidos (ítem pedido)
- MOD-07 POS/Caja (lista de selección)
- MOD-15 Costeo (asociación platillo ↔ receta)
- MOD-06 Cocina/KDS (nombre del ítem)

**Eventos que produce:**
- `menu.precio_cambiado` — para que pedidos abiertos noten el cambio
- `menu.item_desactivado`

**Eventos que recibe:** Ninguno

**Riesgos:**
- Cambio de precio durante un pedido abierto puede descuadrar el total si no se usa snapshot
- La imagen se sube a `/assets/menu/` en Hostinger; sin CDN, puede ser lento con muchos ítems

**Prioridad:** **P1** — ya existe y funciona; mejora: agregar `precio_sin_iva`

---

### MOD-15 — Costeo

**Dominio:** Menú y Producción

**Responsabilidad:** Análisis de rentabilidad de cada platillo. Compara el precio de venta contra
el costo real de los ingredientes. Genera alertas cuando el margen cae bajo el umbral.

**Tablas principales:**
- `costeo_platillos` — num_menu, nombre, categoria, porciones, precio_con_iva, precio_sin_iva,
  costo_porcion, costo_subreceta, costo_empaque, costo_unitario, margen, pct_costo, precio_delivery
- `ingredientes` (con costeo_platillo_id) — líneas de receta

**APIs expuestas:**
- `GET /api/costeo` — lista de costeos con comparativa live vs snapshot
- `GET /api/costeo/:id` — detalle de ingredientes con costo actual
- `PUT /api/costeo/:id` — actualizar snapshot

**APIs consumidas:**
- `GET /api/ingredientes` — precios actuales de insumos
- `GET /api/empaques` — costos de empaque

**Depende de:** MOD-16 Ingredientes, MOD-17 Empaques, MOD-14 Menú

**Lo consumen:**
- MOD-22 Reportes (margen por platillo)
- MOD-13 Dashboard (alerta de margen)

**Eventos que produce:**
- `costeo.margen_bajo` — cuando el costo supera el umbral definido

**Eventos que recibe:**
- `ingrediente.precio_cambiado` → recalcular margen live

**Riesgos:**
- El costeo actual usa texto libre para relacionar ingredientes con platillos (no FK);
  un typo en el nombre rompe la relación
- Los precios de insumos cambian constantemente; el snapshot puede quedar muy desactualizado

**Prioridad:** **P1** — ya existe y funciona; mantener sin cambios estructurales

---

### MOD-16 — Ingredientes

**Dominio:** Inventario y Producción

**Responsabilidad:** Catálogo de materias primas. Registra precio de compra, stock actual,
stock mínimo, y genera alertas de reabastecimiento.

**Tablas principales:**
- `ingredientes` (sin costeo_platillo_id) — nombre, tipo, categoria, marca, proveedor,
  presentacion_compra, unidad, stock_actual, stock_minimo, precio_compra_con_iva,
  precio_compra_sin_iva, costo_unitario, activo

**APIs expuestas:**
- `GET    /api/ingredientes` — lista del catálogo (WHERE costeo_platillo_id IS NULL)
- `POST   /api/ingredientes` — crear
- `PUT    /api/ingredientes/:id` — modificar precio o stock
- `DELETE /api/ingredientes/:id` — desactivar
- `GET    /api/ingredientes/alertas` — ingredientes bajo stock mínimo

**APIs consumidas:** Ninguna

**Depende de:** MOD-01 Seguridad

**Lo consumen:**
- MOD-15 Costeo
- MOD-17 Empaques (conceptualmente similar)
- MOD-18 Recetas
- MOD-19 Compras (actualizan stock)

**Eventos que produce:**
- `ingrediente.stock_bajo` — cuando stock_actual < stock_minimo
- `ingrediente.precio_cambiado`

**Eventos que recibe:**
- `compra.registrada` → incrementar stock
- `pedido.pagado` → decrementar stock (futuro: descuento automático)

**Riesgos:**
- La tabla `ingredientes` sirve actualmente dos propósitos distintos (catálogo y líneas de receta)
  discriminados por `costeo_platillo_id IS NULL`; esto complica queries y puede causar bugs

**Prioridad:** **P1** — ya existe y funciona

---

### MOD-17 — Empaques

**Dominio:** Inventario y Producción

**Responsabilidad:** Catálogo de materiales de empaque con su costo unitario. Alimenta el campo
`costo_empaque` del costeo de platillos.

**Tablas principales:**
- `empaques` — nombre, categoria, marca, proveedor, presentacion, unidad, unidades_paquete,
  precio_sin_iva, costo_unitario, stock, stock_minimo, activo

**APIs expuestas:**
- `GET    /api/empaques` — lista activos
- `POST   /api/empaques` — crear
- `PUT    /api/empaques/:id` — modificar
- `DELETE /api/empaques/:id` — desactivar (soft delete)

**APIs consumidas:** Ninguna

**Depende de:** MOD-01 Seguridad

**Lo consumen:**
- MOD-15 Costeo (costo_empaque)
- MOD-18 Recetas

**Eventos que produce:**
- `empaque.stock_bajo`

**Eventos que recibe:**
- `compra.registrada` → incrementar stock

**Prioridad:** **P1** — ya existe y funciona

---

### MOD-18 — Recetas

**Dominio:** Inventario y Producción

**Responsabilidad:** Define la composición de cada platillo: qué ingredientes y empaques se usan,
en qué cantidades, y qué merma aplica. Es la base del descuento automático de inventario.

**Tablas principales:**
- `recetas` — platillo_id (FK a menu), nombre_snapshot, versión, fecha_vigencia
- `receta_lineas` — receta_id, tipo (principal/secundario/empaque), ingrediente_id o empaque_id,
  cantidad, unidad, pct_merma, costo_linea

**Nota:** Hoy las líneas de receta viven en `ingredientes` con `costeo_platillo_id IS NOT NULL`.
La migración a tablas dedicadas es una mejora futura.

**APIs expuestas:**
- `GET  /api/recetas?platillo_id=` — receta activa de un platillo
- `POST /api/recetas` — crear versión de receta
- `PUT  /api/recetas/:id` — actualizar líneas

**APIs consumidas:**
- `GET /api/ingredientes` — catálogo de insumos
- `GET /api/empaques` — catálogo de empaques
- `GET /api/menu/:id` — nombre del platillo

**Depende de:** MOD-14 Menú, MOD-16 Ingredientes, MOD-17 Empaques

**Lo consumen:**
- MOD-15 Costeo (calcula costo desde receta)
- MOD-16 Ingredientes (descuento automático al vender)

**Eventos que produce:**
- `receta.actualizada`

**Eventos que recibe:** Ninguno

**Riesgos:**
- Versiones de receta: cuando cambia un ingrediente, ¿se actualiza la receta activa o se versiona?
  Sin versionado, el costeo histórico pierde precisión

**Prioridad:** **P3** — mejora a futuro; hoy funciona con la estructura actual en `ingredientes`

---

## DOMINIO 6: ABASTECIMIENTO

---

### MOD-19 — Compras

**Dominio:** Abastecimiento

**Responsabilidad:** Registro de compras de insumos a proveedores. Actualiza el stock y el precio
de compra de ingredientes y empaques.

**Tablas principales:**
- `compras` — fecha, proveedor_id, usuario_id, total, estado (borrador/confirmada)
- `compra_lineas` — compra_id, tipo (ingrediente/empaque), item_id, cantidad, precio_unitario, total_linea

**APIs expuestas:**
- `GET  /api/compras` — historial
- `POST /api/compras` — registrar compra
- `PUT  /api/compras/:id/confirmar` — confirmar y actualizar stock

**APIs consumidas:**
- `GET /api/proveedores` — datos del proveedor
- `PUT /api/ingredientes/:id` — actualizar stock
- `PUT /api/empaques/:id` — actualizar stock

**Depende de:** MOD-20 Proveedores, MOD-16 Ingredientes, MOD-17 Empaques

**Lo consumen:**
- MOD-22 Reportes (costo de compras vs ventas)

**Eventos que produce:**
- `compra.registrada` — con lista de ítems y cantidades

**Eventos que recibe:** Ninguno directo

**Riesgos:**
- Una compra confirmada incorrectamente infla el stock; necesitar opción de ajuste
- El precio de compra puede variar por proveedor y temporada; guardar histórico de precios

**Prioridad:** **P3** — mejora a futuro; hoy el stock se actualiza manualmente

---

### MOD-20 — Proveedores

**Dominio:** Abastecimiento

**Responsabilidad:** Catálogo de proveedores de insumos y empaques.

**Tablas principales:**
- `proveedores` — nombre, contacto, telefono, email, direccion, activo

**APIs expuestas:**
- `GET    /api/proveedores`
- `POST   /api/proveedores`
- `PUT    /api/proveedores/:id`
- `DELETE /api/proveedores/:id`

**Depende de:** MOD-01 Seguridad

**Lo consumen:** MOD-19 Compras, MOD-16 Ingredientes (referencia de proveedor)

**Eventos que produce:** Ninguno

**Prioridad:** **P3**

---

## DOMINIO 7: CONFIGURACIÓN

---

### MOD-21 — Configuración General

**Dominio:** Configuración

**Responsabilidad:** Parámetros operativos del restaurante: nombre comercial, teléfono, horario,
IVA vigente, moneda, Stripe Reader, límites de mesas, etc.

**Tablas principales:**
- `config_general` — clave, valor, tipo (string/number/boolean), descripcion

**APIs expuestas:**
- `GET /api/config` — todos los parámetros
- `PUT /api/config/:clave` — actualizar un parámetro (solo admin)

**APIs consumidas:** Ninguna

**Depende de:** MOD-01 Seguridad

**Lo consumen:** Prácticamente todos los módulos (leen IVA, nombre, etc.)

**Eventos que produce:**
- `config.cambiada` — para que otros módulos recarguen si aplica

**Prioridad:** **P1** — ya existe parcialmente en Settings.tsx; necesita persistencia en DB

---

### MOD-22 — Configuración Fiscal (Emisor DTE)

**Dominio:** Configuración / Fiscal

**Responsabilidad:** Almacena los datos fiscales del restaurante como emisor de DTE: NIT, NRC,
código de establecimiento, punto de venta, ambiente (prueba/producción).

**Tablas principales:**
- `dte_emisor` — nit, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad,
  tipo_establecimiento, cod_establecimiento, cod_punto_venta, dir_departamento, dir_municipio,
  dir_complemento, telefono, email, ambiente, activo

**APIs expuestas:**
- `GET /api/dte/emisor` — datos del emisor activo
- `PUT /api/dte/emisor` — actualizar (solo admin)

**Depende de:** MOD-01 Seguridad, MOD-21 Config General

**Lo consumen:**
- MOD-10 DTE (campo `emisor` de todos los documentos)

**Riesgos:**
- NIT y NRC son datos sensibles; solo admin debe poder modificarlos
- Si el ambiente cambia (prueba → producción), todos los DTEs futuros usan el nuevo valor

**Prioridad:** **P2** — bloqueante para DTE

---

## DOMINIO 8: ANALÍTICA Y REPORTES

---

### MOD-23 — Dashboard

**Dominio:** Analítica

**Responsabilidad:** Vista de resumen ejecutivo en tiempo real: ventas del día, pedidos activos,
mesas ocupadas, alertas de inventario, margen promedio.

**Tablas principales:** Ninguna propia — agrega datos de todos los módulos

**APIs expuestas:**
- `GET /api/dashboard/resumen` — KPIs del día actual
- `GET /api/dashboard/alertas` — stock bajo, márgenes en riesgo

**APIs consumidas:**
- `GET /api/ventas?fecha=hoy`
- `GET /api/pedidos?estado=activo`
- `GET /api/mesas`
- `GET /api/ingredientes/alertas`
- `GET /api/empaques?stock_bajo=1`

**Depende de:** MOD-08 Ventas, MOD-05 Pedidos, MOD-04 Mesas, MOD-16 Ingredientes, MOD-17 Empaques

**Lo consumen:** Ninguno

**Eventos que produce:** Ninguno

**Prioridad:** **P2** — ya existe con datos hardcodeados; conectar a datos reales

---

### MOD-24 — Reportes

**Dominio:** Analítica

**Responsabilidad:** Reportes operativos y fiscales: ventas por período, ventas por platillo,
margen por producto, libro de ventas DTE, ventas por forma de pago, desempeño por turno.

**Tablas principales:** Ninguna propia — queries de lectura

**APIs expuestas:**
- `GET /api/reportes/ventas` — ventas por período con filtros
- `GET /api/reportes/platillos` — top items vendidos
- `GET /api/reportes/dte` — libro de ventas DTE por mes
- `GET /api/reportes/formas-pago` — desglose por forma de pago
- `GET /api/reportes/turno/:id` — reporte de un turno
- `GET /api/reportes/inventario` — movimientos de stock

**Depende de:** MOD-08 Ventas, MOD-09 Pagos, MOD-10 DTE, MOD-25 Turnos, MOD-16 Ingredientes

**Lo consumen:** Ninguno

**Riesgos:**
- Queries de reportes pesadas sobre la misma DB operativa pueden afectar el rendimiento
- El libro de ventas DTE tiene formato específico del MH; validar estructura

**Prioridad:** **P2** — ya existe con datos hardcodeados; conectar a DB

---

## DOMINIO 9: OPERACIÓN DE TURNO

---

### MOD-25 — Turnos

**Dominio:** Operación de Turno

**Responsabilidad:** Agrupa la actividad operativa por período de trabajo. Un turno comienza
cuando el encargado lo abre y cierra cuando termina la jornada. Registra qué usuarios trabajaron.

**Tablas principales:**
- `turnos` — fecha, hora_apertura, hora_cierre, usuario_apertura_id, usuario_cierre_id, estado
- `turno_usuarios` — turno_id, usuario_id, hora_entrada, hora_salida

**Estados:** `activo`, `cerrado`

**APIs expuestas:**
- `POST /api/turnos` — abrir turno
- `PUT  /api/turnos/:id/cerrar` — cerrar turno
- `GET  /api/turnos/:id` — detalle con actividad
- `GET  /api/turnos` — historial

**APIs consumidas:**
- `GET /api/ventas?turno_id=` — ventas del turno
- `GET /api/dte?turno_id=` — documentos emitidos en el turno

**Depende de:** MOD-02 Usuarios, MOD-08 Ventas

**Lo consumen:**
- MOD-26 Cortes de Caja
- MOD-24 Reportes

**Eventos que produce:**
- `turno.abierto`
- `turno.cerrado`

**Prioridad:** **P3** — necesario para operación formal con múltiples jornadas

---

### MOD-26 — Cortes de Caja

**Dominio:** Operación de Turno

**Responsabilidad:** Al cerrar el turno, registra el arqueo de caja: cuánto efectivo físico hay,
cuánto debería haber según ventas, y la diferencia (sobrante/faltante).

**Tablas principales:**
- `cortes_caja` — turno_id, efectivo_esperado, efectivo_real, diferencia, usuario_id,
  total_tarjeta, total_transferencia, total_ventas, total_dte_emitidos, observaciones

**APIs expuestas:**
- `POST /api/cortes-caja` — registrar corte
- `GET  /api/cortes-caja` — historial
- `GET  /api/cortes-caja/:id` — detalle

**Depende de:** MOD-25 Turnos, MOD-08 Ventas, MOD-09 Pagos

**Lo consumen:** MOD-24 Reportes

**Eventos que produce:**
- `corte_caja.registrado`
- `corte_caja.diferencia_detectada` — si hay sobrante o faltante

**Prioridad:** **P3**

---

## DOMINIO 10: AUDITORÍA Y LOGS

---

### MOD-27 — Auditoría

**Dominio:** Auditoría y Logs

**Responsabilidad:** Registra qué usuario realizó qué acción sobre qué entidad y cuándo.
Cubre operaciones críticas: modificaciones de precios, creación de ventas, emisión de DTE,
cambios de rol, anulaciones.

**Tablas principales:**
- `auditoria` — usuario_id, accion, entidad, entidad_id, datos_antes (JSON), datos_despues (JSON),
  ip, created_at

**APIs expuestas:**
- `GET /api/auditoria` — historial con filtros (solo admin)
- `GET /api/auditoria?entidad=ventas&entidad_id=123` — auditoría de un registro

**APIs consumidas:** Ninguna (recibe eventos de todos los módulos)

**Depende de:** MOD-01 Seguridad, MOD-02 Usuarios

**Lo consumen:** Ninguno

**Eventos que recibe:** Todos los eventos críticos de todos los módulos

**Prioridad:** **P2** — necesario desde el inicio para trazabilidad

---

### MOD-28 — Logs del Sistema

**Dominio:** Auditoría y Logs

**Responsabilidad:** Registro técnico de errores, llamadas al Firmador, respuestas del MH,
y fallos de transmisión. Diferente de la auditoría (que es de negocio); este es de sistema.

**Tablas principales:**
- `logs_sistema` — nivel (info/warning/error), origen (firmador/mh/db/php), mensaje, datos (JSON),
  created_at

**APIs expuestas:**
- `GET /api/logs` — logs recientes (solo admin)

**Depende de:** Ninguno (los otros módulos escriben en este)

**Lo consumen:** Ninguno

**Prioridad:** **P2** — crítico para diagnosticar fallos del DTE en producción

---

## Resumen de prioridades

| Prioridad | Módulos |
|---|---|
| **P1 — Crítico (base)** | Seguridad, Usuarios, Mesas, Pedidos, POS/Caja, Ventas, Pagos, Menú, Ingredientes, Empaques, Costeo, Config General |
| **P2 — Alta (DTE viable)** | Clientes, DTE, KDS, Config Fiscal, Dashboard, Reportes, Auditoría, Logs |
| **P3 — Media (madurez)** | Notas de Crédito, Contingencia, Recetas, Compras, Proveedores, Turnos, Cortes de Caja |
| **P4 — Futura** | Notas de Débito |
