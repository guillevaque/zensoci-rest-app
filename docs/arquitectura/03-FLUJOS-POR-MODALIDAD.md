# 03 — Flujos por Modalidad

Todos los canales convergen en el mismo motor de Venta y DTE. Solo la entrada y la validación
de pedidos difieren. El módulo de Ventas y el módulo de DTE no contienen lógica de canal.

---

## Índice de flujos de negocio

| # | Flujo | Tipo |
|---|---|---|
| F-01 | Atención en mesa | Operativo |
| F-02 | Pickup | Operativo |
| F-03 | Plataforma externa (PedidosYa) | Operativo |
| F-04 | Delivery propio | Operativo |
| F-05 | Cobro — Factura consumidor final | Fiscal |
| F-06 | Cobro — CCF a empresa | Fiscal |
| F-07 | Pago mixto (efectivo + tarjeta) | Fiscal |
| F-08 | División de cuenta | Fiscal |
| F-09 | Cancelación de pedido completo | Operativo |
| F-10 | Cancelación de ítem dentro de pedido | Operativo |
| F-11 | Cambio de mesa | Operativo |
| F-12 | Anulación de venta + Nota de Crédito | Fiscal |
| F-13 | Reimpresión de DTE | Fiscal |
| F-14 | Reenvío de DTE por email | Fiscal |
| F-15 | DTE en contingencia y retransmisión | Fiscal |
| F-16 | Apertura y cierre de turno | Operativo |
| F-17 | Corte de caja | Operativo |
| F-18 | Recepción de compra de insumos | Inventario |
| F-19 | Alerta de stock bajo | Inventario |
| F-20 | Actualización de precio del menú | Configuración |
| F-21 | Alta de nuevo empleado | Administración |
| F-22 | Configuración inicial del emisor DTE | Fiscal |

---

## Tabla comparativa de modalidades

| Aspecto | PLATAFORMA_EXTERNA | MESA | PICKUP | DELIVERY_PROPIO |
|---|---|---|---|---|
| Origen del pedido | Plataforma / entrada manual | Mesero en mesa | Mostrador | Operador / teléfono |
| Mesa requerida | No | **Sí** | No | No |
| Cliente requerido | No | No | No | **Sí** |
| Dirección requerida | No | No | No | **Sí** |
| Referencia externa | **Sí** | No | No | No |
| KDS | Sí | Sí | Sí | Sí |
| Cobro | Post-entrega (plataforma liquida) | En caja | Al recoger | Al entregar o previo |
| Motor de Venta | **Idéntico** | **Idéntico** | **Idéntico** | **Idéntico** |
| Motor de DTE | **Idéntico** | **Idéntico** | **Idéntico** | **Idéntico** |

---

## F-01 — Atención en mesa (FUTURO)

**Actores:** Mesero, Cocina, Cajero
**Módulos:** MOD-04 → MOD-05 → MOD-06 → MOD-07 → MOD-08 → MOD-09 → MOD-10

```
1. APERTURA DE MESA
   Mesero selecciona mesa libre en GestionMesas
   Sistema valida que la mesa esté en estado "libre"
   Sistema cambia estado mesa → "ocupada" / registra hora de apertura

2. TOMA DEL PEDIDO
   Mesero abre nuevo pedido asociado a la mesa
   Para cada ítem:
     - nombre_snapshot = nombre actual del menú
     - precio_snapshot_con_iva = precio actual del menú
     - precio_snapshot_sin_iva = precio_con_iva / 1.13
   Mesero puede agregar notas por ítem (sin gluten, sin cebolla, etc.)
   Mesero confirma → estado pedido: "en_cocina"

3. PRODUCCIÓN EN COCINA
   KDS muestra ítems ordenados por hora de entrada
   Cocinero marca cada ítem: "en_preparacion" → "listo"
   Cuando todos los ítems están listos: estado pedido → "listo"

4. ENTREGA EN MESA
   Mesero lleva el pedido → marca pedido como "entregado"

5. COBRO (ver F-05 o F-06)
   Cajero abre el pedido desde el POS/Caja
   Sistema muestra: ítems, subtotal sin IVA, IVA 13%, total
   Cajero selecciona tipo DTE y forma(s) de pago
   Sistema crea Venta + VentaItems + Pagos (transacción atómica)

6. EMISIÓN DEL DTE
   Sistema genera DTE post-commit
   Cajero ve: número de control + sello del MH en pantalla

7. CIERRE DE MESA
   Estado pedido → "pagado" / Mesa pasa a estado "libre"
```

**Errores:**

| Condición | Manejo |
|---|---|
| Mesa ya está ocupada | No permitir abrir pedido |
| Ítem desactivado durante el pedido | Continuar con snapshot; alertar al cajero |
| Cambio de mesa solicitado | Mover pedido a mesa libre (ver F-11) |
| Cancelación antes del cobro | Estado CANCELADO; liberar mesa; registrar motivo |
| Firmador no disponible | Ofrecer modo contingencia |
| MH rechaza el DTE | La venta ya está registrada; intentar contingencia |

---

## F-02 — Pickup (FUTURO)

**Diferencias vs F-01:** Sin mesa asignada; el canal PICKUP no requiere `mesa_id`.

```
1. Cliente llega o llama para pedir
2. Operador abre "Nuevo Pedido - Pickup" (canal: PICKUP, mesa_id: null)
3. Toma del pedido igual que F-01 pasos 2-3
4. Cuando cocina marca listo: estado → "listo para recoger"
5. Cliente llega a recoger
6. Cobro y DTE idéntico al de F-01 (Factura 01 o CCF 03)
7. No hay mesa que liberar
```

---

## F-03 — Plataforma externa (ACTIVA HOY)

**Actor principal:** Operador de plataforma

```
1. PedidosYa notifica el pedido (push, webhook, o entrada manual)
2. Operador abre "Nuevo Pedido - Plataforma"
3. Ingresa: referencia_externa, plataforma (pedidosya), ítems, comisión
4. Sistema valida idempotencia:
   UNIQUE(plataforma, referencia_externa) — rechaza duplicado con 409
5. Sistema crea pedido: canal=PLATAFORMA_EXTERNA, estado=RECIBIDO

6. Pedido aparece en KDS/lista de pedidos
7. Cocina prepara → marca LISTO_PARA_ENTREGA
8. Motorista de PedidosYa retira el pedido

9. Operador abre flujo "Registrar Venta"
10. Sistema pre-llena ítems y precios snapshot
11. Receptor: consumidor final (PedidosYa no proporciona NIT del comprador)
12. Forma de pago: PLATAFORMA_EXTERNA
    PENDIENTE DE VALIDAR CON FUENTE OFICIAL: código CAT-017 a usar para PedidosYa
13. Sistema calcula:
    subtotal_sin_iva = suma(precio_sin_iva * cantidad)
    iva = subtotal_sin_iva * 0.13
    total = subtotal_sin_iva + iva
    PENDIENTE DE VALIDAR CON FUENTE OFICIAL: si aplica IVA sobre delivery de PedidosYa
14. Sistema crea Venta + VentaItems + Pago (transacción atómica)

15. Sistema genera DTE tipo 01 (Factura, consumidor final) post-commit
16. Firma → Transmite → Guarda sello → Estado: ACEPTADO

17. Estado pedido → ENTREGADO
18. PedidosYa liquida a Zensoci según sus ciclos
    La conciliación: monto liquidado = suma de ventas - comisiones
```

**La comisión de PedidosYa se registra en `pedidos.comision_plataforma`. No entra en el DTE.
El DTE refleja lo que el cliente pagó.**

**Errores:**

| Error | Manejo |
|---|---|
| Pedido duplicado de PedidosYa | Rechazar 409; UNIQUE(plataforma, referencia_externa) protege |
| Ítem del menú no disponible | Operador selecciona alternativa o cancela el ítem |
| Firma falla | DTE queda en `error_firma`; reintento automático con backoff |
| MH rechaza | DTE queda en `rechazado`; operador puede reintentar o activar contingencia |
| MH no responde | DTE queda en `error_temporal`; reintento automático |

---

## F-04 — Delivery propio (FUTURO)

**Actores:** Operador + Motorista

```
1. Cliente llama o escribe (entrada manual)
2. Operador abre "Nuevo Pedido - Delivery Propio"
3. Selecciona o crea el cliente (obligatorio)
4. Selecciona o crea dirección de entrega del cliente
5. Agrega ítems, hora estimada de entrega, motorista asignado
6. Estado inicial: CONFIRMADO

7. Cocina prepara → KDS → LISTO_PARA_DESPACHO
8. Motorista sale → estado: EN_CAMINO

OPCIÓN A — Cobro al entregar (efectivo):
9. Motorista entrega / cliente paga al motorista
10. Operador registra el cobro
11. Sistema crea Venta + Pagos

OPCIÓN B — Cobro previo (transferencia):
9. Cliente transfiere / operador verifica y registra
10. Sistema crea Venta + Pagos (forma_pago = TRANSFERENCIA)
11. Motorista entrega sin cobrar

12. Mismo motor de DTE que todos los canales
13. Receptor = datos del cliente registrado (si tiene NRC → CCF; si no → Factura)
14. Motorista confirma entrega → ENTREGADO → PAGADO

PENDIENTE DE VALIDAR CON FUENTE OFICIAL:
Tratamiento fiscal del costo de delivery propio si se incluye como ítem del pedido.
```

---

## F-05 — Cobro con Factura a consumidor final

**Actores:** Cajero
**Módulos:** MOD-07, MOD-08, MOD-09, MOD-10

```
1. Cajero selecciona tipo DTE = "Factura" (código 01)
2. Receptor = consumidor final (anónimo):
   - tipoDocumento: null (o "13" para DUI si el cliente lo proporciona)
   - nombre: "Consumidor Final"
   - correo: null
3. Sistema construye cuerpoDocumento — por cada ítem:
   - tipoItem: 1 (Bienes — CAT-011)
   - cantidad, uniMedida: 59 (Unidad — CAT-014)
   - descripcion: nombre_snapshot
   - precioUni: precio_sin_iva (8 decimales)
   - ventaGravada: precio_sin_iva * cantidad
   - tributos: ["20"] (IVA 13% — CAT-015)
   - ivaItem: precio_sin_iva * cantidad * 0.13
4. Sistema construye resumen:
   - totalGravada: suma ventaGravada
   - tributos: [{ codigo: "20", descripcion: "IVA 13%", valor: totalGravada * 0.13 }]
   - montoTotalOperacion: totalGravada + IVA
   - totalPagar: montoTotalOperacion
   - condicionOperacion: 1 (Contado — CAT-016)
   - pagos: [{ codigo: "XX", montoPago: totalPagar }]
     Código CAT-017: PENDIENTE DE VALIDAR CON FUENTE OFICIAL
```

---

## F-06 — Cobro con CCF a empresa

**Diferencias vs F-05:** tipo DTE = "03"; requiere datos completos del receptor.

```
1. Cajero selecciona tipo DTE = "CCF" (código 03)
2. Sistema solicita datos del receptor:
   - NIT (formato XXXX-XXXXXX-XXX-X)
   - NRC / Nombre o razón social / Código de actividad económica / Dirección
   - Correo electrónico (opcional)
3. Cajero puede buscar cliente en catálogo (MOD-03) o ingresar manualmente
4. El JSON del DTE usa:
   - tipoDocumento: "36" (NIT)
   - Receptor con campos adicionales: NRC, codActividad, direccion
```

---

## F-07 — Pago mixto (efectivo + tarjeta)

```
Ejemplo: total $25.00
- $15.00 tarjeta débito: forma_pago="02", referencia="VOUCHER#12345"
- $10.00 efectivo: forma_pago="01"

Sistema valida: suma de pagos = total de venta
En el DTE, campo "pagos" del resumen incluye ambas formas:
[
  { codigo: "02", montoPago: 15.00, referencia: "VOUCHER#12345" },
  { codigo: "01", montoPago: 10.00, referencia: null }
]
Códigos exactos CAT-017: PENDIENTE DE VALIDAR CON FUENTE OFICIAL
```

---

## F-08 — División de cuenta

```
1. Cajero selecciona "Dividir cuenta" en el pedido
2. Asigna ítems a "Cuenta A" y "Cuenta B"
3. Sistema genera dos Ventas independientes, cada una con su DTE
4. La mesa se libera cuando TODOS los sub-cobros están pagados
```

**Nota:** Puede implementarse en fase posterior como dos pedidos separados desde la misma mesa.

---

## F-09 — Cancelación de pedido completo

```
1. Si estado = "abierto": cancelación directa (sin aprobación)
2. Si estado = "en_cocina" o "listo": requiere autorización de manager
3. Sistema registra motivo de cancelación
4. Estado pedido → "cancelado"
5. Sistema libera la mesa → "libre"
6. KDS elimina los ítems pendientes
```

---

## F-10 — Cancelación de ítem dentro de pedido

```
1. Si el ítem está en "pendiente": cancelación directa
2. Si el ítem ya está "en_preparacion" o "listo": notificar a cocina
3. Estado ítem → "cancelado"
4. Sistema recalcula el total del pedido
5. KDS refleja la cancelación inmediatamente
```

---

## F-11 — Cambio de mesa

```
1. Mesero selecciona el pedido activo de la mesa origen
2. Selecciona "Cambiar de mesa" → sistema muestra mesas libres
3. Sistema actualiza:
   - pedido.mesa_id → mesa destino
   - Estado mesa origen → "libre"
   - Estado mesa destino → "ocupada"
4. El KDS no cambia (los ítems siguen siendo los mismos)
```

---

## F-12 — Anulación de venta + Nota de Crédito

```
1. Manager accede a la venta a anular
2. Sistema verifica que el DTE asociado esté en estado "aceptado"
3. Manager ingresa motivo de anulación
4. Sistema genera Nota de Crédito (DTE tipo 05):
   - Referencia el codigo_generacion del DTE original
   - Monto = monto total de la venta
5. Sistema firma y transmite la NC al MH
6. Si el MH acepta:
   - Estado venta → "anulada"
   - Estado DTE original → "anulado"
   - NC queda en estado "aceptado"
7. Sistema registra en auditoría: quién, cuándo, por qué
```

**Restricción del MH:** La NC debe emitirse dentro del mismo mes fiscal del DTE original.

---

## F-13 — Reimpresión de DTE

```
1. Cajero busca la venta (por número de ticket, fecha, o cliente)
2. Sistema muestra el DTE con su estado
3. Cajero selecciona "Reimprimir" o "Descargar PDF"
4. Sistema genera la representación con:
   - Número de control / Código de generación / Sello del MH / QR de verificación
```

---

## F-14 — Reenvío de DTE por email

```
1. Cajero busca la venta y selecciona "Enviar por email"
2. Sistema solicita correo del destinatario
   (pre-poblado si el receptor está en el catálogo de clientes)
3. Sistema envía el DTE en PDF o XML
4. Sistema registra el envío (fecha, hora, destinatario)
```

**Prerrequisito:** SMTP configurado en el servidor Hostinger.

---

## F-15 — DTE en contingencia y retransmisión

### Activación

```
1. Sistema intenta transmitir al MH → falla (timeout, 5xx, sin internet)
2. Sistema activa modo contingencia:
   - tipo_transmision en DTEs nuevos → 2 (contingencia — CAT-004)
   - Se registra EventoContingencia con causal (CAT-005) y hora de inicio
3. El cajero continúa cobrando:
   - DTEs se generan con tipo_transmision = 2
   - Se guardan en DB con estado "pendiente_transmision"
4. UI muestra banner "Modo Contingencia Activo"
```

### Retransmisión

```
1. Manager detecta que la conectividad se restauró
2. Manager accede a "Contingencia" → "Retransmitir"
3. Sistema envía DTEs en cola al MH en orden cronológico
4. Para cada DTE: firma → transmite → guarda sello si aceptado
5. Al terminar: sistema cierra el EventoContingencia
6. Manager revisa rechazados y decide si emitir NC o corregir
```

---

## F-16 — Apertura y cierre de turno

```
APERTURA:
1. Manager abre nuevo turno desde el Panel de Turnos
2. Sistema registra fecha, hora_apertura, usuario que abrió
3. Estado turno → "activo" (solo puede haber uno activo a la vez)

CIERRE:
1. Manager abre módulo de cierre de turno
2. Sistema muestra resumen: ventas, DTEs emitidos, desglose por forma de pago
3. Manager confirma → sistema registra hora_cierre y usuario
4. Estado turno → "cerrado"
5. Sistema dispara generación del Corte de Caja (F-17)
```

---

## F-17 — Corte de caja

```
1. Al cerrar el turno, cajero cuenta el efectivo físico
2. Cajero ingresa monto de efectivo físico contado
3. Sistema calcula:
   - Efectivo esperado = suma de ventas pagadas con efectivo (CAT-017: "01")
   - Diferencia = efectivo real - efectivo esperado
4. Sistema muestra resumen: total ventas, desglose por forma de pago,
   diferencia en efectivo, total DTE emitidos
5. Manager aprueba y cierra el corte
6. Si hay diferencia: sistema genera alerta y registra en auditoría
```

---

## F-18 — Recepción de compra de insumos

```
1. Encargado accede al módulo de Compras → selecciona proveedor
2. Agrega los ítems recibidos: ingrediente/empaque, cantidad, precio unitario
3. Sistema genera borrador de la compra
4. Encargado verifica contra la factura física → confirma
5. Sistema actualiza stock_actual de cada ingrediente/empaque
6. Sistema registra en auditoría
```

---

## F-19 — Alerta de stock bajo

```
Trigger: cada vez que se actualiza el stock de un ingrediente o empaque
Sistema compara stock_actual < stock_minimo
Si hay alerta:
  - Sistema registra el evento "ingrediente.stock_bajo"
  - Dashboard muestra alerta
  - (Futuro) Notificación push o email al encargado
La alerta se desactiva cuando el stock vuelve a superar el mínimo
```

---

## F-20 — Actualización de precio del menú

```
1. Manager modifica precio_con_iva y/o precio_sin_iva en el catálogo
2. Sistema valida coherencia: precio_sin_iva * 1.13 ≈ precio_con_iva
3. IMPORTANTE: Los pedidos ya abiertos mantienen el precio_snapshot anterior
4. Los nuevos pedidos usarán el precio actualizado
5. Sistema registra en auditoría: precio anterior, precio nuevo, usuario, timestamp
```

---

## F-21 — Alta de nuevo empleado

```
1. Admin completa el formulario: nombre, email, contraseña inicial, rol, color avatar, PIN
2. Sistema valida: email único / PIN no repetido entre empleados activos
3. Sistema crea el usuario (contraseña hasheada, PIN hasheado)
4. El empleado aparece en la pantalla de selección de PIN del login
```

---

## F-22 — Configuración inicial del emisor DTE

```
Esta configuración se hace una sola vez antes de emitir el primer DTE.

1. Admin accede a Configuración → Facturación Electrónica
2. Admin ingresa datos del emisor:
   - NIT, NRC, nombre legal, nombre comercial
   - Código de Actividad Económica (CAT-019)
   - Tipo de Establecimiento (CAT-009)
   - Código de Establecimiento y Código de Punto de Venta (asignados por el MH)
   - Departamento (CAT-012) y Municipio (CAT-013)
   - Dirección complemento, teléfono, email fiscal
   - Ambiente: "00" (prueba) o "01" (producción)
3. Admin configura el correlativo inicial:
   - Tipo de DTE: "01" / Último correlativo: 0
4. Admin realiza prueba de emisión con un DTE de prueba
5. Si el DTE de prueba es aceptado: confirmar ambiente producción
```

---

## Mapa de transiciones de estado

### Pedido

```
abierto → en_cocina → listo → entregado → pagado
abierto | en_cocina | listo | entregado → cancelado
```

### Venta

```
completada → anulada (con NC emitida y aceptada)
```

### Mesa

```
libre → ocupada → libre
libre → fuera_de_servicio → libre
```

---

## Reglas de negocio críticas

| Regla | Descripción |
|---|---|
| RN-01 | Un pedido no puede cerrarse sin al menos un ítem entregado |
| RN-02 | El total de pagos debe igualar exactamente el total de la venta |
| RN-03 | El precio_snapshot de un ítem en pedido nunca cambia, aunque el menú se actualice |
| RN-04 | Un DTE rechazado por el MH no invalida la venta; el cobro ya fue registrado |
| RN-05 | Solo un turno puede estar activo por establecimiento en un momento dado |
| RN-06 | La NC solo puede emitirse dentro del mismo mes fiscal del DTE original |
| RN-07 | El correlativo de DTE es irreversible; un número usado no puede reutilizarse |
| RN-08 | Una venta "anulada" no se elimina; solo cambia de estado |
| RN-09 | El descuento de stock por venta requiere receta definida para el ítem |
| RN-10 | El ambiente DTE (prueba/producción) aplica a todos los documentos simultáneamente |

---

## Mapa de relaciones entre módulos

```
CONFIGURACIÓN (emisor fiscal, datos del restaurante)
         │ alimenta
         ▼
┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐
│   MENÚ   │  │ INVENTARIO │  │  COSTEO  │  │ EMPAQUES │
└────┬─────┘  └─────┬──────┘  └────┬─────┘  └────┬─────┘
     │               │             │               │
     └───────────────┴─────────────┴───────────────┘
                            │
                            ▼
                         MESAS
                            │
                            ▼
                         PEDIDOS (canal relevante solo aquí)
                            │
                      ┌─────┴──────┐
                      ▼            ▼
                    CAJA         KDS
                      │
                      ▼
                   VENTA + PAGOS
                      │
               ┌──────┴──────┐
               ▼             ▼
           REPORTES         DTE (canal irrelevante aquí)
               │
               ▼
           DASHBOARD
```
