# 12 — Idempotencia y Reintentos

Este documento define las estrategias para prevenir duplicados en todos los niveles del sistema:
pedidos, ventas, DTEs. Y define cómo se reintentan los procesos que fallan parcialmente.

---

## Por qué la idempotencia es crítica

Sin idempotencia, los siguientes escenarios pueden generar datos duplicados:

| Escenario | Sin idempotencia | Con idempotencia |
|---|---|---|
| PedidosYa envía el mismo pedido dos veces | 2 pedidos → 2 ventas → 2 DTEs | 1 pedido; el segundo es rechazado con 409 |
| El cajero hace doble clic en "Cobrar" | 2 ventas para el mismo pedido | 1 venta; la segunda es rechazada |
| El botón "Emitir DTE" se presiona dos veces | 2 DTEs para la misma venta | 1 DTE; el segundo no se crea |
| El servidor cae después del COMMIT y el cliente reintenta | 2 ventas | 1 venta; el reintento reutiliza la existente |
| El cron de reintentos se ejecuta dos veces en paralelo | 2 firmas enviadas al Firmador | 1 firma; el segundo intento se bloquea |

---

## Nivel 1: Idempotencia de pedidos por canal

### Canal: PLATAFORMA_EXTERNA

**Clave idempotente:** `(plataforma, referencia_externa)`

**Mecanismo:**
1. Antes de crear el pedido, hacer `SELECT id FROM pedidos WHERE plataforma = ? AND referencia_externa = ?`
2. Si ya existe: devolver `{ ok: true, pedido_id: X, duplicado: true }` — no lanzar error
3. Si no existe: crear el pedido

**Razón para no lanzar error:** PedidosYa puede reenviar la notificación si no recibió confirmación.
Devolver 200 con `duplicado: true` es correcto y no confunde a la plataforma.

**Índice requerido:** `UNIQUE (plataforma, referencia_externa)` en la tabla `pedidos`
(para que la DB sea la última línea de defensa, no solo PHP)

### Canal: MESA

**Clave idempotente:** El mesero no puede abrir dos pedidos para la misma mesa al mismo tiempo.
La mesa debe estar en estado `LIBRE` para abrir un pedido.

**Mecanismo:**
1. `SELECT estado FROM mesas WHERE id = ? FOR UPDATE` (bloqueo pesimista)
2. Si estado ≠ `LIBRE`: devolver error "La mesa ya tiene un pedido activo"
3. Si estado = `LIBRE`: cambiar a `OCUPADA` y crear el pedido en la misma transacción

### Canal: PICKUP / DELIVERY_PROPIO

**Clave idempotente:** `uuid_idempotencia` generado por el cliente (React) antes de enviar.

**Mecanismo:**
1. React genera un UUID al abrir el formulario de nuevo pedido
2. Al enviar, incluye ese UUID en el body del POST
3. PHP hace `SELECT id FROM pedidos WHERE uuid_idempotencia = ?` antes de crear
4. Si ya existe: devolver el pedido existente
5. Si no: crear con ese UUID

**Nota:** El UUID de idempotencia no es el mismo que el `codigo_generacion` del DTE.

---

## Nivel 2: Idempotencia de ventas

**Clave idempotente:** `pedido_id`

Un pedido genera exactamente una venta. La tabla `ventas` tiene una restricción `UNIQUE (pedido_id)`.

**Mecanismo:**
1. Antes de insertar la venta, verificar: `SELECT id FROM ventas WHERE pedido_id = ?`
2. Si ya existe: el pedido ya fue cobrado. Devolver la venta existente y el DTE asociado.
3. Si no existe: proceder con la inserción

**¿Qué pasa si el cajero hace doble clic?**

La segunda petición encuentra la venta ya creada gracias a la restricción UNIQUE de la DB.
El backend devuelve `{ ok: true, venta_id: X, duplicado: true }` y no cobra dos veces.

**En el endpoint PHP:**
```
BEGIN TRANSACTION
  SELECT id FROM ventas WHERE pedido_id = ? FOR UPDATE
  IF encontrado: ROLLBACK, retornar venta existente
  IF no encontrado: INSERT ventas, INSERT venta_items, INSERT pagos
COMMIT
```

---

## Nivel 3: Idempotencia del DTE

**Clave idempotente:** `venta_id`

Una venta tiene exactamente un DTE activo. La tabla `dte_documentos` tiene restricción
`UNIQUE (venta_id)`.

**Mecanismo:**
1. Al iniciar la emisión del DTE, verificar: `SELECT id, estado FROM dte_documentos WHERE venta_id = ?`
2. Si ya existe con estado `aceptado`: devolver el DTE existente (no emitir de nuevo)
3. Si ya existe con estado `firmado` o `pendiente_transmision`: continuar desde la transmisión
4. Si ya existe con estado `error_firma` o `error_temporal`: reintentar desde el estado correcto
5. Si no existe: crear nuevo registro y comenzar el flujo

**`codigo_generacion` (UUID v4):**

Cada DTE tiene un UUID único asignado al momento de creación del registro en `dte_documentos`.
Este UUID nunca cambia, incluso si el DTE se reintenta. El UUID es la identidad del documento ante el MH.

**`numero_control`:**

El correlativo se asigna al momento de construir el JSON del DTE (`estado → generado`).
Si el DTE va a un estado de error antes de ser asignado, el correlativo NO se asigna
hasta que el DTE vuelva a estado `pendiente_generacion` para reintentarse.

**¿Qué pasa si el MH recibe el mismo DTE dos veces (mismo `codigo_generacion`)?**

El MH usa el `codigo_generacion` para detectar duplicados. Si ya aceptó ese UUID, lo rechazará
como duplicado en el segundo envío. El backend debe manejar ese rechazo como "ya aceptado"
en lugar de error.

---

## Nivel 4: Correlativo atómico

El `numero_control` del DTE requiere un correlativo secuencial sin huecos (o con huecos
mínimos) y sin duplicados. Bajo carga concurrente, dos requests pueden intentar obtener
el mismo correlativo.

**Solución: SELECT FOR UPDATE**

```
BEGIN TRANSACTION
  SELECT ultimo_correlativo FROM dte_correlativos
  WHERE tipo_dte = ? AND cod_establecimiento = ? AND cod_punto_venta = ?
  FOR UPDATE  ← bloquea la fila para otros procesos

  nuevo_correlativo = ultimo_correlativo + 1
  
  UPDATE dte_correlativos SET ultimo_correlativo = nuevo_correlativo
  WHERE tipo_dte = ? AND cod_establecimiento = ? AND cod_punto_venta = ?
COMMIT
```

El bloqueo FOR UPDATE garantiza que dos procesos concurrentes no obtengan el mismo número.
El segundo proceso espera hasta que el primero haga COMMIT.

**Huecos en el correlativo:**

Si un DTE es asignado un correlativo pero luego el proceso falla sin emitirse, ese número
queda "gastado". Los huecos en el correlativo son aceptables en los sistemas DTE del MH.

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si el MH tiene límites sobre la cantidad de
huecos permitidos en el correlativo.

---

## Nivel 5: Prevención de firma duplicada

El Firmador puede recibir el mismo JSON dos veces si el proceso se reinicia.

**Riesgo:** El Firmador podría devolver dos respuestas para el mismo documento, y ambas
serían válidas (la firma digital no cambia para el mismo JSON).

**Mecanismo de protección:**

Antes de enviar al Firmador, verificar el estado actual del DTE en DB:
1. Si `estado = firmado`: no volver a llamar al Firmador, usar el `json_firmado` existente
2. Si `estado = pendiente_firma`: permitir la llamada al Firmador

El campo `json_firmado` en `dte_documentos` es inmutable una vez guardado.

---

## Nivel 6: Prevención de transmisión duplicada al MH

**Riesgo:** Si la llamada al MH tiene timeout pero el MH sí procesó el documento,
un reintento enviaría el mismo `codigo_generacion` al MH.

**Comportamiento esperado del MH al recibir un duplicado:**

El MH debería rechazarlo con un código que indique "documento ya procesado".

**Manejo en el backend:**

```
Si el MH responde con código "documento ya aceptado" (código a confirmar con MH):
  → Actualizar dte_documentos.sello_mh con el sello original (si lo devuelve el MH)
  → Cambiar estado a aceptado
  → No tratar como error

Si el MH responde con código de error distinto:
  → Cambiar estado a rechazado o error_temporal
```

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** El código de error específico que devuelve
el MH cuando recibe un `codigo_generacion` ya procesado.

---

## Resumen de claves idempotentes por nivel

| Nivel | Entidad | Clave idempotente | Mecanismo |
|---|---|---|---|
| Pedido externo | `pedidos` | `(plataforma, referencia_externa)` | UNIQUE en DB + SELECT antes de INSERT |
| Pedido presencial | `pedidos` | `uuid_idempotencia` (generado por React) | UNIQUE en DB |
| Mesa | `mesas` | `(mesa_id, estado=LIBRE)` | SELECT FOR UPDATE |
| Venta | `ventas` | `pedido_id` | UNIQUE en DB + SELECT FOR UPDATE |
| DTE | `dte_documentos` | `venta_id` | UNIQUE en DB |
| DTE en MH | DTE (externo) | `codigo_generacion` (UUID v4) | El MH lo detecta; el backend maneja la respuesta |
| Correlativo | `dte_correlativos` | `(tipo_dte, cod_establecimiento, cod_punto_venta)` | SELECT FOR UPDATE |

---

## Estrategia de reintentos por etapa

### Firma (error_firma)

| Intento | Espera antes de reintentar |
|---|---|
| 1 | Inmediato |
| 2 | 30 segundos |
| 3 | 2 minutos |
| 4 | 10 minutos |
| 5+ | Manual |

**Disparado por:** Botón "Reintentar" en la UI o cron job cada 5 minutos

### Transmisión (error_temporal)

| Intento | Espera antes de reintentar |
|---|---|
| 1 | 1 minuto |
| 2 | 5 minutos |
| 3 | 15 minutos |
| 4 | 1 hora |
| 5+ | Cron nocturno |

**Disparado por:** Cron job automático + botón "Reintentar" en la UI

---

## Recuperación después de caída del servidor

**Escenario:** El servidor cae después del COMMIT de la Venta pero antes de completar el DTE.

**Al reiniciar:**

1. Cron job de recuperación (ejecutar al iniciar el servidor o cada 5 minutos):
   ```
   SELECT id FROM dte_documentos
   WHERE estado IN ('pendiente_generacion', 'pendiente_firma',
                    'pendiente_transmision', 'transmitiendo')
   AND updated_at < NOW() - INTERVAL 5 MINUTE
   ```

2. Para cada DTE encontrado, aplicar la acción de recuperación según su estado (ver doc 11)

3. Registrar en `dte_intentos` que fue una recuperación automática

**Escenario:** La base de datos cae después de que el MH aceptó el DTE pero antes de guardar
el sello.

**Solución:** El MH puede ser consultado por `codigo_generacion` para obtener el sello
(consultar disponibilidad de este endpoint en el Manual Técnico del MH).

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Disponibilidad de endpoint de consulta por
`codigo_generacion` en el API del MH.
