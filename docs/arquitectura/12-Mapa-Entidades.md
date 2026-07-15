# 12 — Mapa de Entidades

Este documento describe las entidades del negocio de Zensoci, sus responsabilidades y relaciones
conceptuales. No contiene SQL, CREATE TABLE ni código.

---

## Entidades existentes (ya tienen soporte en DB o código)

### Usuario
**Responsabilidad:** Representa a cada persona del equipo que accede al sistema.

**Atributos clave:** id, nombre, email, contraseña, PIN, rol, color de avatar, estado.

**Roles posibles:** `admin`, `manager`, `staff`, `member`.

**Relaciones:**
- Un Usuario toma Pedidos (como mesero)
- Un Usuario procesa Cobros (como cajero)
- Un Usuario emite DTEs (como responsable de la transacción)
- Un Usuario pertenece a un Turno (relación futura)

---

### MenuItem (Ítem del Menú)
**Responsabilidad:** Representa un plato o producto que el restaurante ofrece al público.

**Atributos clave:** id, nombre, categoría, precio con IVA, descripción, imagen, activo.

**Relaciones:**
- Un MenuItem puede aparecer en múltiples DetallesPedido
- Un MenuItem puede tener un CosteoPlatillo asociado
- Un MenuItem define los Bienes que se incluyen en el cuerpo del DTE

---

### CosteoPlatillo
**Responsabilidad:** Contiene el resumen financiero y de rentabilidad de un platillo.

**Atributos clave:** número de menú, nombre, categoría, porciones, precio con IVA, precio sin IVA,
costo porción, costo sub-receta, costo empaque, costo unitario, margen, % costo, precio delivery.

**Relaciones:**
- Un CosteoPlatillo tiene múltiples LineaReceta (sus ingredientes)
- Un CosteoPlatillo corresponde conceptualmente a un MenuItem
- Las LineaReceta de un CosteoPlatillo referencian Ingredientes del catálogo

---

### LineaReceta
**Responsabilidad:** Representa un ingrediente específico dentro de la receta de un platillo,
con su cantidad, unidad y costo en ese contexto.

**Atributos clave:** nombre, tipo (principal / secundario / empaque), cantidad, unidad de medida,
% de merma, precio referencia (snapshot), costo de la línea.

**Relaciones:**
- Pertenece a un CosteoPlatillo
- Referencia a un Ingrediente del catálogo (por nombre, no por FK actualmente)

---

### Ingrediente
**Responsabilidad:** Representa un insumo del catálogo de materias primas del restaurante.
Sirve como referencia de precios para el costeo.

**Atributos clave:** nombre, tipo, categoría, marca, proveedor, presentación de compra,
unidad, stock actual, stock mínimo, precio compra (con/sin IVA), costo unitario.

**Relaciones:**
- Un Ingrediente puede aparecer en múltiples LineaReceta
- Un Ingrediente genera alertas cuando su stock cae bajo el mínimo
- El descuento de un Ingrediente ocurrirá al cerrar un Pedido (relación futura)

---

### Empaque
**Responsabilidad:** Representa materiales de empaque (envases, tapas, cubiertos, bolsas) con
su costo unitario. Forma parte del costo total de un platillo.

**Atributos clave:** nombre, categoría, marca, proveedor, presentación, unidad, unidades por paquete,
precio sin IVA, costo unitario, stock, stock mínimo.

**Relaciones:**
- Referenciado por LineaReceta cuando el tipo es "empaque"
- Su costo_unitario alimenta el `costo_empaque` del CosteoPlatillo

---

## Entidades que deben construirse

### Mesa
**Responsabilidad:** Representa un espacio físico del restaurante donde se atiende a clientes.
Incluye Pickup como un tipo especial de mesa.

**Atributos clave:** id, nombre (Mesa 1…10, Pickup), capacidad de personas, estado (libre /
ocupada / necesita check), hora de apertura, mesero asignado.

**Relaciones:**
- Una Mesa puede tener un Pedido activo en un momento dado
- Una Mesa es asignada a un Mesero (Usuario)
- Cuando el Pedido se cierra, la Mesa vuelve a estado libre

---

### Pedido
**Responsabilidad:** Representa la solicitud de consumo de un cliente, desde que se toma la
orden hasta que se paga. Es la entidad central del ciclo operativo.

**Atributos clave:** id, número de pedido, fecha, hora de apertura, mesa, mesero, estado
(abierto / en cocina / listo / entregado / pagado / cancelado), notas generales.

**Relaciones:**
- Un Pedido pertenece a una Mesa
- Un Pedido es tomado por un Usuario (mesero)
- Un Pedido tiene múltiples DetallePedido
- Un Pedido da origen a una Venta cuando se paga

---

### DetallePedido
**Responsabilidad:** Representa un ítem específico dentro de un pedido: qué se pidió,
cuánto y con qué notas.

**Atributos clave:** id, pedido_id, menu_item_id, nombre del ítem (snapshot), cantidad, precio
unitario al momento del pedido, notas especiales (sin gluten, sin cebolla, etc.).

**Relaciones:**
- Pertenece a un Pedido
- Referencia a un MenuItem
- Al cobrarse, da origen a una LineaVenta

---

### Venta
**Responsabilidad:** Representa el registro contable y fiscal de una transacción completada.
Es la fuente de verdad financiera del negocio.

**Atributos clave:** id, número de ticket, fecha, hora, cajero (usuario), pedido de origen,
mesa, condición de operación (contado / crédito), subtotal sin IVA, monto IVA, propina,
total con IVA, tipo de receptor (consumidor final / empresa), datos del receptor.

**Relaciones:**
- Una Venta se origina desde un Pedido
- Una Venta es procesada por un Usuario (cajero)
- Una Venta tiene múltiples LineaVenta
- Una Venta tiene uno o más Pagos
- Una Venta genera un DTE

---

### LineaVenta
**Responsabilidad:** Detalle de cada ítem en una venta completada. Contiene los valores
fiscales definitivos (sin IVA, IVA, con IVA) para el cuerpo del DTE.

**Atributos clave:** id, venta_id, descripción del ítem, cantidad, precio unitario sin IVA,
monto de IVA por unidad, precio con IVA, tipo de ítem (CAT-011), unidad de medida (CAT-014).

**Relaciones:**
- Pertenece a una Venta
- Referencia (opcionalmente) al MenuItem original

---

### Pago
**Responsabilidad:** Representa una forma de pago aplicada a una venta. Una venta puede tener
múltiples pagos (pago mixto: parte efectivo, parte tarjeta).

**Atributos clave:** id, venta_id, forma de pago (CAT-017), monto, referencia (número de
voucher de tarjeta, etc.).

**Relaciones:**
- Pertenece a una Venta
- Una Venta puede tener 1 o más Pagos
- El total de Pagos debe igual al total de la Venta

---

### Receptor
**Responsabilidad:** Representa al cliente que recibe el DTE. Para consumidores finales puede
ser anónimo. Para CCF requiere datos completos de empresa.

**Atributos clave:** tipo (persona natural / jurídica), NIT, NRC (si aplica), nombre o razón
social, correo electrónico, dirección, teléfono.

**Relaciones:**
- Un Receptor puede estar asociado a múltiples Ventas (cliente frecuente)
- Un Receptor es el destinatario del DTE

---

### ConfiguracionEmisora
**Responsabilidad:** Almacena todos los datos fiscales del restaurante como emisor de DTE.
Existe solo un registro activo.

**Atributos clave:** NIT, NRC, nombre legal, nombre comercial, código de actividad económica
(CAT-019), descripción de actividad, tipo de establecimiento (CAT-009), código de establecimiento,
código de punto de venta, departamento (CAT-012), municipio (CAT-013), dirección complemento,
teléfono, correo electrónico, ambiente (prueba / producción).

**Relaciones:**
- Alimenta el campo `emisor` de todos los DTEs generados

---

### DocumentoDTE
**Responsabilidad:** Representa el documento tributario electrónico en su ciclo de vida
completo, desde su generación hasta su aceptación o rechazo por el MH.

**Atributos clave:** id, venta_id, tipo de DTE (CAT-002), ambiente (CAT-001), modelo de
facturación (CAT-003), tipo de transmisión (CAT-004), código de generación (UUID v4),
número de control, fecha y hora de emisión, JSON sin firma, JSON firmado, sello del MH,
estado (borrador / firmado / transmitido / aceptado / rechazado / anulado), respuesta del MH.

**Relaciones:**
- Un DocumentoDTE se origina desde una Venta (1 a 1)
- Un DocumentoDTE fue firmado por el Firmador Docker
- Un DocumentoDTE fue emitido por un Usuario (cajero)
- Un DocumentoDTE puede generar una NotaCredito o NotaDebito (si se anula o ajusta)

---

### CorrelativoDTE
**Responsabilidad:** Mantiene el contador del número de control por tipo de documento y punto
de venta, garantizando que los números sean secuenciales y únicos.

**Atributos clave:** tipo de DTE, código de establecimiento, código de punto de venta,
último correlativo usado.

**Relaciones:**
- Referenciado al generar cada DocumentoDTE para obtener y reservar el siguiente número

---

### EventoContingencia
**Responsabilidad:** Registra los períodos en que el sistema operó en modo contingencia,
incluyendo la causal y los DTEs emitidos durante ese período.

**Atributos clave:** fecha/hora inicio, fecha/hora fin, causal (CAT-005), descripción,
estado (activa / cerrada).

**Relaciones:**
- Un EventoContingencia contiene múltiples DocumentosDTE emitidos en ese período
- Se cierra cuando se restablece la conectividad y se retransmiten los DTEs pendientes

---

### Turno (Futuro)
**Responsabilidad:** Representa un turno de trabajo, agrupando las ventas, pedidos y actividad
de un período de operación del restaurante.

**Atributos clave:** fecha, hora inicio, hora cierre, usuarios en turno, total ventas del turno,
total DTE emitidos, resumen por forma de pago.

**Relaciones:**
- Un Turno agrupa múltiples Ventas
- Un Turno involucra múltiples Usuarios

---

## Mapa de relaciones conceptuales

```
ConfiguracionEmisora ──────────────────────────────────────────┐
                                                               │ alimenta
                                                               ▼
Usuario ──────────────────────────────────── DocumentoDTE
  │ toma pedido                                     ▲
  │                                                 │ genera
  ▼                                                 │
Mesa ─── tiene ──► Pedido ─── se paga ──► Venta ───┘
                      │                     │
                      │ contiene             │ contiene
                      ▼                     ▼
                 DetallePedido         LineaVenta ◄── Pago
                      │                     │
                      │ referencia           │ referencia
                      ▼                     ▼
                  MenuItem            (precio sin IVA
                      │               calculado de
                      │               CosteoPlatillo)
                      ▼
                 CosteoPlatillo
                      │
                      │ tiene
                      ▼
                  LineaReceta ──► Ingrediente
                                      │
                                 Empaque (si tipo = empaque)


CorrelativoDTE ──► DocumentoDTE ──► EventoContingencia (si aplica)

Receptor ──────────────────────► Venta / DocumentoDTE
```

---

## Entidades por estado

### Existen con soporte completo (DB + PHP + React)
- Usuario (tabla implícita en auth)
- MenuItem (`menu`)
- CosteoPlatillo (`costeo_platillos`)
- LineaReceta (`ingredientes` con `costeo_platillo_id`)
- Ingrediente (`ingredientes` sin `costeo_platillo_id`)
- Empaque (`empaques`)

### Existen solo en UI (sin DB ni backend)
- Mesa (hardcodeada en `GestionMesas.tsx`)
- Pedido (hardcodeado en `Pedidos.tsx`)
- DetallePedido (no existe ni en UI ni en DB)

### No existen en ninguna capa
- Venta
- LineaVenta
- Pago
- Receptor
- ConfiguracionEmisora
- DocumentoDTE
- CorrelativoDTE
- EventoContingencia
- Turno
