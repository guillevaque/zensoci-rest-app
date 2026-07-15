# 19 — Flujos por Modalidad

Documentación de los flujos completos para cada canal de venta. Todos convergen en el mismo
motor de Venta y DTE — solo la entrada y la UI difieren.

---

## MODALIDAD 1: PLATAFORMA_EXTERNA (PedidosYa) — ACTIVA HOY

### Actor principal: Operador de plataforma

### Creación del pedido

```
1. PedidosYa notifica el pedido (push, webhook, o entrada manual por el operador)
2. El operador abre la interfaz de "Nuevo Pedido - Plataforma"
3. Ingresa:
   - Referencia externa (ID de PedidosYa)
   - Plataforma: pedidosya
   - Ítems del pedido (buscando en el menú de Zensoci)
   - Notas especiales de cada ítem
   - Comisión de la plataforma (si se conoce en este momento)
4. Sistema valida idempotencia: si ya existe un pedido con
   (plataforma=pedidosya, referencia_externa=PY-2024-00123456), rechaza duplicado
5. Sistema crea pedido con estado: RECIBIDO
```

### Preparación

```
6. Pedido aparece en pantalla de cocina (KDS o lista de pedidos)
7. Cocina prepara los ítems
8. Cocina marca cada ítem: EN_PREPARACION → LISTO
9. Cuando todos los ítems están listos: pedido → LISTO_PARA_ENTREGA
10. PedidosYa viene a recoger el pedido (motorista de la plataforma)
```

### Cobro y Venta

```
11. El operador confirma que PedidosYa recogió el pedido
12. El operador abre el flujo de "Registrar Venta"
13. Sistema pre-llena: ítems del pedido, precios del menú al momento del pedido
14. Tipo de receptor: consumidor final (PedidosYa no proporciona NIT del comprador final)
15. Sistema calcula:
    - subtotal_sin_iva = suma de (precio_sin_iva * cantidad) de cada ítem
    - iva = subtotal_sin_iva * 0.13
    - total = subtotal_sin_iva + iva
    PENDIENTE DE VALIDAR CON FUENTE OFICIAL: si aplica IVA sobre delivery de PedidosYa
16. Forma de pago: PLATAFORMA_EXTERNA (PedidosYa cobra al cliente y liquida a Zensoci)
    Código CAT-017 a usar: PENDIENTE DE VALIDAR CON FUENTE OFICIAL
17. Sistema crea Venta + VentaItems + Pago en una sola transacción atómica
```

### DTE

```
18. Sistema inicia generación del DTE post-commit
19. Construye JSON Factura 01 con:
    - receptor: consumidor final
    - cuerpoDocumento: desde VentaItems (snapshot)
    - resumen: desde Venta (snapshot)
    - forma de pago: según CAT-017
20. Firma → Transmite → Guarda sello
21. Estado final: ACEPTADO
```

### Cierre

```
22. Estado pedido → ENTREGADO
23. PedidosYa liquida a Zensoci según sus ciclos (semanal, quincenal)
24. El operador puede registrar la conciliación para validar
    que el monto liquidado = suma de ventas - comisiones
```

### Errores y manejo

| Error | Manejo |
|---|---|
| Pedido duplicado de PedidosYa | Rechazar con error 409; idempotencia protege |
| Ítem del menú no disponible | El operador selecciona alternativa o cancela el ítem |
| Firma falla | DTE queda en `error_firma`; reintento automático después de N segundos |
| MH rechaza | DTE queda en `rechazado`; operador puede reintentar o activar contingencia |
| MH no responde | DTE queda en `error_temporal`; reintento automático con backoff |

---

## MODALIDAD 2: MESA — FUTURO (apertura presencial)

### Actor principal: Mesero

### Creación del pedido

```
1. Mesero selecciona mesa libre desde GestionMesas
2. Sistema valida que la mesa esté en estado LIBRE
3. Sistema crea pedido con:
   - canal: MESA
   - mesa_id: (mesa seleccionada)
   - usuario_id: (mesero autenticado)
   - estado: ABIERTO
4. Mesa pasa a estado OCUPADA
5. Mesero agrega ítems desde el menú activo
6. Para cada ítem:
   - nombre_snapshot = nombre actual del menú
   - precio_snapshot_con_iva = precio actual del menú
   - precio_snapshot_sin_iva = precio_con_iva / 1.13
   Nota: precio_snapshot es inmutable desde este momento
7. Mesero confirma → estado: EN_COCINA
```

### Preparación

```
8. KDS muestra los ítems del pedido por orden de llegada
9. Cocinero marca: EN_PREPARACION → LISTO por ítem
10. Cuando todos los ítems están LISTO: pedido → LISTO
11. Mesero entrega en mesa → pedido → ENTREGADO
```

### Cobro y Venta

```
12. Cliente pide la cuenta
13. Cajero abre el pedido desde la vista de Caja
14. Cajero selecciona tipo de receptor:
    - Consumidor final → Factura 01
    - Empresa con NRC → CCF 03
15. Si CCF: cajero ingresa NIT, NRC, nombre del receptor (o busca en clientes)
16. Cajero selecciona forma(s) de pago:
    - Efectivo → ingresa monto entregado, sistema calcula vuelto
    - Débito/Crédito → ingresa referencia de voucher
    - Mixto → múltiples formas sumando el total
17. Sistema crea Venta + VentaItems + Pagos (transacción atómica)
```

### DTE

```
18. Sistema genera DTE post-commit
19. Cajero ve: número de control + sello del MH en pantalla
20. Opcionalmente: imprimir ticket o enviar por email
```

### Cierre

```
21. Estado pedido → PAGADO
22. Mesa pasa a estado LIBRE automáticamente
```

### Errores y manejo

| Error | Manejo |
|---|---|
| Mesa ya ocupada | Bloquear apertura de nuevo pedido |
| Ítem desactivado durante el pedido | Permitir continuar con snapshot; precio ya guardado |
| Cambio de mesa solicitado | Mover pedido a mesa libre; actualizar mesa_id |
| Cancelación antes del cobro | Estado CANCELADO; liberar mesa; registrar motivo |
| DTE rechazado por MH | La venta ya está registrada; intentar contingencia |

---

## MODALIDAD 3: PICKUP — FUTURO

### Actor principal: Operador / Cajero

### Creación del pedido

```
1. Cliente llega al mostrador o llama para pedir
2. Operador abre "Nuevo Pedido - Pickup"
3. Agrega ítems igual que MESA pero:
   - mesa_id: null
   - canal: PICKUP
4. Estado inicial: ABIERTO
5. Si el cliente quiere identificarse: asignar cliente_id
```

### Preparación

```
6. KDS muestra el pedido igual que para mesas
7. Cocina prepara → marca LISTO
```

### Cobro y Venta

```
8. El cliente llega a recoger
9. El cajero cobra en el momento de entrega
10. Flujo de cobro idéntico al de MESA
    - Puede ser consumidor final (Factura 01) o empresa (CCF 03)
```

### DTE

```
11. Mismo motor de DTE que todos los demás canales
```

### Cierre

```
12. Estado pedido → PAGADO
13. No hay mesa que liberar
```

---

## MODALIDAD 4: DELIVERY_PROPIO — FUTURO

### Actor principal: Operador + Motorista

### Creación del pedido

```
1. El cliente llama o escribe por WhatsApp (entrada manual por el operador)
2. Operador abre "Nuevo Pedido - Delivery Propio"
3. Selecciona o crea el cliente (obligatorio para tener dirección)
4. Selecciona o crea la dirección de entrega del cliente
5. Agrega ítems
6. Asigna hora estimada de entrega
7. Asigna motorista (usuario con rol motorista)
8. Estado inicial: CONFIRMADO
```

### Preparación

```
9. Cocina prepara → KDS → LISTO_PARA_DESPACHO
10. Motorista sale con el pedido → estado: EN_CAMINO
```

### Cobro y Venta

**Opción A: Cobro al entregar (efectivo)**
```
11. Motorista entrega
12. Cliente paga en efectivo al motorista
13. Operador registra el cobro en el sistema cuando el motorista regresa o
    cuando confirma la entrega desde una app móvil (futuro)
14. Sistema crea Venta + Pagos
```

**Opción B: Cobro previo (transferencia)**
```
11. Cliente transfiere antes de la entrega
12. Operador verifica y registra el pago
13. Sistema crea Venta + Pagos con forma_pago = TRANSFERENCIA
14. Motorista entrega sin cobrar
```

### DTE

```
15. Mismo motor de DTE
16. Receptor = datos del cliente registrado
17. Si el cliente tiene NRC → CCF; si no → Factura
```

### Cierre

```
18. Motorista confirma entrega → estado ENTREGADO → PAGADO
19. El costo de entrega (si aplica) puede incluirse como ítem del pedido
    PENDIENTE DE VALIDAR CON FUENTE OFICIAL: tratamiento fiscal del costo de delivery propio
```

---

## Tabla comparativa de flujos

| Paso | PLATAFORMA_EXTERNA | MESA | PICKUP | DELIVERY_PROPIO |
|---|---|---|---|---|
| Origen del pedido | Plataforma externa / manual | Mesero en mesa | Mostrador | Operador / teléfono |
| Mesa requerida | No | Sí | No | No |
| Cliente requerido | No | No | No | **Sí** |
| Dirección requerida | No | No | No | **Sí** |
| Referencia externa | **Sí** | No | No | No |
| KDS | Sí | Sí | Sí | Sí |
| Cobro | Post-entrega (plataforma liquida) | En caja | En mostrador al recoger | Al entregar o previo |
| Motor de Venta | **Idéntico** | **Idéntico** | **Idéntico** | **Idéntico** |
| Motor de DTE | **Idéntico** | **Idéntico** | **Idéntico** | **Idéntico** |

---

## Invariante omnicanal

**El módulo de Ventas y el módulo de DTE no contienen lógica de canal.**
No hay `if ($pedido->canal === 'MESA')` en ventas.php ni en dte_generar.php.
El canal solo es relevante en el módulo de Pedidos para sus validaciones de entrada.
