# 11 — Máquina de Estados del DTE

Definición formal de todos los estados posibles de un Documento Tributario Electrónico,
sus transiciones válidas, sus transiciones prohibidas y las acciones que las disparan.

---

## Estados del DTE

| Estado | Código | Descripción |
|---|---|---|
| `pendiente_generacion` | 0 | El registro fue creado en DB pero el JSON aún no se construyó |
| `generado` | 1 | El JSON del DTE fue construido exitosamente |
| `validado` | 2 | El JSON fue validado contra el JSON Schema oficial del MH |
| `error_validacion` | 3 | La validación contra el JSON Schema falló |
| `pendiente_firma` | 4 | Esperando respuesta del Firmador Docker |
| `firmado` | 5 | El Firmador devolvió el JSON firmado exitosamente |
| `error_firma` | 6 | El Firmador no respondió o devolvió error |
| `pendiente_transmision` | 7 | El JSON firmado está listo para enviar al MH |
| `transmitiendo` | 8 | Se realizó el POST al MH, esperando respuesta |
| `aceptado` | 9 | El MH devolvió `selloRecibido` válido |
| `rechazado` | 10 | El MH rechazó el documento (error en el JSON o datos fiscales) |
| `error_temporal` | 11 | El MH no respondió (timeout) o devolvió error 5xx |
| `anulado` | 12 | El DTE fue anulado mediante una Nota de Crédito aceptada |

---

## Diagrama de transiciones

```
                   ┌─────────────────────────────────────────────────────┐
                   │                  INICIO                             │
                   │   (al crear el registro en DB post-COMMIT de Venta) │
                   └──────────────────────┬──────────────────────────────┘
                                          │
                                          ▼
                              [pendiente_generacion]
                                          │
                       ┌──── éxito ───────┤
                       │                 │
                       ▼                 ▼ error de programación
                  [generado]        (bug en el builder → no es estado DB;
                       │             el error es una excepción PHP,
                       │             el estado queda en pendiente_generacion)
                       │
                  [validado] ◄─── éxito
                       │
                       │ error de schema
                       ▼
              [error_validacion] ─────────────────────► FIN (requiere fix de código)
                                 no reintentable sin
                                 corrección del builder

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
          │            │── reintento manual o automático
          │            └──────────────────────────────► [pendiente_firma]
          │
          ▼
 [pendiente_transmision]
          │
          ▼
    [transmitiendo]
          │
          ├── MH acepta ──────────────────────────────► [aceptado]
          │                                                   │
          ├── MH rechaza ─────────────────────────────► [rechazado]   ── NC emitida → [anulado]
          │                                                   │
          └── timeout / 5xx ──────────────────────────► [error_temporal]
                                                             │
                                        reintento (backoff) ├──► [pendiente_transmision]
                                        contingencia activa └──► ver flujo contingencia
```

---

## Tabla de transiciones válidas

| Estado actual | Evento que dispara | Estado siguiente |
|---|---|---|
| `pendiente_generacion` | JSON construido exitosamente | `generado` |
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
| `transmitiendo` | Timeout o error 5xx del MH | `error_temporal` |
| `error_temporal` | Reintento iniciado (backoff) | `pendiente_transmision` |
| `aceptado` | NC emitida y aceptada por el MH | `anulado` |

---

## Transiciones prohibidas

Las siguientes transiciones nunca deben ocurrir. El código debe lanzar una excepción si se intenta:

| Transición prohibida | Razón |
|---|---|
| Cualquier estado → `pendiente_generacion` | Estado inicial único |
| `aceptado` → cualquier otro (excepto `anulado`) | Un DTE aceptado es inmutable |
| `rechazado` → `aceptado` | Un rechazo no se puede revertir; emitir nuevo DTE |
| `anulado` → cualquier otro | Estado terminal |
| `error_validacion` → `firmado` o cualquier otro | Saltarse la validación está prohibido |
| `firmado` → `generado` | Retroceder en el flujo está prohibido |
| Saltar `pendiente_firma` → ir directo a `firmado` sin pasar por el Firmador | |

---

## Estados terminales

Los siguientes estados son terminales (no aceptan más transiciones automáticas):

| Estado terminal | Descripción |
|---|---|
| `aceptado` | Éxito. Solo puede moverse a `anulado` mediante NC |
| `rechazado` | Falla definitiva. El MH no aceptará reenvíos del mismo documento |
| `anulado` | El DTE fue reemplazado por una Nota de Crédito |
| `error_validacion` | Falla de programación. Requiere corrección de código y nuevo DTE |

---

## Estados reintentables

| Estado | Reintentable | Quién puede reintentar | Desde qué estado reinicia |
|---|---|---|---|
| `error_firma` | Sí | Manual (botón) o cron automático | `pendiente_firma` |
| `error_temporal` | Sí | Automático (backoff) o manual | `pendiente_transmision` |
| `rechazado` | No automático | Solo el operador puede revisar y emitir nuevo DTE | — |
| `error_validacion` | No | Requiere fix de código | — |

---

## Política de reintentos para `error_firma`

```
Intento 1: inmediato
Intento 2: después de 30 segundos
Intento 3: después de 2 minutos
Intento 4: después de 10 minutos
Intento 5+: manual (no más reintentos automáticos)
```

Después de 5 intentos fallidos, el DTE permanece en `error_firma` y requiere
intervención manual o verificación del Firmador Docker.

---

## Política de reintentos para `error_temporal`

```
Intento 1: después de 1 minuto
Intento 2: después de 5 minutos
Intento 3: después de 15 minutos
Intento 4: después de 1 hora
Intento 5+: cron nocturno (una vez por noche)
```

Si después de los reintentos automáticos el MH sigue sin responder, el operador puede
activar el modo Contingencia manualmente.

---

## Estado del DTE en contingencia

Cuando el sistema está en modo contingencia, los DTEs se emiten con `tipo_transmision = 2`.
Su flujo de estados es el mismo, pero después de ser firmados van a una cola de
retransmisión en lugar de transmitirse inmediatamente.

```
[pendiente_generacion]
    → [generado]
    → [validado]
    → [pendiente_firma]
    → [firmado]
    → [pendiente_transmision] ← DTEs en cola de contingencia esperan aquí
    → [transmitiendo]
    → [aceptado] / [rechazado] / [error_temporal]
```

---

## Registro de estados en DB

Cada transición de estado genera dos registros:

1. `UPDATE dte_documentos SET estado = nuevo_estado` — el estado actual
2. `INSERT INTO dte_eventos_estado` — el historial inmutable

Esto permite reconstruir el ciclo de vida completo de cualquier DTE en cualquier momento.

---

## Manejo de estados huérfanos

Un estado huérfano ocurre cuando el servidor cae después de hacer el COMMIT de la venta
pero antes de completar el DTE.

**Detección:** Al iniciar el servidor (o vía cron cada N minutos), buscar DTEs con
`estado IN ('pendiente_generacion', 'pendiente_firma', 'pendiente_transmision', 'transmitiendo')`
y `updated_at < NOW() - INTERVAL 5 MINUTE`.

**Acción por estado:**

| Estado huérfano | Acción de recuperación |
|---|---|
| `pendiente_generacion` | Reiniciar la generación del JSON |
| `pendiente_firma` | Verificar si el Firmador tiene el DTE; si no, reiniciar desde firma |
| `pendiente_transmision` | Reintentar transmisión al MH |
| `transmitiendo` | Consultar estado en el MH por `codigo_generacion`; si no se encontró, retransmitir |

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si el API del MH provee un endpoint de consulta
de estado por `codigo_generacion` para resolver el caso `transmitiendo` huérfano.
