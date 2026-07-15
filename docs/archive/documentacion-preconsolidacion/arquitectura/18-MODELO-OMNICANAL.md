# 18 — Modelo Omnicanal Zensoci

Zensoci opera hoy exclusivamente a través de PedidosYa y abrirá atención presencial próximamente.
Este documento define el modelo único que soporta todos los canales sin sistemas paralelos.

---

## Principio fundamental

**Un solo Pedido. Una sola Venta. Un solo DTE.**

El canal de origen no cambia la estructura de ninguna de estas entidades. Solo cambia qué campos
se populan y qué validaciones aplican.

---

## Las cuatro modalidades

| Código | Nombre | Descripción | Activa hoy |
|---|---|---|---|
| `MESA` | Atención en mesa | Cliente come en el local. Mesa asignada. | No (apertura futura) |
| `PICKUP` | Retiro en mostrador | Cliente ordena y retira en el local sin sentarse. | Futuro |
| `DELIVERY_PROPIO` | Delivery con motorista propio | Zensoci entrega con su propio personal. Dirección obligatoria. | Futuro |
| `PLATAFORMA_EXTERNA` | Canal externo (PedidosYa, etc.) | Pedido ingresa desde la plataforma. Referencia externa obligatoria. | **Activa** |

---

## Campo discriminador en Pedido

```
pedidos.canal  ENUM('MESA','PICKUP','DELIVERY_PROPIO','PLATAFORMA_EXTERNA')
```

Este es el único campo que diferencia los canales a nivel de datos.

---

## Campos comunes a todos los canales

Estos campos existen en todos los pedidos, independientemente del canal:

| Campo | Propósito |
|---|---|
| `id` | PK autoincrement |
| `uuid_idempotencia` | Previene duplicados (ver doc 12) |
| `canal` | Discriminador de modalidad |
| `estado` | Estado actual del pedido |
| `numero_pedido` | Correlativo diario por canal |
| `fecha` | Fecha del pedido |
| `hora_apertura` | Timestamp de creación |
| `hora_cierre` | Timestamp de cierre (nullable) |
| `usuario_id` | Quien registró el pedido |
| `notas_generales` | Instrucciones generales (nullable) |
| `subtotal_con_iva` | Total calculado de ítems |
| `created_at` | Timestamp inmutable |

---

## Campos opcionales por canal

| Campo | MESA | PICKUP | DELIVERY_PROPIO | PLATAFORMA_EXTERNA |
|---|---|---|---|---|
| `mesa_id` | **Requerido** | Null | Null | Null |
| `cliente_id` | Opcional | Opcional | **Requerido** | Opcional |
| `direccion_entrega_id` | Null | Null | **Requerido** | Null (la plataforma gestiona) |
| `referencia_externa` | Null | Null | Null | **Requerido** |
| `plataforma` | Null | Null | Null | **Requerido** (ej: `pedidosya`) |
| `comision_plataforma` | Null | Null | Null | Recomendado (ver sección) |
| `motorista_id` | Null | Null | Opcional | Null |
| `hora_estimada_entrega` | Null | Opcional | **Requerido** | Según plataforma |

---

## Reglas de validación por modalidad

### MESA
- `mesa_id` debe existir en la tabla `mesas`
- La mesa debe estar en estado `libre` al crear el pedido
- La mesa pasa a `ocupada` al crear el pedido
- La mesa pasa a `libre` cuando la venta se completa

### PICKUP
- No requiere mesa
- No requiere dirección
- No requiere referencia externa
- El cliente puede identificarse o no (consumidor final)

### DELIVERY_PROPIO
- `cliente_id` obligatorio (para conocer al receptor del DTE)
- `direccion_entrega_id` obligatorio (FK a `direcciones_entrega`)
- La dirección debe pertenecer al cliente registrado
- `hora_estimada_entrega` obligatorio para coordinar el motorista

### PLATAFORMA_EXTERNA
- `referencia_externa` obligatorio — es el ID de la orden en la plataforma (ej: ID de PedidosYa)
- `plataforma` obligatorio — identifica qué plataforma generó el pedido
- Idempotencia basada en `(plataforma, referencia_externa)` — ver doc 12
- La comisión de la plataforma se registra en `comision_plataforma` (DECIMAL)
- La comisión **no** entra en el cuerpo del DTE; es un dato de gestión interna
- El DTE refleja el valor total vendido al consumidor, no el neto recibido por Zensoci

---

## Cómo el DTE es siempre independiente del canal

La Venta se construye desde el snapshot de PedidoItems en el momento del cobro.
El DocumentoDTE se construye desde el snapshot de Venta y VentaItems.

**El motor de DTE nunca lee el canal.** Lee solo:
- `ventas.subtotal_sin_iva`
- `ventas.iva`
- `ventas.total`
- `venta_items[]`
- `pagos[]`
- `receptor` (del cliente o consumidor final)
- `emisor` (de `configuracion_fiscal`)

Esto garantiza que Venta y DTE no cambian cuando se agrega un canal nuevo.

---

## Cómo agregar un canal nuevo sin cambiar Venta ni DTE

Para agregar un canal nuevo (ej: `APP_MOVIL`, `WHATSAPP`, `KIOSKO`):

1. Agregar el valor al ENUM `pedidos.canal`
2. Agregar los campos opcionales propios de ese canal si son únicos
   (si ya existen en otro canal, reutilizarlos)
3. Definir las reglas de validación del nuevo canal en el módulo PHP de Pedidos
4. El módulo de Ventas no cambia
5. El módulo de DTE no cambia
6. El módulo de Pagos no cambia

---

## Comisión de plataformas externas

La comisión que cobra PedidosYa (u otras plataformas) no es un descuento fiscal.
Es un costo operativo de Zensoci.

**Lo que se factura al consumidor:** precio total del pedido (con IVA 13%)
**Lo que recibe Zensoci:** precio total menos la comisión de la plataforma

Esta diferencia NO se refleja en el DTE. El DTE refleja lo que el cliente pagó.

La comisión se registra en `pedidos.comision_plataforma` para:
- Reportes de rentabilidad por canal
- Conciliación con los pagos recibidos de la plataforma
- Análisis de costo-beneficio por canal

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si El Salvador requiere algún tratamiento
fiscal específico para las comisiones de plataformas digitales de entrega.

---

## Ejemplos por canal

### Ejemplo PLATAFORMA_EXTERNA (PedidosYa)
```
canal:               PLATAFORMA_EXTERNA
plataforma:          pedidosya
referencia_externa:  PY-2024-00123456
mesa_id:             null
cliente_id:          null  (consumidor final anónimo)
direccion_entrega_id: null  (PedidosYa gestiona la entrega)
comision_plataforma: 8.50  (comisión de la plataforma en USD)
```

### Ejemplo MESA (futuro)
```
canal:               MESA
mesa_id:             3
plataforma:          null
referencia_externa:  null
direccion_entrega_id: null
comision_plataforma: null
```

### Ejemplo PICKUP (futuro)
```
canal:               PICKUP
mesa_id:             null
plataforma:          null
referencia_externa:  null
cliente_id:          null
comision_plataforma: null
```

### Ejemplo DELIVERY_PROPIO (futuro)
```
canal:               DELIVERY_PROPIO
mesa_id:             null
cliente_id:          101
direccion_entrega_id: 45
motorista_id:        7
hora_estimada_entrega: 2024-09-15 19:30:00
comision_plataforma: null
```

---

## Diagrama de convergencia omnicanal

```
MESA          PICKUP     DELIVERY_PROPIO    PLATAFORMA_EXTERNA
  │               │              │                    │
  └───────────────┴──────────────┴────────────────────┘
                              │
                              ▼
                    [ pedidos + pedido_items ]
                              │
                              ▼
                    [ ventas + venta_items ]  ◄── snapshot fiscal
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
               [ pagos ]        [ dte_documentos ]
```

El canal solo existe hasta que el Pedido se convierte en Venta. A partir de la Venta,
el canal ya no importa para ningún proceso fiscal o contable.
