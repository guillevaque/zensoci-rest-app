# 02 — Modelo Omnicanal

---

## Principio fundamental

**Un solo Pedido. Una sola Venta. Un solo DTE.**

El canal de origen no cambia la estructura de estas entidades. Solo determina qué campos
se populan y qué validaciones aplican. A partir del momento en que el Pedido se convierte
en Venta, el canal ya no importa para ningún proceso fiscal o contable.

---

## Las cuatro modalidades

| Código | Nombre | Descripción | Estado |
|---|---|---|---|
| `PLATAFORMA_EXTERNA` | Canal externo (PedidosYa, etc.) | Pedido ingresa desde plataforma. Referencia externa obligatoria. | **Activa hoy** |
| `MESA` | Atención en mesa | Cliente come en el local. Mesa asignada. | Futuro (apertura presencial) |
| `PICKUP` | Retiro en mostrador | Cliente ordena y retira sin sentarse. | Futuro |
| `DELIVERY_PROPIO` | Delivery con motorista propio | Zensoci entrega con su personal. Dirección obligatoria. | Futuro |

---

## Campo discriminador

```
pedidos.canal  ENUM('MESA','PICKUP','DELIVERY_PROPIO','PLATAFORMA_EXTERNA')
```

Es el único campo que diferencia los canales a nivel de datos.

---

## Campos por canal

| Campo | MESA | PICKUP | DELIVERY_PROPIO | PLATAFORMA_EXTERNA |
|---|---|---|---|---|
| `mesa_id` | **Requerido** | Null | Null | Null |
| `cliente_id` | Opcional | Opcional | **Requerido** | Opcional |
| `direccion_entrega_id` | Null | Null | **Requerido** | Null |
| `referencia_externa` | Null | Null | Null | **Requerido** |
| `plataforma` | Null | Null | Null | **Requerido** (ej: `pedidosya`) |
| `comision_plataforma` | Null | Null | Null | Recomendado |
| `motorista_id` | Null | Null | Opcional | Null |
| `hora_estimada_entrega` | Null | Opcional | **Requerido** | Según plataforma |

Campos comunes a todos los canales: `id`, `uuid_idempotencia`, `canal`, `estado`,
`numero_pedido`, `fecha`, `hora_apertura`, `hora_cierre`, `usuario_id`, `notas_generales`,
`subtotal_con_iva`, `created_at`.

---

## Reglas de validación por canal

### MESA
- `mesa_id` debe existir en `mesas` y estar en estado `libre`
- La mesa pasa a `ocupada` al crear el pedido
- La mesa pasa a `libre` cuando la venta se completa

### PICKUP
- No requiere mesa, dirección, ni referencia externa
- Cliente puede identificarse o no (consumidor final)

### DELIVERY_PROPIO
- `cliente_id` obligatorio (para el receptor del DTE)
- `direccion_entrega_id` obligatorio (FK a `direcciones_entrega`)
- La dirección debe pertenecer al cliente registrado

### PLATAFORMA_EXTERNA
- `referencia_externa` obligatorio — ID de la orden en la plataforma
- `plataforma` obligatorio — identifica la plataforma
- Idempotencia basada en `UNIQUE(plataforma, referencia_externa)`
- La comisión se registra en `comision_plataforma` (DECIMAL) — **no entra en el DTE**

---

## Comisión de plataformas

La comisión de PedidosYa es un costo operativo de Zensoci, no un descuento fiscal.

- **Lo que se factura al consumidor:** precio total del pedido (con IVA 13%)
- **Lo que recibe Zensoci:** precio total menos comisión de la plataforma

La comisión **no se refleja en el DTE**. El DTE refleja lo que el cliente pagó.
Se registra en `pedidos.comision_plataforma` para reportes de rentabilidad y conciliación.

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si El Salvador requiere algún tratamiento fiscal
específico para las comisiones de plataformas digitales de entrega.

---

## Cómo el DTE es independiente del canal

El motor de DTE nunca lee el campo `canal`. Lee únicamente desde la Venta:

- `ventas.subtotal_sin_iva`
- `ventas.iva`
- `ventas.total`
- `venta_items[]`
- `pagos[]`
- `receptor` (del cliente o consumidor final)
- `emisor` (de `configuracion_fiscal`)

Esto garantiza que agregar un canal nuevo no requiere tocar el módulo de Ventas ni el de DTE.

---

## Cómo agregar un canal nuevo

Para agregar un canal (ej: `APP_MOVIL`, `WHATSAPP`, `KIOSKO`):

1. Agregar el valor al ENUM `pedidos.canal`
2. Agregar campos opcionales propios de ese canal (si son únicos)
3. Definir reglas de validación en el módulo PHP de Pedidos
4. El módulo de Ventas no cambia
5. El módulo de DTE no cambia
6. El módulo de Pagos no cambia

---

## Diagrama de convergencia

```
PLATAFORMA_EXTERNA    MESA       PICKUP    DELIVERY_PROPIO
        │               │           │              │
        └───────────────┴───────────┴──────────────┘
                                │
                                ▼
                      [ pedidos + pedido_items ]
                           (canal relevante solo aquí)
                                │
                                ▼
                      [ ventas + venta_items ]  ← snapshot fiscal
                                │
                   ┌────────────┴────────────┐
                   ▼                         ▼
               [ pagos ]           [ dte_documentos ]
                                   (canal irrelevante)
```

---

## Ejemplos por canal

### PLATAFORMA_EXTERNA (PedidosYa — activo hoy)
```
canal:                PLATAFORMA_EXTERNA
plataforma:           pedidosya
referencia_externa:   PY-2024-00123456
mesa_id:              null
cliente_id:           null
comision_plataforma:  8.50
```

### MESA (futuro)
```
canal:    MESA
mesa_id:  3
```

### DELIVERY_PROPIO (futuro)
```
canal:                 DELIVERY_PROPIO
cliente_id:            101
direccion_entrega_id:  45
motorista_id:          7
hora_estimada_entrega: 2024-09-15 19:30:00
```

---

## Invariante omnicanal

> El módulo de Ventas y el módulo de DTE no contienen lógica de canal.
> No existe `if ($pedido->canal === 'MESA')` en `ventas.php` ni en `dte_builder.php`.
> El canal solo es relevante en el módulo de Pedidos para sus validaciones de entrada.
