# 05 — Roadmap Técnico

Plan de construcción del ERP Zensoci por fases. Cada fase entrega funcionalidad completa
de extremo a extremo (vertical slices), no capas horizontales.

---

## Principios

1. **No romper lo que funciona.** Menú, Costeo, Ingredientes, Empaques permanecen intactos.
2. **DB primero, UI después.** Tablas → PHP → React.
3. **Ambiente de prueba primero.** El DTE se prueba en ambiente `00` del MH antes de producción.
4. **El MVP es cobrar y emitir una Factura real.** Todo lo demás es madurez.

---

## Los 28 módulos

| # | Módulo | Dominio | Prioridad | Estado |
|---|---|---|---|---|
| MOD-01 | Seguridad (Auth) | Seguridad | P1 | Parcial |
| MOD-02 | Usuarios | Seguridad | P1 | Parcial |
| MOD-03 | Clientes | Ventas | P2 | No existe |
| MOD-04 | Mesas | Sala | P1 | Solo UI |
| MOD-05 | Pedidos | Sala | P1 | Solo UI |
| MOD-06 | KDS | Sala | P2 | No existe |
| MOD-07 | POS / Caja | Cobro | P1 | Prototipo |
| MOD-08 | Ventas | Cobro | P1 | No existe |
| MOD-09 | Pagos | Cobro | P1 | No existe |
| MOD-10 | DTE | Facturación | P2 | No existe |
| MOD-11 | Notas de Crédito | Facturación | P3 | No existe |
| MOD-12 | Notas de Débito | Facturación | P4 | No existe |
| MOD-13 | Contingencia | Facturación | P3 | No existe |
| MOD-14 | Menú | Catálogo | P1 | **Completo** |
| MOD-15 | Costeo | Catálogo | P1 | **Completo** |
| MOD-16 | Ingredientes | Inventario | P1 | **Completo** |
| MOD-17 | Empaques | Inventario | P1 | **Completo** |
| MOD-18 | Recetas | Catálogo | P4 | No existe |
| MOD-19 | Compras | Abastecimiento | P3 | No existe |
| MOD-20 | Proveedores | Abastecimiento | P3 | No existe |
| MOD-21 | Config General | Config | P2 | Parcial |
| MOD-22 | Config Fiscal | Config | P2 | No existe |
| MOD-23 | Dashboard | Reportes | P2 | Solo UI |
| MOD-24 | Reportes | Reportes | P2 | Solo UI |
| MOD-25 | Turnos | Operación | P3 | No existe |
| MOD-26 | Cortes de Caja | Operación | P3 | No existe |
| MOD-27 | Auditoría | Transversal | P2 | No existe |
| MOD-28 | Logs Sistema | Transversal | P2 | No existe |

---

## Grafo de dependencias

Las flechas indican "depende de" (→ = requiere que exista).

```
MOD-21 Config General ──────────────────────────────────────┐
MOD-01 Seguridad ────────────────────────────────────────┐  │
                                                         │  │
                    ┌────────────────────────────────────▼──▼───────┐
                    │ MOD-02 Usuarios                                │
                    └────────────────────────┬───────────────────────┘
                                             │
                    ┌────────────────────────▼───────────────────────┐
                    │ MOD-04 Mesas    MOD-14 Menú    MOD-03 Clientes │
                    └──────┬──────────────┬──────────────────────────┘
                           │              │
                    ┌──────▼──────────────▼──────────────────────────┐
                    │ MOD-05 Pedidos                                  │
                    └──────┬─────────────────────────────────────────┘
                           │
               ┌───────────┼──────────────────┐
               │           │                  │
         ┌─────▼────┐  ┌───▼──────┐    ┌──────▼─────────────────────┐
         │ MOD-06   │  │ MOD-08   │    │ MOD-07 POS/Caja            │
         │  KDS     │  │ Ventas   │    └──────┬─────────────────────┘
         └──────────┘  └───┬──────┘           │
                           │                  │
                    ┌──────▼──────┐           │
                    │ MOD-09 Pagos│◄──────────┘
                    └──────┬──────┘
                           │
                    ┌──────▼──────────────────────────────────────┐
                    │ MOD-10 DTE (requiere también MOD-22)        │
                    └──────┬────────────┬───────────────────────┘
                           │            │
                    ┌──────▼────┐  ┌────▼──────────┐
                    │ MOD-11 NC │  │ MOD-13        │
                    │ MOD-12 ND │  │ Contingencia  │
                    └───────────┘  └───────────────┘

MOD-16 Ingredientes ──► MOD-15 Costeo ──► MOD-14 Menú
MOD-17 Empaques ──────► MOD-15 Costeo
MOD-20 Proveedores ───► MOD-19 Compras ──► MOD-16, MOD-17
MOD-25 Turnos ──► MOD-26 Cortes de Caja
MOD-08 Ventas ──► MOD-23 Dashboard / MOD-24 Reportes
MOD-01 Seguridad ──► MOD-27 Auditoría
```

---

## Ruta crítica para el primer DTE real

```
MOD-01 Seguridad
  └─► MOD-21 Config General
        └─► MOD-22 Config Fiscal (Emisor DTE)
MOD-01 Seguridad
  └─► MOD-02 Usuarios
        └─► MOD-04 Mesas
              └─► MOD-05 Pedidos
                    └─► MOD-08 Ventas
                          └─► MOD-09 Pagos
                                └─► MOD-10 DTE ◄── MOD-22 Config Fiscal
                                      └─► PRIMER DTE REAL
```

**Profundidad:** 8 niveles. Módulos bloqueantes: MOD-01, MOD-05, MOD-08, MOD-09, MOD-10.

---

## Grupos de construcción en paralelo

| Grupo | Condición | Módulos |
|---|---|---|
| A | Después de MOD-01 | MOD-02, MOD-14*, MOD-16*, MOD-17*, MOD-20, MOD-21, MOD-28 |
| B | Después del Grupo A | MOD-03, MOD-04, MOD-15*, MOD-22 |
| C | Después del Grupo B | MOD-05, MOD-19, MOD-27 |
| D | Después del Grupo C | MOD-06, MOD-08 |
| E | Después del Grupo D | MOD-09, MOD-25 |
| F | Después del Grupo E | MOD-10, MOD-26 |
| G | Después del Grupo F | MOD-07, MOD-11, MOD-13, MOD-23, MOD-24 |
| H | Después del Grupo G | MOD-12 |

`*` = ya existe

---

## Fases de construcción

| Fase | Nombre | Módulos | Entregable |
|---|---|---|---|
| F0 | Cimientos | MOD-01, MOD-02, MOD-28, MOD-27 | Usuarios reales, logs, auditoría |
| F1 | Sala y Pedidos | MOD-04, MOD-05 | Mesas y pedidos en DB real |
| F2 | Cobro | MOD-08, MOD-09 | Primera venta registrada en DB |
| F3 | DTE Fundación | MOD-22, MOD-10 | Primera Factura al MH (prueba) |
| F4 | POS integrado | MOD-07 | Cajero cobra y emite DTE desde la app |
| F5 | KDS | MOD-06 | Vista de cocina en tiempo real |
| F6 | Clientes y CCF | MOD-03, MOD-10 ampliado | CCF válido emitido al MH |
| F7 | Dashboard real | MOD-23, MOD-21 | KPIs conectados a datos reales |
| F8 | Reportes reales | MOD-24 | Libro de ventas DTE exportable en CSV |
| F9 | Notas de Crédito | MOD-11 | Anulaciones con NC aceptada por el MH |
| F10 | Contingencia | MOD-13 | Operación sin internet + retransmisión |
| F11 | Turnos y Corte | MOD-25, MOD-26 | Control de jornada laboral |
| F12 | Abastecimiento | MOD-19, MOD-20 | Compras actualizan inventario |
| F13 | Madurez | MOD-18, MOD-12 | Recetas formales, Notas de Débito |

---

## Detalle de fases críticas

### F0 — Cimientos

- Confirmar tabla de usuarios en Hostinger (nombre exacto y columnas)
- Backend CRUD de usuarios (`usuarios.php`)
- Frontend Personal conectado (reemplazar hardcoded)
- Tabla `logs_sistema` + helper `log_sistema()`
- Tabla `auditoria` + helper `audit()`

**Criterio:** Un admin crea un usuario desde la app y ese usuario puede hacer login.

---

### F1 — Sala y Pedidos

- Tabla `mesas` + poblar 11 registros (Mesa 1-10 + Pickup)
- Backend `mesas.php`
- Tablas `pedidos` + `pedido_items`
- Backend `pedidos.php` + `pedido_items.php`
- Reescribir `GestionMesas.tsx` y `Pedidos.tsx` consumiendo API real

**Criterio:** Un mesero abre la Mesa 3, agrega 2 ítems, y el pedido persiste en DB.

---

### F2 — Cobro (prerequisito del DTE)

- Tablas `ventas` + `venta_items` + `pagos`
- Agregar columna `precio_sin_iva` a tabla `menu` (poblar con `price / 1.13`)
- Backend `ventas.php` — POST crea venta+items+pagos en transacción atómica
- Frontend POS básico conectado (sin DTE todavía)

**Criterio:** Se registra una venta con número de ticket en DB; la venta no puede eliminarse.

---

### F3 — DTE Fundación (OBJETIVO PRINCIPAL)

- Tabla `dte_emisor` + backend `dte_emisor.php` + pantalla en Settings
- Tabla `dte_correlativos` + incremento atómico (`SELECT ... FOR UPDATE`)
- Tabla `dte_documentos` con índices únicos en `codigo_generacion` y `numero_control`
- Función `generar_uuid_v4()` en PHP puro (`random_bytes()`)
- `dte_builder.php` — construye JSON tipo 01 (Factura, consumidor final)
- `dte_validator.php` — valida contra JSON Schema del MH
- `firmador_client.php` — POST al Firmador Docker
- `mh_client.php` — POST al API del MH
- `dte.php` — endpoint principal que orquesta todo
- Emitir 5-10 DTEs en ambiente `00` (prueba) del MH

**BLOQUEANTE:** Firmador Docker debe ser accesible desde Hostinger. Hoy solo corre en `localhost:8113` de la máquina del desarrollador. Esta es la brecha de infraestructura más crítica.

**Criterio:** El MH devuelve `sello_recibido` para una Factura de prueba; el sello se guarda en DB.

---

### F4 — POS integrado

- `caja/cobrar.php` — transacción completa: Venta + Pagos + DTE + liberar Mesa + marcar Pedido pagado
- Frontend POS/Caja completo: mesas ocupadas → resumen pedido → tipo DTE → formas de pago → mostrar número de control y sello
- Historial básico de ventas del día con reimpresión

**Criterio:** El cajero cobra una mesa desde la app y el cliente recibe el número de control en pantalla.

---

## Arquitectura interna: monolito modular PHP

**Un solo proceso PHP. Una sola base de datos MySQL. Una sola URL de API.**

La separación es lógica (directorios), no física. Los módulos se llaman entre sí mediante funciones PHP, no mediante HTTP interno.

### Estructura de directorios

```
/api/
  ├── core/
  │   ├── db.php              — conexión PDO, helpers de query
  │   ├── auth.php            — verificación de sesión y roles
  │   ├── response.php        — helpers json_success(), json_error()
  │   ├── validation.php      — reglas de validación comunes
  │   └── audit.php           — función audit() reutilizable
  │
  ├── pedidos/
  │   ├── pedidos.php
  │   ├── pedido_items.php
  │   └── pedidos_helpers.php — validaciones por canal, idempotencia
  │
  ├── ventas/
  │   ├── ventas.php
  │   └── ventas_helpers.php  — construcción del snapshot, cálculos fiscales
  │
  ├── pagos/pagos.php
  ├── clientes/clientes.php
  │
  ├── dte/
  │   ├── dte.php             — endpoint principal: emitir, listar, reintentar
  │   ├── dte_builder.php     — construye el JSON del DTE desde la Venta
  │   ├── dte_validator.php   — valida contra JSON Schema oficial del MH
  │   ├── dte_correlativos.php — asigna numero_control de forma atómica
  │   └── dte_helpers.php     — total en letras, cálculos de resumen
  │
  ├── firmador/firmador_client.php
  ├── mh/mh_client.php
  │
  ├── configuracion/
  │   ├── config.php          — parámetros generales (clave-valor)
  │   └── config_fiscal.php   — datos del emisor DTE
  │
  ├── mesas/mesas.php
  ├── menu/menu.php           — ya existe; sin cambios
  ├── ingredientes/ingredients.php — ya existe; sin cambios
  ├── empaques/empaques.php   — ya existe; sin cambios
  ├── usuarios/usuarios.php
  ├── auth/                   — ya existe; sin cambios estructurales
  └── reportes/reportes.php
```

### Flujo de llamadas en el cobro

```
React (POS/Caja)
  └─► POST /api/caja/cobrar.php
        │
        ├─ [1] Validar sesión y rol (auth.php)
        ├─ [2] Leer pedido y sus ítems
        ├─ [3] Calcular snapshot fiscal (ventas_helpers.php)
        │
        ├─ BEGIN TRANSACTION
        │   ├─ [4] INSERT INTO ventas
        │   ├─ [5] INSERT INTO venta_items (snapshot)
        │   ├─ [6] INSERT INTO pagos
        │   ├─ [7] UPDATE pedidos SET estado = PAGADO
        │   └─ [8] UPDATE mesas SET estado = LIBRE (si canal = MESA)
        ├─ COMMIT
        │
        ├─ [9]  INSERT INTO dte_documentos (estado = PENDIENTE_GENERACION)
        ├─ [10] Generar JSON del DTE (dte_builder.php)
        ├─ [11] Validar contra JSON Schema (dte_validator.php)
        ├─ [12] POST al Firmador (firmador_client.php)
        ├─ [13] UPDATE dte_documentos (estado = FIRMADO, json_firmado)
        ├─ [14] POST al MH (mh_client.php)
        └─ [15] UPDATE dte_documentos (estado = ACEPTADO, sello_mh)
```

Pasos 9-15 ocurren **después del COMMIT**. Si fallan, la venta ya está guardada y el DTE se puede reintentar sin re-cobrar.

### Qué NO existe en esta arquitectura

| Patrón excluido | Razón |
|---|---|
| Microservicios | Hostinger no soporta orquestación de servicios |
| Bus de eventos / Kafka | Sobrecarga innecesaria para el volumen de Zensoci |
| Node.js | El stack es PHP; no agregar nuevos runtimes |
| Redis / colas | Hostinger shared no ofrece Redis |
| Laravel / Symfony | PHP puro; patrón existente funciona |
| ORM | Consultas SQL directas con PDO preparado |
| WebSockets | KDS usa polling HTTP |
| JWT | PHP sessions con cookies ya funciona en producción |

---

## Infraestructura por fase

| Fase | Requisito de infraestructura |
|---|---|
| F0–F2 | Solo Hostinger PHP + MySQL (ya disponible) |
| F3 | **Firmador Docker accesible desde Hostinger — resolver ANTES de iniciar F3** |
| F5 | Sin cambios (polling HTTP simple, cada 10 segundos) |
| F10+ | Cron job en Hostinger para reintentos de DTE en cola |
| F13+ | Posibles triggers en MySQL para descuento automático de inventario |

**Consideraciones de Hostinger:**
- `random_bytes()` disponible desde PHP 7.0 — verificar versión en Hostinger
- cURL disponible — necesario para Firmador y MH
- `DECIMAL(10,2)` para montos; `DECIMAL(10,4)` para precios unitarios
- Sin Docker en shared hosting — el Firmador se despliega en servidor externo; PHP llama vía HTTP

---

## Dependencias externas bloqueantes para F3 (DTE)

| Dependencia | Estado |
|---|---|
| Firmador Docker accesible desde Hostinger | **PENDIENTE — bloqueante crítico** |
| NIT real de Zensoci con llaves en el Firmador | PENDIENTE |
| Inscripción en el MH como emisor DTE | PENDIENTE |
| Código de establecimiento y punto de venta del MH | PENDIENTE |
| URL del API del MH en ambiente de pruebas | PENDIENTE DE CONFIRMAR |
| Autenticación con el API del MH | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| Variable de entorno `DTE_FIRMADOR_PASSWORD` en Hostinger | PENDIENTE |

Ver `docs/facturacion-electronica/05-FUENTES-OFICIALES.md` para la lista completa de pendientes fiscales.

---

## Criterios de éxito por fase

| Fase | Criterio de éxito |
|---|---|
| F0 | Un admin crea un usuario nuevo desde la app y ese usuario puede hacer login |
| F1 | Un mesero abre la Mesa 3, agrega 2 ítems, y el pedido aparece en la DB |
| F2 | Se registra una venta con número de ticket en DB; la venta no se puede eliminar |
| F3 | El MH devuelve `sello_recibido` para una Factura de prueba; el sello se guarda en DB |
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

| Fase | Complejidad | Razón principal |
|---|---|---|
| F0 | Baja | Módulos simples, patrón conocido |
| F1 | Media | Dos módulos interdependientes, estado de mesas |
| F2 | Media | Transacción atómica crítica, precisión decimal |
| F3 | **Alta** | Integración Firmador + MH, errores externos, JSON estricto |
| F4 | Media | Orquestación compleja, UX de caja crítica |
| F5 | Media | Polling, actualización en tiempo real |
| F6 | Baja | Extensión de DTE ya construido |
| F7 | Baja | Queries de agregación, frontend existente |
| F8 | Media | Queries complejas, exportación, formato libro DTE |
| F9 | Media | Integración con MH, validación de plazos |
| F10 | **Alta** | Detección automática de fallo, cola, retransmisión |
| F11 | Baja | CRUD simple con lógica de negocio clara |
| F12 | Baja | CRUD con actualización de stock |
| F13 | **Alta** | Migración de datos existentes, versionado de recetas |
