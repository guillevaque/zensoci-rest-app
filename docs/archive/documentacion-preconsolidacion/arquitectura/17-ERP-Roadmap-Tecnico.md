# 17 — ERP Zensoci: Roadmap Técnico

Este documento define el plan de construcción del ERP por fases. Cada fase es un incremento
entregable que agrega valor real al negocio. Las fases son secuenciales en lo crítico
y paralelas donde el grafo de dependencias lo permite.

---

## Principios del roadmap

1. **No romper lo que funciona.** Cada fase es aditiva. Los módulos existentes (Menú, Costeo,
   Ingredientes, Empaques) permanecen intactos hasta que una fase específica los mejore.
2. **DB primero, UI después.** Cada módulo nuevo sigue: tablas → PHP → React.
3. **Vertical slices.** Cada fase entrega funcionalidad completa de extremo a extremo,
   no capas horizontales.
4. **Ambiente de prueba primero.** El DTE se prueba en ambiente `00` del MH antes de producción.
5. **El MVP es cobrar y emitir una Factura real.** Todo lo demás es madurez.

---

## Resumen de fases

| Fase | Nombre | Entregable clave | Módulos |
|---|---|---|---|
| F0 | Cimientos | Usuarios reales, logs, auditoría base | MOD-01, MOD-02, MOD-28, MOD-27 |
| F1 | Sala y Pedidos | Mesas y pedidos en DB real | MOD-04, MOD-05 |
| F2 | Cobro | Primera venta registrada en DB | MOD-08, MOD-09 |
| F3 | DTE Fundación | Primera Factura emitida al MH (prueba) | MOD-22, MOD-10 |
| F4 | POS integrado | Cajero cobra y emite DTE desde la app | MOD-07 |
| F5 | KDS | Vista de cocina en tiempo real | MOD-06 |
| F6 | Clientes y CCF | Clientes frecuentes y CCF | MOD-03, MOD-10 ampliado |
| F7 | Dashboard real | KPIs conectados a datos reales | MOD-23, MOD-21 |
| F8 | Reportes reales | Libro de ventas DTE, reportes operativos | MOD-24 |
| F9 | Notas de Crédito | Anulaciones con NC | MOD-11 |
| F10 | Contingencia | Operación sin internet | MOD-13 |
| F11 | Turnos y Corte | Control de jornada laboral | MOD-25, MOD-26 |
| F12 | Abastecimiento | Compras y proveedores | MOD-19, MOD-20 |
| F13 | Madurez | Recetas formales, Notas de Débito | MOD-18, MOD-12 |

---

## FASE 0 — Cimientos (prerequisito de todo)

**Objetivo:** Antes de construir nada nuevo, consolidar la base de identidad y trazabilidad.

**Entregable:** Los usuarios se gestionan desde la app. Cada acción queda registrada en logs.

### Tareas

#### F0.1 — Confirmar tabla de usuarios
- Identificar el nombre exacto y columnas de la tabla de usuarios en la DB de Hostinger
- Documentar si existe `role`, `pin`, `color_avatar`, `activo`
- Si la tabla difiere del modelo, adaptar el modelo (no la tabla)

#### F0.2 — Backend CRUD de usuarios
- Nuevo `usuarios.php` — GET lista, POST crear, PUT modificar, DELETE desactivar
- Endpoint `PUT /api/usuarios/:id/pin` — cambiar PIN
- Proteger con verificación de rol `admin`

#### F0.3 — Frontend Personal conectado
- Modificar `Personal.tsx` para consumir `/api/usuarios` en lugar de datos hardcodeados
- Formulario modal para crear/editar usuario
- Campo de color de avatar con selector visual

#### F0.4 — Logs del sistema
- Nueva tabla `logs_sistema`
- Función PHP helper `log_sistema($nivel, $origen, $mensaje, $datos)` incluida en todos los PHP nuevos
- No requiere UI en esta fase

#### F0.5 — Auditoría base
- Nueva tabla `auditoria`
- Función PHP helper `audit($usuario_id, $accion, $entidad, $entidad_id, $antes, $despues)`
- Registrar: login/logout, cambios de usuario, cambios de precios de menú

---

## FASE 1 — Sala y Pedidos

**Objetivo:** Mesas y pedidos dejan de ser datos hardcodeados. El mesero puede abrir una mesa
y registrar un pedido real en la base de datos.

**Entregable:** Mesero abre mesa, toma pedido, el pedido persiste en DB.

### Tareas

#### F1.1 — Tabla de mesas
- Nueva tabla `mesas`
- Poblar con los 11 registros actuales (Mesa 1-10 + Pickup)
- Agregar `tipo_mesa` para Pickup y Delivery

#### F1.2 — Backend de mesas
- Nuevo `mesas.php` — GET lista con estado, PUT cambiar estado, POST crear, PUT configurar

#### F1.3 — Tabla de pedidos
- Nueva tabla `pedidos`
- Nueva tabla `pedido_items`

#### F1.4 — Backend de pedidos
- Nuevo `pedidos.php` — GET lista, POST crear, GET detalle, PUT actualizar estado
- `pedidos_items.php` — POST agregar ítem, PUT modificar, DELETE cancelar

#### F1.5 — Frontend GestionMesas conectado
- Reemplazar el array hardcodeado por llamada a `/api/mesas`
- El estado de cada mesa refleja si tiene pedido activo

#### F1.6 — Frontend Pedidos conectado
- Reescribir `Pedidos.tsx` para consumir `/api/pedidos`
- Flujo completo: seleccionar mesa → agregar ítems del menú → confirmar → enviar a cocina

---

## FASE 2 — Cobro (Ventas y Pagos)

**Objetivo:** Una transacción de pago queda registrada permanentemente en la DB.
Este es el requisito previo del DTE.

**Entregable:** Primera venta real registrada en DB. El número de ticket es real.

### Tareas

#### F2.1 — Tabla de ventas
- Nueva tabla `ventas`
- Nueva tabla `venta_items`
- Asegurar que `precio_sin_iva` se calcule desde `menu.price / 1.13` o desde `costeo_platillos.precio_sin_iva`

#### F2.2 — Backend de ventas
- Nuevo `ventas.php` — POST crear venta (transacción atómica: venta + items + pago)
- GET lista de ventas con filtros por fecha
- GET detalle de venta
- PUT anular venta (solo cambia estado; no elimina)

#### F2.3 — Tabla de pagos
- Nueva tabla `pagos`
- El POST de venta registra los pagos simultáneamente

#### F2.4 — Mejorar tabla de menú
- Agregar columna `precio_sin_iva` a tabla `menu`
- Poblar con `price / 1.13` redondeado a 4 decimales
- Mantener `price` (precio con IVA) para compatibilidad

#### F2.5 — Frontend POS básico conectado
- Reescribir `POS.tsx` para flujo real: seleccionar pedido → mostrar totales reales →
  ingresar forma de pago → POST a `/api/caja/cobrar`
- Sin DTE todavía: cobrar y registrar venta, mostrar número de ticket

---

## FASE 3 — DTE Fundación (objetivo principal del proyecto)

**Objetivo:** Emitir la primera Factura electrónica real al ambiente de pruebas del MH.

**Entregable:** JSON válido firmado y transmitido. MH devuelve sello. DTE guardado en DB.

### Tareas

#### F3.1 — Configuración del emisor DTE
- Nueva tabla `dte_emisor`
- Nuevo `dte_emisor.php` — GET datos, PUT actualizar
- Pantalla en Settings: formulario "Facturación Electrónica" con todos los campos fiscales
- Validación de formato de NIT y NRC

#### F3.2 — Tabla de correlativos DTE
- Nueva tabla `dte_correlativos`
- Insertar registro inicial para tipo `01` (Factura)
- Lógica de incremento atómico con `SELECT ... FOR UPDATE` o similar

#### F3.3 — Tabla de documentos DTE
- Nueva tabla `dte_documentos`
- Índices únicos en `codigo_generacion` y `numero_control`

#### F3.4 — Generador de UUID v4
- Verificar disponibilidad de `random_bytes()` en PHP de Hostinger
- Implementar función `generar_uuid_v4()` en helper PHP puro (sin dependencias externas)

#### F3.5 — Generador del JSON del DTE
- Nuevo `dte_generar.php`
- Construye el JSON conforme al esquema del MH para tipo `01` (Factura, consumidor final)
- Estructura: `identificacion`, `emisor`, `receptor`, `cuerpoDocumento`, `resumen`
- Calcular `totalLetras` (monto en palabras en español)

#### F3.6 — Integración con el Firmador
- Definir arquitectura de acceso: el Firmador Docker debe ser accesible desde Hostinger
  *(ver opciones en doc 05-Brechas-DTE.md — PENDIENTE DE CONFIRMAR con el equipo)*
- Nuevo `dte_firmar.php` — POST al Firmador con el JSON
- Parsear respuesta del Firmador, guardar JSON firmado

#### F3.7 — Transmisión al MH
- Nuevo `dte_transmitir.php` — POST al API del MH (ambiente de pruebas)
- Parsear respuesta: `selloRecibido`, `estado`, `descripcionMsg`
- Actualizar `dte_documentos` con el resultado

#### F3.8 — Endpoint de emisión unificado
- Nuevo `dte_emitir.php` — orquesta F3.5 → F3.6 → F3.7
- Manejo de errores en cada etapa: si falla el Firmador, guardar borrador; si falla MH, guardar firmado

#### F3.9 — Pruebas con el MH
- Emitir 5 DTEs de prueba en ambiente `00`
- Verificar que el MH los acepta y devuelve sello
- Documentar los resultados en `docs/facturacion-electronica/`

---

## FASE 4 — POS integrado

**Objetivo:** El flujo completo cajero → cobro → DTE funciona desde la interfaz de producción.

**Entregable:** El cajero puede abrir la caja, cobrar una mesa, y el cliente recibe el número
de control del DTE en pantalla.

### Tareas

#### F4.1 — Endpoint unificado de cobro
- Nuevo `caja_cobrar.php` — transacción completa:
  1. Crear Venta
  2. Registrar Pago(s)
  3. Emitir DTE
  4. Liberar Mesa
  5. Marcar Pedido como pagado
- Debe ser una transacción atómica: si algún paso falla, se define el comportamiento de cada fallo

#### F4.2 — Frontend POS/Caja completo
- Pantalla de caja: lista de mesas ocupadas
- Seleccionar mesa → ver resumen del pedido con totales
- Seleccionar tipo DTE (Factura o CCF)
- Ingresar forma(s) de pago con montos
- Botón "Cobrar" → spinner → mostrar número de control y sello del MH
- Manejo de errores: Firmador no disponible, MH rechaza

#### F4.3 — Reimpresión básica
- Pantalla de historial de ventas del día
- Botón "Ver DTE" para cada venta → muestra JSON del DTE y el sello
- Botón "Reimprimir" → genera representación en pantalla o imprime

---

## FASE 5 — KDS (Pantalla de Cocina)

**Objetivo:** La cocina tiene su propia pantalla en tiempo real. Los ítems aparecen al ser
confirmados por el mesero y desaparecen al ser marcados como listos.

**Entregable:** Pantalla de cocina funcional con actualización automática cada N segundos.

### Tareas

#### F5.1 — Endpoint de cola de cocina
- Nuevo `cocina.php` — GET ítems pendientes ordenados por hora
- PUT item/:id/estado — cambiar a en_preparacion o listo

#### F5.2 — Frontend KDS
- Nueva página `/cocina` (sin sidebar, pantalla completa)
- Tarjetas por pedido con sus ítems pendientes
- Polling cada 10 segundos (sin websockets en esta fase)
- Indicador de tiempo de espera por ítem (color: verde < 10 min, amarillo < 20, rojo > 20)
- Botón "Listo" por ítem y "Todo listo" por pedido

---

## FASE 6 — Clientes y CCF

**Objetivo:** Clientes frecuentes en catálogo. El cajero puede emitir CCF a empresas.

**Entregable:** CCF válido emitido y aceptado por el MH.

### Tareas

#### F6.1 — Backend de clientes
- Nueva tabla `clientes`
- Nuevo `clientes.php` — CRUD completo
- Búsqueda por NIT, NRC, nombre

#### F6.2 — Frontend Clientes
- Nueva sección en Configuración o módulo propio
- Buscar cliente al cobrar CCF

#### F6.3 — DTE tipo CCF
- Extender `dte_generar.php` para tipo `03`
- Receptor con datos completos: NIT, NRC, nombre, dirección, actividad
- Agregar selects de CAT-009, CAT-012, CAT-013 en el formulario del receptor

---

## FASE 7 — Dashboard real

**Objetivo:** El Dashboard muestra datos reales del día, no números hardcodeados.

**Entregable:** Dashboard con KPIs reales: ventas, pedidos, mesas, alertas de inventario.

### Tareas

#### F7.1 — Persistencia de Config General
- Nueva tabla `config_general` (clave-valor)
- Nuevo `config.php` — GET y PUT
- Migrar valores de Settings.tsx a DB: nombre, teléfono, IVA, horario

#### F7.2 — Endpoint de resumen del dashboard
- Nuevo `dashboard.php` — GET agrega: ventas hoy, pedidos activos, mesas libres/ocupadas,
  alertas de stock, margen promedio del día

#### F7.3 — Frontend Dashboard conectado
- Reemplazar datos hardcodeados por llamada a `/api/dashboard`
- Refrescar automáticamente cada 60 segundos

---

## FASE 8 — Reportes reales

**Objetivo:** Los reportes muestran datos reales y el libro de ventas DTE es exportable.

### Tareas

#### F8.1 — Endpoints de reportes
- `reportes.php` — GET con query params: `tipo`, `fecha_inicio`, `fecha_fin`
- Implementar: ventas por período, top platillos, ventas por forma de pago, DTE por estado

#### F8.2 — Libro de ventas DTE
- Endpoint específico: GET `/api/reportes/libro-dte?mes=YYYY-MM`
- Formato: número de ticket, número de control, tipo DTE, receptor, monto sin IVA, IVA, total
- Exportable como CSV

#### F8.3 — Frontend Reportes conectado
- Reemplazar placeholders por datos reales
- Filtros de fecha funcionales
- Botón de exportación CSV

---

## FASE 9 — Notas de Crédito

**Objetivo:** El manager puede anular una factura emitida y el MH recibe la NC.

### Tareas

#### F9.1 — Backend NC
- Nueva tabla `notas_credito`
- Extender `dte_generar.php` para tipo `05`
- Nuevo `notas_credito.php` — POST crear NC, GET historial

#### F9.2 — Frontend anulación
- Botón "Anular" en el detalle de una venta (solo manager)
- Formulario de motivo
- Confirmación → flujo NC completo

---

## FASE 10 — Contingencia

**Objetivo:** El sistema puede seguir cobrando sin internet y retransmitir al recuperar conexión.

### Tareas

#### F10.1 — Backend de contingencia
- Nueva tabla `contingencias`
- Nuevo `contingencia.php` — POST iniciar, PUT cerrar, POST retransmitir

#### F10.2 — Detección automática
- En `dte_emitir.php`: si el MH no responde en N segundos, activar modo contingencia
- Los DTEs siguientes usan `tipo_transmision = 2`

#### F10.3 — Frontend
- Banner "Modo Contingencia Activo" visible en toda la app
- Pantalla de gestión de contingencia para manager
- Cola de DTEs pendientes con estado de retransmisión

---

## FASE 11 — Turnos y Cortes de Caja

**Objetivo:** Operación formal con jornadas laborales, arqueo de caja y cierre de turno.

### Tareas

#### F11.1 — Backend de turnos
- Nueva tabla `turnos`, `turno_usuarios`
- Nuevo `turnos.php` — POST abrir, PUT cerrar, GET historial

#### F11.2 — Backend de cortes
- Nueva tabla `cortes_caja`
- Nuevo `cortes_caja.php` — POST registrar corte, GET historial

#### F11.3 — Frontend
- Pantalla de turno activo con resumen en tiempo real
- Formulario de corte de caja con ingreso de efectivo contado
- Reporte de cierre de turno imprimible

---

## FASE 12 — Abastecimiento

**Objetivo:** Las compras de insumos se registran en el sistema y actualizan el inventario.

### Tareas

#### F12.1 — Backend de proveedores
- Nueva tabla `proveedores`
- Nuevo `proveedores.php` — CRUD

#### F12.2 — Backend de compras
- Nuevas tablas `compras`, `compra_lineas`
- Nuevo `compras.php` — borrador → confirmar → actualizar stock

#### F12.3 — Frontend
- Nueva sección "Compras" en el módulo de Inventario

---

## FASE 13 — Madurez

**Objetivo:** Completar funcionalidades de segunda generación.

### Tareas (en orden de prioridad dentro de la fase)

#### F13.1 — Recetas formales (MOD-18)
- Tablas dedicadas `recetas`, `receta_lineas` independientes de `ingredientes`
- Migración de líneas de receta del campo `costeo_platillo_id` a las nuevas tablas
- Versionado de recetas (cuando cambia un ingrediente, se crea nueva versión)

#### F13.2 — Descuento automático de inventario
- Al confirmar una venta, descontar ingredientes y empaques según la receta de cada ítem vendido
- Reportes de consumo vs compras

#### F13.3 — Notas de Débito (MOD-12)
- Baja prioridad para restaurante
- Mismo patrón que NC pero tipo `06`

#### F13.4 — Envío de DTE por email (MOD-10 mejora)
- Configurar SMTP en Hostinger
- Botón "Enviar por email" en detalle de venta

#### F13.5 — Representación gráfica del DTE (PDF)
- Generar PDF del DTE con número de control, sello y QR de verificación
- Posible integración con impresora térmica

---

## Criterios de éxito por fase

| Fase | Criterio de éxito |
|---|---|
| F0 | Un admin crea un usuario nuevo desde la app y ese usuario puede hacer login |
| F1 | Un mesero abre la Mesa 3, agrega 2 ítems, y el pedido aparece en la DB |
| F2 | Se registra una venta con número de ticket en DB; la venta no se puede eliminar |
| F3 | El MH devuelve un sello_recibido para una Factura de prueba; el sello se guarda en DB |
| F4 | El cajero cobra una mesa desde la app y el cliente recibe el número de control en pantalla |
| F5 | El ítem aparece en la pantalla de cocina < 3 segundos después de confirmar el pedido |
| F6 | Se emite un CCF a un NIT real y el MH lo acepta |
| F7 | El Dashboard muestra las ventas reales del día sin hardcoding |
| F8 | Se exporta el libro de ventas DTE del mes en CSV con todos los campos del MH |
| F9 | Se anula una factura y el MH acepta la Nota de Crédito |
| F10 | El sistema cobra sin internet y los DTEs quedan en cola; al restaurar internet se retransmiten |
| F11 | Al cerrar el turno, el sistema muestra la diferencia de efectivo real vs esperado |
| F12 | Una compra confirmada actualiza el stock de ingredientes en tiempo real |
| F13 | Al vender un platillo, los ingredientes de su receta se descuentan del inventario |

---

## Estimación de complejidad relativa

*(Expresada en unidades de esfuerzo relativo, no en días)*

| Fase | Complejidad | Razón principal |
|---|---|---|
| F0 | Baja | Módulos simples, patrón conocido |
| F1 | Media | Dos módulos interdependientes, estado de mesas en tiempo real |
| F2 | Media | Transacción atómica crítica, precisión decimal |
| F3 | **Alta** | Integración con Firmador + MH, manejo de errores externo, formato JSON estricto |
| F4 | Media | Orquestación compleja, UX de caja crítica |
| F5 | Media | Polling, actualización en tiempo real |
| F6 | Baja | Extensión de DTE ya construido |
| F7 | Baja | Queries de agregación, frontend existente |
| F8 | Media | Queries complejas, exportación, formato libro DTE |
| F9 | Media | Integración con MH, validación de plazos |
| F10 | **Alta** | Detección automática de fallo, cola, retransmisión, estado consistente |
| F11 | Baja | CRUD simple con lógica de negocio clara |
| F12 | Baja | CRUD con actualización de stock |
| F13 | **Alta** | Migración de datos existentes, versionado de recetas, descuento automático |

---

## Consideraciones de infraestructura por fase

| Fase | Requisito de infraestructura |
|---|---|
| F0–F2 | Solo Hostinger PHP + MySQL (ya disponible) |
| F3 | **Firmador Docker accesible desde Hostinger** — resolver ANTES de iniciar F3 |
| F5 | Sin cambios (polling HTTP simple) |
| F10+ | Posible necesidad de cron job en Hostinger para retransmisión automática |
| F13+ | Si el descuento de inventario debe ser en tiempo real, considerar triggers en MySQL |

---

## Dependencias externas bloqueantes

| Dependencia | Bloquea | Estado |
|---|---|---|
| URL API del MH (ambiente pruebas) | F3 | Pendiente de confirmar con el MH |
| NIT real de Zensoci | F3 | Pendiente de confirmar |
| Firmador con llaves del NIT real | F3 | Error confirmado: NIT de prueba no tiene llaves |
| Arquitectura de acceso al Firmador desde Hostinger | F3 | Pendiente de definir |
| Tabla de usuarios confirmada en DB | F0 | Pendiente de revisar en Hostinger |
