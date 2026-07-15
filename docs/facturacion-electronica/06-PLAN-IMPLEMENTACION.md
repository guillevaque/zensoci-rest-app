# 06 — Plan de Implementación DTE

Plan de implementación incremental del módulo DTE. Sin SQL, sin CREATE TABLE — solo
estructura de fases, milestones y entregables. Los scripts SQL se generan en el milestone M2
después de confirmar los prerrequisitos M0 y M1.

> Este plan es orientativo. Las fases y prioridades deben validarse con el equipo.
> No implica compromiso de implementación en la fase actual (análisis/documentación).

---

## Principios

1. **No romper lo que funciona.** Cada fase es aditiva. No se modifica lógica existente.
2. **Backend PHP, mismo patrón.** Nuevos archivos PHP siguiendo el patrón de `ingredients.php`.
3. **Frontend React, misma estructura.** Nuevas páginas/componentes, no modificar los existentes.
4. **Primero datos, luego UI.** La DB y el backend deben estar sólidos antes de construir la pantalla.
5. **Primero en ambiente `00` (prueba) del MH, luego en producción.**

---

## Tipo de DTE prioritario

| Tipo | Código | Cuándo |
|---|---|---|
| **Factura** | `01` | Ventas a consumidor final (la mayoría de los casos) |
| Comprobante de Crédito Fiscal | `03` | Solo si el cliente es empresa con NRC y solicita CCF |
| Nota de Crédito | `05` | Anulaciones parciales o devoluciones |

**Se implementa Factura (01) primero.**

---

## Milestones M0–M14

### M0 — Validar documentación oficial del MH

**Objetivo:** Antes de escribir una sola línea de código, confirmar todos los datos fiscales
que afectan el formato del JSON del DTE.

**Tareas:**
- Leer el Manual Técnico del MH versión vigente
- Leer el Manual Funcional del MH versión vigente
- Descargar y revisar los JSON Schemas oficiales del MH para tipo de DTE 01
- Revisar el Catálogo PDF y el Excel del MH
- Confirmar o corregir todos los ítems marcados `PENDIENTE DE VALIDAR CON FUENTE OFICIAL`

**Pendientes específicos a resolver:**

| Pendiente | Referencia |
|---|---|
| Versión del JSON Schema (`version` en identificacion) | Manual Técnico del MH |
| Formato exacto del campo receptor para consumidor final | JSON Schema tipo 01 |
| Si `codigo` del cuerpoDocumento es requerido u opcional | JSON Schema tipo 01 |
| Si `ivaItem` va en cuerpoDocumento o solo en resumen | JSON Schema tipo 01 |
| Formato de `tributos` en cuerpoDocumento | JSON Schema tipo 01 |
| Diferencia entre `codEstableMH` y `codEstable` en emisor | Manual Técnico / JSON Schema |
| Formato exacto del número de control | Manual Técnico del MH |
| URL del API del MH en ambientes prueba y producción | Manual Técnico del MH |
| Mecanismo de autenticación con el API del MH | Manual Técnico del MH |
| Código de respuesta del MH para documento ya procesado | Manual Técnico del MH |
| Código de forma de pago (CAT-017) para PLATAFORMA_EXTERNA | Catálogo CAT-017 |
| Tratamiento fiscal de comisiones de plataformas digitales | Ley tributaria / contador |

**Criterio de aceptación:** Todos los pendientes tienen una respuesta documentada con
su fuente oficial. **Bloqueante:** Sin M0 no se puede escribir el builder (M6).

---

### M1 — Confirmar esquema actual de MySQL en Hostinger

**Objetivo:** Confirmar el estado real de la DB en producción antes de diseñar las nuevas tablas.

**Tareas:**
- Conectar a Hostinger y ejecutar `SHOW TABLES`
- Para cada tabla, ejecutar `DESCRIBE tabla`
- Confirmar nombre exacto de la tabla de usuarios
- Confirmar si existe tabla `mesas` o solo está en el frontend
- Confirmar si `costeo_detalle_ingredientes` existe o fue reemplazada por `costeo_platillo_id`
- Confirmar versión de MySQL y PHP

**Criterio de aceptación:** Lista completa y actualizada de tablas y columnas en producción.

---

### M2 — Diseño y ejecución de migraciones SQL

**Objetivo:** Crear todas las tablas nuevas en la DB de Hostinger.

**Archivos de migración a crear:**
- `migrations/02_omnicanal_base.sql` — mesas, clientes, direcciones_entrega, pedidos, pedido_items
- `migrations/03_ventas.sql` — ventas, venta_items, pagos
- `migrations/04_dte.sql` — configuracion_fiscal, dte_documentos, dte_intentos, dte_eventos_estado, dte_correlativos
- `migrations/05_auditoria.sql` — auditoria
- `migrations/06_menu_precio_sin_iva.sql` — ALTER TABLE menu ADD COLUMN precio_sin_iva

**Notas de diseño:**
- Usar `DECIMAL` para todos los montos monetarios; **nunca** `FLOAT` ni `DOUBLE`
- Todas las tablas con `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- Tablas de historial/auditoría sin CASCADE DELETE en las FK
- Índices en columnas de búsqueda frecuente

**Dependencias:** M0 (tipos de datos exactos), M1 (qué ya existe)

---

### M3 — Pedido omnicanal (backend PHP)

**Archivos a crear:**
- `api/pedidos/pedidos.php` — GET lista, GET detalle, POST crear, PUT estado
- `api/pedidos/pedido_items.php` — POST agregar ítem, PUT modificar, DELETE cancelar
- `api/pedidos/pedidos_helpers.php` — validaciones por canal, idempotencia

**Pruebas clave:**
- POST con canal PLATAFORMA_EXTERNA y misma referencia externa → segundo POST devuelve el existente
- POST con canal MESA y mesa ocupada → error claro
- POST con canal DELIVERY_PROPIO sin cliente_id → error de validación

**Criterio de aceptación:** Un pedido de PedidosYa persiste en la DB con ítems y snapshots de precio.

---

### M4 — Venta y Pagos (backend PHP)

**Archivos a crear:**
- `api/ventas/ventas.php` — POST crear, GET lista, GET detalle, PUT anular
- `api/ventas/ventas_helpers.php` — snapshot fiscal, cálculo precio_sin_iva
- `api/pagos/pagos.php` — POST registrar, GET por venta

**Pruebas clave:**
- POST cobrar pedido → crea venta con numero_ticket correcto
- POST cobrar el mismo pedido dos veces → segundo POST devuelve la venta existente (idempotencia)
- Suma de pagos ≠ total → error de validación

**Criterio de aceptación:** Venta creada con snapshot de precio sin IVA correcto y pagos que
suman exactamente el total.

---

### M5 — Configuración fiscal (backend + UI)

**Archivos a crear:**
- `api/configuracion/config_fiscal.php` — GET, PUT
- Extender `src/pages/Settings.tsx` con sección "Facturación Electrónica"

**Datos en la UI:** NIT, NRC, nombre, código actividad, tipo establecimiento, código
establecimiento, código punto de venta, departamento, municipio, dirección, teléfono,
email, ambiente (prueba/producción) con advertencia al cambiar a producción.

**Criterio de aceptación:** El administrador puede guardar los datos fiscales y la pantalla
los muestra correctamente al recargar.

---

### M6 — Builder de Factura 01 (dte_builder.php)

**Archivos a crear:**
- `api/dte/dte_builder.php` — función `buildFactura01(venta_id)` que retorna el JSON
- `api/dte/dte_helpers.php` — función `totalEnLetras(monto)`, `generarUuidV4()`
- `api/dte/dte_correlativos.php` — función `siguienteCorrelativo(tipo, cod_est, cod_pv)`

**Dependencias:** M4 (ventas), M5 (emisor), M0 (formato exacto del JSON)

**Criterio de aceptación:** El JSON generado pasa la validación del JSON Schema oficial
del MH para tipo de DTE 01.

---

### M7 — Validador JSON Schema (dte_validator.php)

**Archivos a crear:**
- `api/dte/dte_validator.php` — función `validarJsonSchema(json, tipo_dte)`

**Alternativas de implementación:**
1. PHP puro con validación manual de cada campo requerido (más simple, sin dependencias)
2. Usar `justinrainbow/json-schema` si Composer está disponible en Hostinger
3. Validar externamente antes del MVP usando la herramienta del MH

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si el MH proporciona herramienta de
validación local de JSON Schemas.

**Criterio de aceptación:** Un JSON con campo faltante o incorrecto es detectado y el DTE
pasa a `error_validacion`.

---

### M8 — Integración con el Firmador Docker

**Archivos a crear:**
- `api/firmador/firmador_client.php` — función `firmarDTE(nit, dteJson)` via cURL

**Prerrequisito crítico:** El Firmador Docker debe ser accesible desde Hostinger.
Sin esto, M8 y todos los milestones siguientes quedan bloqueados.

**Secretos:** `passwordPri` se lee de `$_ENV['DTE_FIRMADOR_PASSWORD']` o `getenv()`.
**Nunca** de la base de datos ni del repositorio.

**Criterio de aceptación:** El Firmador devuelve el JSON firmado para el NIT real de Zensoci.

---

### M9 — Autenticación con el MH

**Archivos a crear:**
- `api/mh/mh_client.php` — función `autenticarMH()`

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** El mecanismo de autenticación exacto del MH
(token Bearer, certificado cliente, API key, sesión, etc.).

**Criterio de aceptación:** PHP puede autenticarse con el API del MH en ambiente de pruebas.

---

### M10 — Transmisión al MH

**Archivos a modificar:**
- `api/mh/mh_client.php` — ampliar con `transmitirDTE(jsonFirmado)`, parseo de respuesta

**Pruebas clave:**
- DTE válido → MH devuelve `selloRecibido` → guardado en DB como `aceptado`
- DTE inválido → MH rechaza → estado `rechazado`, error registrado
- Timeout del MH → estado `error_temporal`

**Criterio de aceptación:**
- Un DTE de tipo 01 en ambiente de pruebas es aceptado por el MH
- El sello queda guardado en `dte_documentos.sello_mh`

---

### M11 — Historial y reintentos

**Archivos a crear:**
- `api/dte/dte.php` — GET lista, GET detalle, POST reintentar
- Pantalla React de historial de DTEs

**Criterio de aceptación:** El operador puede ver todos los DTEs del día y reintentar
cualquiera en estado de error.

---

### M12 — Representación gráfica del DTE

**Archivos a crear:**
- Pantalla React que muestra: número de control, código de generación, sello, fecha, monto

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si el MH tiene requisitos específicos sobre
la representación gráfica (campos obligatorios, QR de verificación, etc.).

**Criterio de aceptación:** El operador puede mostrar el número de control y el sello en
pantalla inmediatamente después del cobro.

---

### M13 — Mesas y flujo presencial (Etapa 2)

**Archivos a crear/reescribir:**
- `api/mesas/mesas.php` — CRUD y cambio de estado
- Reescribir `src/pages/GestionMesas.tsx` para consumir datos reales
- Reescribir `src/pages/Pedidos.tsx` para flujo real de pedidos
- Nueva página `/cocina` — KDS (Kitchen Display System)

**Dependencias:** M3 (pedidos), M10 (DTE funcionando)

**Criterio de aceptación:** El mesero puede abrir una mesa, el cajero cobra generando un DTE
usando el mismo motor que ya funciona para PedidosYa.

---

### M14 — Delivery propio (Etapa 3)

**Archivos a crear:**
- `api/clientes/clientes.php` — CRUD clientes y direcciones
- Pantalla React de gestión de clientes y delivery

**Criterio de aceptación:** Un pedido con canal DELIVERY_PROPIO puede registrarse con
dirección de entrega, asignarse a un motorista, y generar Venta y DTE al confirmar el cobro.

---

## Diagrama de dependencias entre milestones

```
M0 → M2 (datos fiscales confirmados)
M1 → M2 (schema real conocido)
M2 → M3, M4, M5 (tablas existentes)
M3 → M4 (pedidos para crear ventas)
M4 → M6 (ventas para construir JSON)
M5 → M6 (emisor para construir JSON)
M0 → M6 (formato exacto del JSON)
M6 → M7 (JSON para validar)
M7 → M8 (JSON válido para firmar)
M8 → M10 (JSON firmado para transmitir)
M0 → M9 (autenticación del MH)
M9 → M10 (autenticación para transmitir)
M10 → M11 (DTEs en DB para historial)
M10 → M12 (DTE aceptado para mostrar)
M3 → M13 (pedidos para mesas)
M10 → M13 (DTE para cobro presencial)
M3 → M14 (pedidos para delivery)
M10 → M14 (DTE para delivery)
```

**Ruta crítica:** M0 → M2 → M3 → M4 → M6 → M7 → M8 → M10 (primer DTE emitido)

**Bloqueante externo más crítico:** La accesibilidad del Firmador Docker desde Hostinger
(prerrequisito de M8). Resolver antes de iniciar cualquier milestone del DTE.

---

## 3 Etapas del roadmap de apertura

### ETAPA 1 — DTE para PedidosYa (canal actual)

**Milestones:** M0 → M10 + M11 + M12 + M5 (configuración)
**Duración estimada:** 4–6 semanas desde que M0 y M1 estén completos

**Entregables:**
- [ ] Firmador Docker accesible desde Hostinger (bloqueante crítico)
- [ ] NIT real de Zensoci con llaves en el Firmador
- [ ] Inscripción en el MH como emisor DTE confirmada
- [ ] `DTE_FIRMADOR_PASSWORD` configurada en variable de entorno del servidor
- [ ] Tablas creadas en Hostinger (migraciones M2)
- [ ] Backend PHP: pedidos, ventas, pagos, config fiscal, dte_builder, firmador, mh_client, historial
- [ ] Frontend mínimo: nuevo pedido PedidosYa, registrar venta, historial DTE, configuración fiscal
- [ ] Validación en ambiente 00: 10 DTEs aceptados, reintentos probados, idempotencia verificada
- [ ] Go-live: cambiar `configuracion_fiscal.ambiente` de `00` a `01`

**Criterio de éxito:** Cada venta de PedidosYa genera un DTE aceptado por el MH.
Los DTEs fallidos pueden reintentarse sin re-cobrar.

---

### ETAPA 2 — Mesas y flujo presencial (apertura del restaurante)

**Milestones:** M13 + extensión de M5 (CCF) + Dashboard conectado
**Duración estimada:** 3–5 semanas después de Etapa 1 estable en producción
**Dependencia:** La Etapa 1 debe estar en producción y estable. El motor de DTE no se toca.

**Entregables:**
- [ ] `mesas.php` — CRUD y cambio de estado
- [ ] `GestionMesas.tsx` consumiendo API real (polling cada 30s)
- [ ] `Pedidos.tsx` reescrito para flujo real de pedidos
- [ ] Pantalla `/cocina` — KDS con polling cada 10s
- [ ] POS/Caja real — selección tipo DTE, múltiples formas de pago, cálculo de vuelto
- [ ] Soporte CCF con búsqueda de cliente y datos de receptor
- [ ] `dashboard.php` — KPIs del día desde DB real
- [ ] Simulacro completo y prueba de carga (10 pedidos simultáneos) antes de apertura

**Criterio de éxito:** El mesero abre mesa, toma pedido, cocina lo ve en KDS, cajero cobra
y cliente recibe número de control del DTE.

---

### ETAPA 3 — Delivery propio con motoristas

**Milestones:** M14
**Duración estimada:** 3–4 semanas después de apertura estable
**Dependencia:** Etapa 2 funcionando establemente en producción.

**Entregables:**
- [ ] `clientes.php` completo — CRUD clientes y direcciones de entrega
- [ ] Pantalla de gestión de clientes en React
- [ ] Extensión de `pedidos.php` para canal DELIVERY_PROPIO
- [ ] Asignación de motorista al pedido; rol `motorista` en usuarios
- [ ] Soporte para cobro al entregar y cobro previo
- [ ] Reportes de delivery por motorista y por canal
- [ ] Conciliación PedidosYa (ventas vs comisiones vs liquidaciones)

**Criterio de éxito:** Pedido delivery registrado, asignado a motorista, cobrado y con
DTE válido usando datos completos del receptor.

---

## Línea de tiempo

```
Hoy                  Etapa 1              Apertura           Etapa 3
 │                      │                    │                  │
 ├── M0/M1 (prereqs) ───┤                    │                  │
 │                      │                    │                  │
 ├── Firmador ──────────┤ ← BLOQUEANTE       │                  │
 │                      │                    │                  │
 │   Backend DTE ────────┤                   │                  │
 │                      │                    │                  │
 │   Pruebas MH ─────────┤                   │                  │
 │                      │                    │                  │
 │   Go-live PedidosYa ──┤                   │                  │
 │                      │                    │                  │
 │                      ├── Etapa 2 ─────────┤                  │
 │                      │   Mesas / KDS      │                  │
 │                      │   POS / Caja       │                  │
 │                      │   CCF              │                  │
 │                      │                    │                  │
 │                      │                    ├── Etapa 3 ───────┤
 │                      │                    │   Clientes       │
 │                      │                    │   Motoristas     │
 │                      │                    │   Delivery       │
 ▼                      ▼                    ▼                  ▼
```

---

## Riesgos del roadmap

| Riesgo | Etapa | Impacto | Mitigación |
|---|---|---|---|
| Firmador no accesible desde Hostinger | 1 | **Crítico** | Resolver antes de iniciar cualquier desarrollo DTE |
| Credenciales del Firmador no disponibles | 1 | **Crítico** | El propietario gestiona con el MH |
| MH rechaza DTEs de prueba por error de formato | 1 | Alto | M0 y M7 reducen este riesgo |
| Hostinger no soporta extensiones PHP necesarias | 1 | Alto | Verificar en M1 |
| Tabla de usuarios tiene estructura diferente a la esperada | 1 | Medio | Verificar en M1 y adaptar |
| Apertura antes de que Etapa 1 esté estable | 2 | **Crítico** | No abrir sin DTE funcionando |
| KDS necesita websockets (polling insuficiente) | 2 | Medio | Probar con polling; ajustar intervalo |
| Demanda mayor a la esperada al abrir | 2 | Medio | Pruebas de carga antes de apertura |
| Motorista sin app móvil | 3 | Bajo | Operador confirma entrega desde la app web |

---

## Pendientes fiscales que bloquean el inicio de la Etapa 1

1. NIT real de Zensoci con llaves en el Firmador
2. Inscripción en el MH como emisor DTE
3. Código de establecimiento y punto de venta del MH
4. URL del API del MH (pruebas y producción)
5. Mecanismo de autenticación con el API del MH
6. Catálogos CAT-012 y CAT-013 completos (departamento y municipio)
7. Código de actividad económica de Zensoci (CAT-019)
8. Tratamiento fiscal correcto de la forma de pago de PedidosYa (CAT-017)

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Cada punto de la lista anterior.
