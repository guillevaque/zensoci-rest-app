# 20 — Arquitectura: Monolito Modular

Zensoci usa un monolito modular PHP sobre Hostinger. No hay microservicios, no hay bus de eventos,
no hay Node.js. La modularidad existe en la organización del código y la separación de
responsabilidades, no en la infraestructura.

---

## Principio arquitectónico

**Un solo proceso PHP. Una sola base de datos MySQL. Una sola URL de API.**

La separación en módulos es lógica, no física. Cada módulo es un conjunto de archivos PHP
en un directorio propio bajo `/api/`. Los módulos se llaman entre sí mediante funciones PHP,
no mediante HTTP interno.

---

## Estructura de directorios propuesta

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
  │   ├── pedidos.php         — CRUD de pedidos
  │   ├── pedido_items.php    — ítems de un pedido
  │   └── pedidos_helpers.php — validaciones por canal, idempotencia
  │
  ├── ventas/
  │   ├── ventas.php          — crear venta, listar, detalle
  │   └── ventas_helpers.php  — construcción del snapshot, cálculos fiscales
  │
  ├── pagos/
  │   └── pagos.php           — registrar pagos, listar por venta
  │
  ├── clientes/
  │   └── clientes.php        — CRUD clientes y direcciones de entrega
  │
  ├── dte/
  │   ├── dte.php             — endpoint principal: emitir, listar, detalle, reintentar
  │   ├── dte_builder.php     — construye el JSON del DTE desde la Venta
  │   ├── dte_validator.php   — valida el JSON contra el JSON Schema oficial del MH
  │   ├── dte_correlativos.php — asigna numero_control de forma atómica
  │   └── dte_helpers.php     — total en letras, cálculos de resumen
  │
  ├── firmador/
  │   └── firmador_client.php — POST al Firmador Docker, manejo de errores y reintentos
  │
  ├── mh/
  │   └── mh_client.php       — POST al API del MH, parseo de respuesta, manejo de errores
  │
  ├── configuracion/
  │   ├── config.php          — parámetros generales (clave-valor)
  │   └── config_fiscal.php   — datos del emisor DTE
  │
  ├── mesas/
  │   └── mesas.php           — CRUD mesas, cambio de estado
  │
  ├── menu/
  │   └── menu.php            — ya existe; sin cambios
  │
  ├── ingredientes/
  │   └── ingredients.php     — ya existe; sin cambios
  │
  ├── empaques/
  │   └── empaques.php        — ya existe; sin cambios
  │
  ├── usuarios/
  │   └── usuarios.php        — CRUD usuarios, roles, PIN
  │
  ├── auth/
  │   ├── login.php           — ya existe; sin cambios estructurales
  │   ├── logout.php          — ya existe
  │   ├── me.php              — ya existe
  │   └── users.php           — ya existe
  │
  └── reportes/
      └── reportes.php        — queries de lectura agregadas
```

---

## Los nueve módulos funcionales

### 1. Módulo Pedidos

**Responsabilidad:** Todo el ciclo de vida del pedido: desde la creación hasta que se convierte
en una Venta.

**Archivos:** `pedidos/`

**Qué hace:**
- Crear pedido con validación por canal (mesa libre, referencia externa única, dirección válida)
- Agregar, modificar y cancelar ítems
- Cambiar estado del pedido
- Verificar idempotencia antes de crear

**Qué llama:**
- `core/db.php` — acceso a base de datos
- `core/auth.php` — verificar sesión y rol
- `core/audit.php` — registrar cambios
- `mesas/mesas.php` (función interna) — cambiar estado de la mesa

**No llama a:** ventas, pagos, DTE

**Regla:** El módulo de Pedidos nunca toca la tabla `ventas` ni `dte_documentos`.

---

### 2. Módulo Ventas

**Responsabilidad:** Crear el registro inmutable de cada transacción completada.

**Archivos:** `ventas/`

**Qué hace:**
- Recibir los ítems del pedido y construir el snapshot fiscal (precio_sin_iva, iva_unitario)
- Calcular subtotal_sin_iva, iva, total de la venta
- Asignar numero_ticket (correlativo)
- Crear venta y venta_items en una transacción atómica
- Marcar el pedido como PAGADO al completar

**Qué llama:**
- `core/db.php`
- `core/auth.php`
- `core/audit.php`
- `pagos/pagos.php` (función interna) — registrar los pagos en la misma transacción

**No llama a:** DTE (el DTE se dispara desde el endpoint de caja después del commit)

**Regla:** Una vez creada, la Venta no se modifica. Solo puede anularse (cambio de estado).

---

### 3. Módulo Pagos

**Responsabilidad:** Registrar cómo se pagó cada venta.

**Archivos:** `pagos/`

**Qué hace:**
- Crear uno o más registros de pago para una venta
- Validar que la suma de pagos iguale el total de la venta
- Registrar la referencia del voucher (tarjeta) o número de transferencia

**Qué llama:**
- `core/db.php`

**No llama a:** ventas (recibe venta_id como parámetro), DTE, Firmador

**Regla:** Los pagos son inmutables después de creados.

---

### 4. Módulo Clientes

**Responsabilidad:** Catálogo de clientes y sus direcciones de entrega.

**Archivos:** `clientes/`

**Qué hace:**
- CRUD de clientes (nombre, NIT, NRC, email, teléfono)
- CRUD de direcciones de entrega asociadas a clientes
- Búsqueda por NIT, NRC, nombre

**Qué llama:**
- `core/db.php`
- `core/auth.php`

**Lo usan:** Módulo Pedidos (para DELIVERY_PROPIO), Módulo Ventas (para el receptor del DTE)

---

### 5. Módulo DTE

**Responsabilidad:** Construcción, validación, firma, transmisión y seguimiento de cada
Documento Tributario Electrónico.

**Archivos:** `dte/`

**Qué hace:**
- Orquestar el flujo completo: generar → validar → firmar → transmitir
- Guardar cada estado del documento en `dte_documentos`
- Registrar cada intento en `dte_intentos`
- Gestionar reintentos con backoff
- Asignar `codigo_generacion` (UUID v4) y `numero_control` (correlativo atómico)

**Qué llama:**
- `ventas/ventas_helpers.php` — leer el snapshot de la venta
- `configuracion/config_fiscal.php` — datos del emisor
- `dte/dte_correlativos.php` — obtener el siguiente correlativo de forma atómica
- `firmador/firmador_client.php` — enviar al Firmador Docker
- `mh/mh_client.php` — transmitir al API del MH
- `core/audit.php`

**No llama a:** Pedidos, Pagos directamente (los lee desde Venta)

**Regla:** El módulo DTE nunca genera el DTE antes del commit de la Venta.

---

### 6. Módulo Configuración Fiscal

**Responsabilidad:** Datos del emisor que alimentan el campo `emisor` de todos los DTEs.

**Archivos:** `configuracion/config_fiscal.php`

**Qué hace:**
- Leer y actualizar NIT, NRC, nombre, establecimiento, punto de venta, dirección, ambiente
- Validar formato de NIT y NRC antes de guardar
- Solo accesible por rol `admin`

**Lo usan:** Módulo DTE (leyendo el emisor activo)

**Regla:** Los cambios de NIT o ambiente se registran en auditoría con el valor anterior.

---

### 7. Módulo Firmador

**Responsabilidad:** Comunicación con el Firmador Docker del MH de El Salvador.

**Archivos:** `firmador/firmador_client.php`

**Qué hace:**
- POST al endpoint `/firmardocumento/` del Firmador
- Parsear la respuesta y extraer el JSON firmado
- Manejar timeout: si el Firmador no responde en N segundos, lanzar excepción
- No reintenta aquí; el reintento lo gestiona el módulo DTE

**Body que envía al Firmador:**
```
{
  "nit": "...",         (del emisor)
  "activo": true,
  "passwordPri": "...", (de variable de entorno, NUNCA de la DB)
  "dteJson": "..."      (el JSON sin firma como string escapado)
}
```

**Secretos:** `passwordPri` se lee únicamente desde una variable de entorno del servidor.
No se guarda en la DB ni en el repositorio.

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Formato exacto de la respuesta del Firmador
para confirmar el campo que contiene el JSON firmado.

---

### 8. Módulo Cliente MH

**Responsabilidad:** Comunicación con el API del Ministerio de Hacienda de El Salvador.

**Archivos:** `mh/mh_client.php`

**Qué hace:**
- POST al endpoint de recepción del MH con el JSON firmado
- Parsear la respuesta: `selloRecibido`, `estado`, `descripcionMsg`, `observaciones`
- Manejar los códigos de respuesta del MH:
  - Aceptado → retornar sello
  - Rechazado → retornar código de error + descripción
  - Error temporal (5xx, timeout) → lanzar excepción para reintento
- No reintenta aquí; el reintento lo gestiona el módulo DTE

**Autenticación con el MH:**
PENDIENTE DE VALIDAR CON FUENTE OFICIAL — el Manual Técnico del MH define si se requiere
token, certificado cliente, o header específico para la autenticación.

**URL del MH:**
- Prueba: PENDIENTE DE CONFIRMAR desde el Manual Técnico vigente
- Producción: PENDIENTE DE CONFIRMAR desde el Manual Técnico vigente

---

### 9. Módulo Auditoría

**Responsabilidad:** Registro inmutable de acciones críticas de negocio.

**Archivos:** `core/audit.php`

**Qué registra:**
- Login y logout
- Creación y anulación de ventas
- Emisión de DTEs (cada intento)
- Cambios de precios en menú
- Cambios en configuración fiscal
- Creación, modificación y desactivación de usuarios
- Cancelaciones de pedido

**Qué NO registra:** Lectura de datos (GET requests), cambios en costeo, gestión de inventario
sin impacto en ventas.

**Regla:** La tabla `auditoria` nunca se modifica ni elimina registros. Solo INSERT.

---

## Flujo de llamadas en el cobro (sin microservicios)

```
React (POS/Caja)
  └─► POST /api/caja/cobrar.php
        │
        ├─ [1] Validar sesión y rol (auth.php)
        ├─ [2] Leer pedido y sus ítems (pedidos.php interno)
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
        ├─ [15] UPDATE dte_documentos (estado = ACEPTADO, sello_mh)
        │
        └─ Responder a React: { ok: true, numero_control, sello }
```

Pasos 9-15 ocurren después del COMMIT. Si fallan, la venta ya está guardada y el DTE
se puede reintentar sin re-cobrar.

---

## Dependencias entre módulos (dirección de llamadas)

```
caja/cobrar.php
  └─► pedidos (leer)
  └─► ventas (crear)
       └─► pagos (crear)
       └─► mesas (liberar, si aplica)
  └─► dte
       └─► config_fiscal (leer emisor)
       └─► dte_correlativos (asignar numero_control)
       └─► firmador_client (firmar)
       └─► mh_client (transmitir)
  └─► audit (registrar)
```

---

## Qué NO existe en esta arquitectura

| Patrón excluido | Razón |
|---|---|
| Microservicios | Hostinger no soporta múltiples servicios con orquestación |
| Bus de eventos / Kafka | Sobrecarga innecesaria para el volumen de Zensoci |
| Node.js | El stack es PHP; no agregar nuevos runtimes |
| Redis / colas | Hostinger shared no ofrece Redis; los reintentos son síncronos o via cron |
| Laravel / Symfony | El patrón existente es PHP puro; no migrar |
| ORM | Consultas SQL directas con PDO preparado |
| WebSockets | El KDS usa polling HTTP; suficiente para este volumen |
| JWT | PHP sessions con cookies; ya funciona en producción |

---

## Consideraciones de Hostinger

| Restricción | Mitigación |
|---|---|
| Sin Docker en shared hosting | El Firmador se despliega en otro servidor; PHP llama vía HTTP |
| PHP sessions | Válidas; no cambiar a JWT hasta que surja necesidad real |
| DECIMAL en MySQL | Usar `DECIMAL(10,2)` para montos, `DECIMAL(10,4)` para precios unitarios |
| `random_bytes()` en PHP | Disponible desde PHP 7.0; verificar versión en Hostinger |
| cURL disponible | Necesario para Firmador y MH; generalmente disponible en Hostinger |
| Cron jobs | Hostinger permite cron jobs; usar para reintentos de DTE en cola |
