# 04 — Estados, Idempotencia y Reintentos del DTE

Definición formal de los estados del DTE, sus transiciones, y las estrategias de
idempotencia y reintentos para todos los niveles del sistema.

---

## Parte 1: Máquina de Estados del DTE

### Estados del DTE

| Estado | Código | Descripción |
|---|---|---|
| `pendiente_generacion` | 0 | Registro creado en DB, JSON aún no construido |
| `generado` | 1 | JSON del DTE construido exitosamente |
| `validado` | 2 | JSON validado contra el JSON Schema oficial del MH |
| `error_validacion` | 3 | La validación contra el JSON Schema falló |
| `pendiente_firma` | 4 | Esperando respuesta del Firmador Docker |
| `firmado` | 5 | El Firmador devolvió el JSON firmado exitosamente |
| `error_firma` | 6 | El Firmador no respondió o devolvió error |
| `pendiente_transmision` | 7 | JSON firmado listo para enviar al MH |
| `transmitiendo` | 8 | POST al MH realizado, esperando respuesta |
| `aceptado` | 9 | El MH devolvió `selloRecibido` válido |
| `rechazado` | 10 | El MH rechazó el documento |
| `error_temporal` | 11 | Timeout o error 5xx del MH |
| `anulado` | 12 | El DTE fue anulado mediante una Nota de Crédito aceptada |

---

### Diagrama de transiciones

```
                ┌─────────────────────────────────────────────┐
                │    INICIO: al crear registro en DB           │
                │    post-COMMIT de Venta                      │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                           [pendiente_generacion]
                                       │
                      ┌──── éxito ─────┤
                      │                │
                      ▼                ▼ error PHP → queda en pendiente_generacion
                 [generado]
                      │
                 [validado] ◄── éxito
                      │
                      │ error de schema
                      ▼
             [error_validacion] ──────────────────► FIN (requiere fix de código)

                 [validado]
                      │
                      ▼
             [pendiente_firma]
                      │
         ┌── éxito ───┤
         │            │── error / timeout
         ▼            ▼
     [firmado]   [error_firma]
         │            │
         │            │── reintento ──────────────► [pendiente_firma]
         │
         ▼
[pendiente_transmision]
         │
         ▼
   [transmitiendo]
         │
         ├── MH acepta ─────────────────────────► [aceptado]
         │                                             │
         │                                   NC emitida y aceptada
         │                                             ▼
         │                                        [anulado]
         │
         ├── MH rechaza ────────────────────────► [rechazado]
         │
         └── timeout / 5xx ───────────────────► [error_temporal]
                                                      │
                                     reintento ──────►[pendiente_transmision]
```

---

### Transiciones válidas

| Estado actual | Evento | Estado siguiente |
|---|---|---|
| `pendiente_generacion` | JSON construido | `generado` |
| `generado` | JSON validado contra Schema | `validado` |
| `generado` | JSON inválido contra Schema | `error_validacion` |
| `validado` | Iniciando llamada al Firmador | `pendiente_firma` |
| `pendiente_firma` | Firmador devuelve JSON firmado | `firmado` |
| `pendiente_firma` | Firmador timeout o error | `error_firma` |
| `error_firma` | Reintento iniciado | `pendiente_firma` |
| `firmado` | Iniciando transmisión al MH | `pendiente_transmision` |
| `pendiente_transmision` | POST al MH enviado | `transmitiendo` |
| `transmitiendo` | MH devuelve sello | `aceptado` |
| `transmitiendo` | MH devuelve rechazo | `rechazado` |
| `transmitiendo` | Timeout o error 5xx | `error_temporal` |
| `error_temporal` | Reintento iniciado | `pendiente_transmision` |
| `aceptado` | NC emitida y aceptada | `anulado` |

---

### Transiciones prohibidas

| Transición prohibida | Razón |
|---|---|
| Cualquier estado → `pendiente_generacion` | Estado inicial único |
| `aceptado` → cualquier otro (excepto `anulado`) | Un DTE aceptado es inmutable |
| `rechazado` → `aceptado` | Un rechazo no se puede revertir; emitir nuevo DTE |
| `anulado` → cualquier otro | Estado terminal |
| `error_validacion` → cualquier otro | Saltarse la validación está prohibido |
| `firmado` → `generado` | Retroceder en el flujo está prohibido |

---

### Estados terminales

| Estado | Descripción |
|---|---|
| `aceptado` | Éxito. Solo puede moverse a `anulado` mediante NC |
| `rechazado` | Falla definitiva. El MH no aceptará reenvíos del mismo documento |
| `anulado` | El DTE fue reemplazado por una Nota de Crédito |
| `error_validacion` | Falla de programación. Requiere corrección de código |

---

### Estados reintentables

| Estado | Reintentable | Quién reintenta | Reinicia desde |
|---|---|---|---|
| `error_firma` | Sí | Manual (botón) o cron automático | `pendiente_firma` |
| `error_temporal` | Sí | Automático (backoff) o manual | `pendiente_transmision` |
| `rechazado` | No automático | Solo el operador puede emitir nuevo DTE | — |
| `error_validacion` | No | Requiere fix de código | — |

---

### Políticas de reintento

**Para `error_firma`:**

| Intento | Espera |
|---|---|
| 1 | Inmediato |
| 2 | 30 segundos |
| 3 | 2 minutos |
| 4 | 10 minutos |
| 5+ | Manual |

Después de 5 intentos, el DTE permanece en `error_firma` y requiere intervención manual.

**Para `error_temporal`:**

| Intento | Espera |
|---|---|
| 1 | 1 minuto |
| 2 | 5 minutos |
| 3 | 15 minutos |
| 4 | 1 hora |
| 5+ | Cron nocturno |

Si el MH sigue sin responder, el operador puede activar el modo Contingencia manualmente.

---

### Registro de cambios de estado en DB

Cada transición genera dos registros:
1. `UPDATE dte_documentos SET estado = nuevo_estado`
2. `INSERT INTO dte_eventos_estado` — historial inmutable

Esto permite reconstruir el ciclo de vida completo de cualquier DTE.

---

### Estados huérfanos

Ocurren cuando el servidor cae después del COMMIT de la Venta pero antes de completar el DTE.

**Detección:** Cron cada N minutos busca DTEs con `updated_at < NOW() - INTERVAL 5 MINUTE`
en estados: `pendiente_generacion`, `pendiente_firma`, `pendiente_transmision`, `transmitiendo`.

**Acciones de recuperación:**

| Estado huérfano | Acción |
|---|---|
| `pendiente_generacion` | Reiniciar la generación del JSON |
| `pendiente_firma` | Verificar si el Firmador tiene el DTE; si no, reiniciar desde firma |
| `pendiente_transmision` | Reintentar transmisión al MH |
| `transmitiendo` | Consultar estado en el MH por `codigo_generacion`; si no se encontró, retransmitir |

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si el API del MH provee endpoint de consulta
de estado por `codigo_generacion`.

---

## Parte 2: Idempotencia por nivel

### Por qué la idempotencia es crítica

| Escenario | Sin idempotencia | Con idempotencia |
|---|---|---|
| PedidosYa envía el mismo pedido dos veces | 2 pedidos → 2 ventas → 2 DTEs | 1 pedido; el segundo se devuelve con 409 |
| El cajero hace doble clic en "Cobrar" | 2 ventas para el mismo pedido | 1 venta; la segunda es rechazada |
| El botón "Emitir DTE" se presiona dos veces | 2 DTEs para la misma venta | 1 DTE; el segundo no se crea |
| El servidor cae post-COMMIT y el cliente reintenta | 2 ventas | 1 venta; el reintento reutiliza la existente |
| El cron de reintentos se ejecuta en paralelo | 2 firmas al Firmador | 1 firma; el segundo se bloquea |

---

### Nivel 1: Pedidos externos (PLATAFORMA_EXTERNA)

**Clave:** `(plataforma, referencia_externa)`

**Mecanismo:** Antes de crear el pedido, buscar si ya existe. Si existe: devolver
`{ ok: true, pedido_id: X, duplicado: true }`. No lanzar error — PedidosYa reenvía
notificaciones si no recibió confirmación.

**Defensa en DB:** `UNIQUE (plataforma, referencia_externa)` — última línea de defensa.

---

### Nivel 2: Pedidos de mesa (MESA)

**Clave:** La mesa debe estar en estado `LIBRE` para abrir un pedido.

**Mecanismo:** `SELECT estado FROM mesas WHERE id = ? FOR UPDATE` (bloqueo pesimista).
Si estado ≠ `LIBRE`: error "La mesa ya tiene un pedido activo".
Si `LIBRE`: cambiar a `OCUPADA` y crear el pedido en la misma transacción.

---

### Nivel 3: Pedidos presenciales (PICKUP / DELIVERY_PROPIO)

**Clave:** `uuid_idempotencia` generado por React antes de enviar.

**Mecanismo:** React genera un UUID al abrir el formulario. PHP busca ese UUID antes de
crear el pedido. Si ya existe: devolver el pedido existente.

---

### Nivel 4: Ventas

**Clave:** `pedido_id`

Un pedido genera exactamente una venta. `ventas` tiene restricción `UNIQUE (pedido_id)`.

```
BEGIN TRANSACTION
  SELECT id FROM ventas WHERE pedido_id = ? FOR UPDATE
  IF encontrado: ROLLBACK, retornar venta existente con { duplicado: true }
  IF no encontrado: INSERT ventas, INSERT venta_items, INSERT pagos
COMMIT
```

---

### Nivel 5: DTE

**Clave:** `venta_id`

`dte_documentos` tiene restricción `UNIQUE (venta_id)`.

Al iniciar la emisión:
1. Si DTE existe con estado `aceptado`: devolver el DTE existente
2. Si DTE existe con estado `firmado` o `pendiente_transmision`: continuar desde transmisión
3. Si DTE existe con estado `error_firma` o `error_temporal`: reintentar desde el estado correcto
4. Si no existe: crear nuevo registro y comenzar el flujo

**`codigo_generacion` (UUID v4):** Asignado al momento de creación del registro. Nunca cambia,
incluso en reintentos. Es la identidad del documento ante el MH.

**`numero_control`:** Se asigna al construir el JSON (`pendiente_generacion → generado`).
Si el DTE falla antes de asignarse, el correlativo no se asigna hasta un reintento desde
`pendiente_generacion`.

---

### Nivel 6: Correlativo atómico

**Mecanismo:** `SELECT ... FOR UPDATE` para evitar race conditions:

```
BEGIN TRANSACTION
  SELECT ultimo_correlativo FROM dte_correlativos
  WHERE tipo_dte = ? AND cod_establecimiento = ? AND cod_punto_venta = ?
  FOR UPDATE

  nuevo_correlativo = ultimo_correlativo + 1
  UPDATE dte_correlativos SET ultimo_correlativo = nuevo_correlativo
COMMIT
```

El segundo proceso concurrente espera hasta que el primero haga COMMIT.

Los huecos en el correlativo son aceptables si un DTE falla después de ser asignado.

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si el MH tiene límites sobre huecos en el correlativo.

---

### Nivel 7: Prevención de transmisión duplicada al MH

**Riesgo:** El MH recibe el mismo `codigo_generacion` dos veces si el backend reintenta
después de un timeout donde el MH sí procesó el documento.

**Manejo:** Si el MH responde con "documento ya aceptado", actualizar el estado a `aceptado`
y guardar el sello. No tratar como error.

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** El código de error específico que devuelve
el MH cuando recibe un `codigo_generacion` ya procesado.

---

### Resumen de claves idempotentes

| Nivel | Entidad | Clave | Mecanismo |
|---|---|---|---|
| Pedido externo | `pedidos` | `(plataforma, referencia_externa)` | UNIQUE en DB + SELECT antes de INSERT |
| Pedido presencial | `pedidos` | `uuid_idempotencia` | UNIQUE en DB |
| Mesa | `mesas` | `(mesa_id, estado=LIBRE)` | SELECT FOR UPDATE |
| Venta | `ventas` | `pedido_id` | UNIQUE en DB + SELECT FOR UPDATE |
| DTE | `dte_documentos` | `venta_id` | UNIQUE en DB |
| DTE en MH | DTE externo | `codigo_generacion` (UUID v4) | El MH lo detecta; el backend maneja la respuesta |
| Correlativo | `dte_correlativos` | `(tipo_dte, cod_establecimiento, cod_punto_venta)` | SELECT FOR UPDATE |

---

## Recuperación después de caída del servidor

**Escenario:** El servidor cae después del COMMIT de la Venta pero antes de completar el DTE.

**Al reiniciar:** Cron job de recuperación ejecuta cada 5 minutos:

```sql
SELECT id FROM dte_documentos
WHERE estado IN ('pendiente_generacion', 'pendiente_firma',
                 'pendiente_transmision', 'transmitiendo')
AND updated_at < NOW() - INTERVAL 5 MINUTE
```

Para cada DTE encontrado, se aplica la acción de recuperación según su estado.
Cada intento se registra en `dte_intentos` con `resultado = 'recuperacion_automatica'`.

**Escenario:** La DB cae después de que el MH aceptó el DTE pero antes de guardar el sello.

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Disponibilidad de endpoint de consulta por
`codigo_generacion` en el API del MH para recuperar el sello.
