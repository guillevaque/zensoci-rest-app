# 14 — ERP Zensoci: Flujos Completos de Negocio

Este documento describe todos los flujos de negocio del restaurante Zensoci, desde la perspectiva
del ERP completo. Cada flujo detalla actores, pasos, módulos involucrados y condiciones de error.

---

## Índice de flujos

| # | Flujo | Tipo |
|---|---|---|
| F-01 | Atención en mesa (flujo principal) | Operativo |
| F-02 | Pedido para llevar (Pickup) | Operativo |
| F-03 | Pedido a domicilio (Delivery) | Operativo |
| F-04 | Cobro con factura a consumidor final | Fiscal |
| F-05 | Cobro con CCF a empresa | Fiscal |
| F-06 | Pago mixto (efectivo + tarjeta) | Fiscal |
| F-07 | Pago parcial / cuenta dividida | Fiscal |
| F-08 | Cancelación de pedido | Operativo |
| F-09 | Cancelación de ítem (dentro de pedido abierto) | Operativo |
| F-10 | Cambio de mesa | Operativo |
| F-11 | Anulación de venta (post-cobro) + Nota de Crédito | Fiscal |
| F-12 | Reimpresión de DTE | Fiscal |
| F-13 | Reenvío de DTE por email | Fiscal |
| F-14 | DTE en contingencia y retransmisión | Fiscal |
| F-15 | Apertura y cierre de turno | Operativo |
| F-16 | Corte de caja | Operativo |
| F-17 | Recepción de compra de insumos | Inventario |
| F-18 | Alerta de stock bajo | Inventario |
| F-19 | Actualización de precio del menú | Configuración |
| F-20 | Alta de nuevo empleado | Administración |
| F-21 | Configuración inicial del emisor DTE | Fiscal |

---

## F-01 — Atención en mesa (flujo principal)

**Actores:** Mesero, Cocina, Cajero
**Módulos:** MOD-04 Mesas → MOD-05 Pedidos → MOD-06 KDS → MOD-07 POS → MOD-08 Ventas → MOD-09 Pagos → MOD-10 DTE

### Pasos

```
1. APERTURA DE MESA
   Mesero selecciona mesa libre en GestionMesas
   Sistema valida que la mesa esté en estado "libre"
   Sistema cambia estado mesa → "ocupada"
   Sistema registra hora de apertura

2. TOMA DEL PEDIDO
   Mesero abre nuevo pedido asociado a la mesa
   Mesero agrega ítems desde el catálogo del menú
   Para cada ítem:
     - Sistema guarda precio_snapshot (precio al momento de agregar)
     - Sistema guarda nombre_snapshot
   Mesero puede agregar notas por ítem (sin gluten, sin cebolla, etc.)
   Mesero confirma el pedido → Estado pedido: "en_cocina"

3. PRODUCCIÓN EN COCINA
   KDS muestra los ítems del pedido ordenados por hora de entrada
   Cocinero marca cada ítem: "en_preparacion" → "listo"
   Cuando todos los ítems están listos:
     Sistema actualiza estado pedido → "listo"
     Sistema puede notificar al mesero (futuro)

4. ENTREGA EN MESA
   Mesero lleva el pedido a la mesa
   Mesero marca pedido como "entregado" en la app
   Estado pedido → "entregado"

5. COBRO
   Cliente solicita la cuenta
   Cajero abre el pedido desde el POS/Caja
   Sistema muestra resumen: ítems, subtotal sin IVA, IVA 13%, total
   Cajero selecciona tipo de DTE:
     - "Factura" para consumidor final
     - "CCF" si el cliente es empresa
   Cajero registra la forma de pago
   Sistema calcula el vuelto (si aplica)
   Cajero confirma el cobro

6. REGISTRO DE VENTA
   Sistema crea registro en "ventas" con totales definitivos
   Sistema crea registros en "venta_items" (con precio_sin_iva)
   Sistema crea registro(s) en "pagos"
   Estado venta → "completada"

7. EMISIÓN DEL DTE
   Sistema construye JSON del DTE (identificacion, emisor, receptor, cuerpo, resumen)
   Sistema asigna codigo_generacion (UUID v4)
   Sistema asigna numero_control (DTE-01-PPPP-XXXXXXXXXXXXXXXXX)
   Sistema envía JSON al Firmador Docker
   Firmador devuelve JSON firmado
   Sistema transmite JSON firmado al API del MH
   MH responde con sello_recibido
   Sistema guarda sello en dte_documentos
   Estado DTE → "aceptado"

8. CIERRE DE MESA
   Sistema actualiza estado pedido → "pagado"
   Sistema libera la mesa → estado "libre"
   Cajero muestra número de control y sello al cliente
   Opcionalmente: imprime ticket o envía DTE por email

9. DESCUENTO DE INVENTARIO (futuro)
   Sistema descuenta ingredientes y empaques según receta de cada ítem vendido
```

### Condiciones de error

| Condición | Manejo |
|---|---|
| Mesa ya está ocupada | No permitir abrir pedido; mostrar error |
| Ítem del menú desactivado durante el pedido | Permitir continuar con snapshot; alertar al cajero |
| Firmador no disponible | Ofrecer modo contingencia; guardar DTE en cola |
| MH rechaza el DTE | Mostrar código de error; ofrecer reintento o contingencia |
| Pago no alcanza el total | No permitir cerrar el cobro; mostrar diferencia |

---

## F-02 — Pedido para llevar (Pickup)

**Actores:** Mesero o Cajero
**Diferencias vs F-01:** Mesa = "Pickup" (mesa especial fija), sin etapa de "entrega en mesa"

### Pasos

```
1. Cliente llega o llama para pedir
2. Mesero selecciona mesa "Pickup" en lugar de mesa regular
3. Toma del pedido (igual que F-01 pasos 2-3)
4. Cuando cocina marca listo:
   Estado pedido → "listo para recoger"
5. Cliente llega a recoger y paga
6. Cobro y DTE igual que F-01 pasos 5-8
7. No hay liberación de mesa (Pickup siempre queda disponible)
```

---

## F-03 — Pedido a domicilio (Delivery)

**Actores:** Mesero o Operador
**Diferencias vs F-01:** Mesa = "Delivery" (mesa especial), puede involucrar plataforma externa

### Pasos

```
1. Pedido llega por plataforma (Uber Eats, app propia, teléfono)
2. Operador crea pedido con mesa "Delivery"
3. Agrega datos de entrega: dirección, nombre del cliente, teléfono
4. Proceso de cocina igual que F-01
5. Cobro puede ser:
   - Pre-pagado por plataforma → registrar como "pre-cobrado"
   - Cobro al entregar → registrar al confirmar entrega
6. DTE si aplica
```

**Nota:** La integración con plataformas externas (Uber Eats) está fuera del alcance inicial.

---

## F-04 — Cobro con Factura a consumidor final

**Actores:** Cajero
**Módulos:** MOD-07 POS, MOD-08 Ventas, MOD-09 Pagos, MOD-10 DTE

### Pasos detallados del DTE

```
1. Cajero selecciona tipo DTE = "Factura" (código 01)
2. Receptor = consumidor final (anónimo)
   Campo receptor en DTE:
     - tipoDocumento: null (o "13" para DUI si el cliente lo proporciona)
     - nombre: "Consumidor Final"
     - correo: null
3. Sistema construye cuerpoDocumento:
   Para cada ítem:
     - numItem: correlativo
     - tipoItem: 1 (Bienes)
     - numeroDocumento: null
     - cantidad: unidades pedidas
     - codigo: menu_id (opcional)
     - uniMedida: 59 (Unidad — CAT-014)
     - descripcion: nombre_snapshot
     - precioUni: precio_sin_iva con 8 decimales
     - montoDescu: 0 (sin descuento)
     - ventaNoSuj: 0
     - ventaExenta: 0
     - ventaGravada: precio_sin_iva * cantidad
     - tributos: ["20"] (IVA 13%)
     - psv: 0
     - noGravado: 0
     - ivaItem: precio_sin_iva * cantidad * 0.13
4. Sistema construye resumen:
     - totalNoSuj: 0
     - totalExenta: 0
     - totalGravada: suma de ventaGravada
     - subTotalVentas: totalGravada
     - descuNoSuj/Exenta/Gravados: 0
     - porcentajeDescuento: 0
     - totalDescu: 0
     - tributos: [{ codigo: "20", descripcion: "IVA 13%", valor: totalGravada * 0.13 }]
     - subTotal: totalGravada
     - ivaRete1: 0
     - reteRenta: 0
     - montoTotalOperacion: totalGravada + IVA (= precio_con_iva total)
     - totalNoGravado: 0
     - totalPagar: montoTotalOperacion
     - totalLetras: "DOCE 00/100 DÓLARES" (en palabras)
     - saldoFavor: 0
     - condicionOperacion: 1 (Contado — CAT-016)
     - pagos: [{ codigo: "01", montoPago: totalPagar, referencia: null }]
```

---

## F-05 — Cobro con CCF a empresa

**Actores:** Cajero
**Diferencias vs F-04:** tipo DTE = "03", requiere datos completos del receptor

### Pasos adicionales

```
1. Cajero selecciona tipo DTE = "CCF" (código 03)
2. Sistema solicita datos del receptor:
   - NIT del cliente (formato XXXX-XXXXXX-XXX-X)
   - NRC del cliente
   - Nombre o razón social
   - Código de actividad económica
   - Dirección
   - Correo electrónico (opcional)
3. Cajero puede buscar cliente en catálogo (MOD-03)
   o ingresar datos manualmente (solo esa vez)
4. Si es cliente frecuente: guardar en catálogo
5. El resto del DTE igual que F-04 pero:
   - tipoDocumento: "36" (NIT)
   - El receptor tiene campos adicionales: NRC, codActividad, direccion
```

---

## F-06 — Pago mixto (efectivo + tarjeta)

**Actores:** Cajero
**Módulos:** MOD-09 Pagos, MOD-10 DTE

### Pasos

```
1. Total de la cuenta: $25.00
2. Cliente paga:
   - $15.00 con tarjeta de débito
   - $10.00 en efectivo
3. Sistema registra dos pagos:
   - Pago 1: forma_pago = "02" (Débito), monto = 15.00, referencia = "VOUCHER#12345"
   - Pago 2: forma_pago = "01" (Efectivo), monto = 10.00
4. Sistema valida: suma de pagos = total de venta
5. En el DTE, campo "pagos" del resumen incluye ambas formas:
   [
     { codigo: "02", montoPago: 15.00, referencia: "VOUCHER#12345" },
     { codigo: "01", montoPago: 10.00, referencia: null }
   ]
6. Vuelto = 0 (pagó exacto)
```

---

## F-07 — División de cuenta

**Actores:** Cajero, Mesero
**Contexto:** Dos o más clientes quieren pagar por separado los ítems de una misma mesa

### Pasos

```
1. Cajero accede al pedido de la mesa
2. Cajero selecciona "Dividir cuenta"
3. Cajero asigna ítems a "Cuenta A" y "Cuenta B"
4. Sistema genera dos sub-cobros independientes:
   - Cada sub-cobro genera su propia Venta
   - Cada Venta genera su propio DTE
5. La mesa se libera cuando TODOS los sub-cobros están pagados
```

**Nota:** Esta funcionalidad es compleja; puede implementarse en una fase posterior como
generación de dos pedidos separados desde la misma mesa.

---

## F-08 — Cancelación de pedido completo

**Actores:** Mesero, Manager (si el pedido ya fue a cocina)
**Módulos:** MOD-05 Pedidos, MOD-04 Mesas

### Pasos

```
1. Mesero o manager selecciona el pedido activo
2. Si estado = "abierto": cancelación directa (sin aprobación)
3. Si estado = "en_cocina" o "listo": requiere autorización de manager
4. Sistema registra motivo de cancelación
5. Estado pedido → "cancelado"
6. Sistema libera la mesa → "libre"
7. KDS elimina los ítems pendientes de la vista de cocina
8. Si había ítems ya preparados: queda registro para control de desperdicio (futuro)
```

---

## F-09 — Cancelación de ítem dentro de pedido abierto

**Actores:** Mesero
**Módulos:** MOD-05 Pedidos, MOD-06 KDS

### Pasos

```
1. Mesero abre el pedido en curso
2. Mesero selecciona el ítem a cancelar
3. Si el ítem está en estado "pendiente": cancelación directa
4. Si el ítem ya está "en_preparacion" o "listo": notificar a cocina que ya no se sirve
5. Estado ítem → "cancelado"
6. Sistema recalcula el total del pedido (sin el ítem cancelado)
7. KDS refleja la cancelación inmediatamente
```

---

## F-10 — Cambio de mesa

**Actores:** Mesero
**Módulos:** MOD-04 Mesas, MOD-05 Pedidos

### Pasos

```
1. Mesero selecciona el pedido activo de la mesa origen
2. Mesero solicita "Cambiar de mesa"
3. Sistema muestra mesas libres disponibles
4. Mesero selecciona la mesa destino
5. Sistema:
   - Actualiza pedido.mesa_id → mesa destino
   - Cambia estado mesa origen → "libre"
   - Cambia estado mesa destino → "ocupada"
6. El KDS no cambia (los ítems siguen siendo los mismos)
```

---

## F-11 — Anulación de venta + Nota de Crédito

**Actores:** Manager, Cajero
**Módulos:** MOD-08 Ventas, MOD-11 Notas de Crédito, MOD-10 DTE

### Pasos

```
1. Manager accede a la venta a anular (por número de ticket o fecha)
2. Manager selecciona "Anular venta"
3. Sistema verifica que el DTE asociado esté en estado "aceptado"
4. Manager ingresa motivo de anulación
5. Sistema genera Nota de Crédito (DTE tipo 05):
   - Referencias el código_generacion del DTE original
   - Monto = monto total de la venta
   - Motivo = el ingresado por el manager
6. Sistema firma y transmite la NC al MH
7. Si el MH acepta:
   - Estado venta → "anulada"
   - Estado DTE original → "anulado"
   - NC queda en estado "aceptado"
8. Sistema registra en auditoría: quién, cuándo, por qué
```

**Restricción del MH:** La NC debe emitirse dentro del mismo mes fiscal del DTE original.

---

## F-12 — Reimpresión de DTE

**Actores:** Cajero, Manager
**Módulos:** MOD-10 DTE

### Pasos

```
1. Cajero busca la venta (por número de ticket, fecha, o nombre del cliente)
2. Sistema muestra el DTE asociado con su estado
3. Cajero selecciona "Reimprimir" o "Descargar PDF"
4. Sistema genera la representación gráfica del DTE con:
   - Número de control
   - Código de generación
   - Sello del MH
   - QR con URL de verificación del MH
5. Sistema genera PDF o envía a impresora térmica
```

---

## F-13 — Reenvío de DTE por email

**Actores:** Cajero
**Módulos:** MOD-10 DTE

### Pasos

```
1. Cajero busca la venta
2. Cajero selecciona "Enviar por email"
3. Sistema solicita correo electrónico del destinatario
   (pre-poblado si el receptor está en el catálogo de clientes)
4. Sistema envía el DTE en formato PDF o XML al correo
5. Sistema registra el envío (fecha, hora, destinatario)
```

**Prerrequisito:** SMTP configurado en el servidor Hostinger.

---

## F-14 — DTE en contingencia y retransmisión

**Actores:** Sistema (automático), Manager
**Módulos:** MOD-10 DTE, MOD-13 Contingencia

### Pasos — Activación de contingencia

```
1. Sistema intenta transmitir un DTE al MH
2. El intento falla (timeout, error HTTP 5xx, sin internet)
3. Sistema detecta que el MH o el Firmador no están disponibles
4. Sistema activa modo contingencia:
   - tipo_transmision en DTEs nuevos → 2 (contingencia)
   - Se registra EventoContingencia con causal (CAT-005) y hora de inicio
5. El cajero puede continuar cobrando:
   - Los DTEs se generan con tipo_transmision = 2
   - Se guardan en DB con estado "borrador"
   - El cliente recibe un número de control provisional
6. Sistema muestra banner de "Modo Contingencia Activo" en la interfaz
```

### Pasos — Retransmisión al recuperar conectividad

```
1. Manager detecta que la conectividad se restauró
2. Manager accede a "Contingencia" y selecciona "Retransmitir"
3. Sistema envía los DTEs en cola al MH en orden cronológico
4. Para cada DTE:
   - Sistema firma con el Firmador
   - Sistema transmite al MH
   - Si el MH acepta: estado → "aceptado", guarda sello
   - Si el MH rechaza: registrar error, continuar con siguiente
5. Al terminar: sistema cierra el EventoContingencia
6. Manager revisa los rechazados y decide si emitir NC o corregir
```

---

## F-15 — Apertura y cierre de turno

**Actores:** Manager, Administrador
**Módulos:** MOD-25 Turnos, MOD-02 Usuarios

### Apertura

```
1. Manager llega al inicio de la jornada
2. Manager abre nuevo turno desde el Panel de Turnos
3. Sistema registra: fecha, hora_apertura, usuario que abrió
4. Sistema activa el turno → estado "activo"
5. Solo puede haber un turno activo a la vez
```

### Cierre

```
1. Manager finaliza la jornada
2. Manager abre el módulo de cierre de turno
3. Sistema muestra resumen del turno:
   - Total de ventas del turno
   - Número de DTEs emitidos
   - Desglose por forma de pago
4. Manager confirma el cierre
5. Sistema registra hora_cierre y usuario que cerró
6. Estado turno → "cerrado"
7. Sistema dispara generación del Corte de Caja (F-16)
```

---

## F-16 — Corte de caja

**Actores:** Manager, Cajero
**Módulos:** MOD-26 Cortes de Caja, MOD-09 Pagos, MOD-08 Ventas

### Pasos

```
1. Al cerrar el turno, cajero cuenta el efectivo físico en la caja
2. Cajero ingresa en el sistema:
   - Monto de efectivo físico contado
3. Sistema calcula:
   - Efectivo esperado = suma de ventas pagadas con efectivo (CAT-017: "01")
   - Diferencia = efectivo real - efectivo esperado
4. Sistema muestra el resumen del corte:
   - Total ventas del turno
   - Desglose: efectivo / débito / crédito / transferencia
   - Diferencia en efectivo (sobrante o faltante)
   - Total DTE emitidos
5. Manager aprueba y cierra el corte
6. Sistema registra el corte con firma del manager
7. Si hay diferencia: sistema genera alerta y registra en auditoría
```

---

## F-17 — Recepción de compra de insumos

**Actores:** Encargado de inventario
**Módulos:** MOD-19 Compras, MOD-20 Proveedores, MOD-16 Ingredientes, MOD-17 Empaques

### Pasos

```
1. Llega el pedido del proveedor
2. Encargado accede al módulo de Compras
3. Selecciona el proveedor
4. Agrega los ítems recibidos:
   - Ingrediente o empaque
   - Cantidad recibida
   - Precio unitario de la factura del proveedor
5. Sistema genera borrador de la compra
6. Encargado verifica los ítems contra la factura física
7. Encargado confirma la compra
8. Sistema actualiza:
   - stock_actual de cada ingrediente/empaque
   - precio_compra (si cambió)
9. Sistema registra en auditoría
```

---

## F-18 — Alerta de stock bajo

**Actores:** Sistema (automático), Encargado de inventario
**Módulos:** MOD-16 Ingredientes, MOD-17 Empaques, MOD-23 Dashboard

### Pasos

```
1. Trigger: cada vez que se actualiza el stock de un ingrediente o empaque
   (por venta, por compra, por ajuste manual)
2. Sistema compara stock_actual < stock_minimo
3. Si hay alerta:
   - Sistema registra el evento "ingrediente.stock_bajo"
   - Dashboard muestra alerta en tiempo real
   - (Futuro) Sistema envía notificación push o email al encargado
4. La alerta se desactiva cuando el stock vuelve a superar el mínimo
```

---

## F-19 — Actualización de precio del menú

**Actores:** Manager, Administrador
**Módulos:** MOD-14 Menú, MOD-05 Pedidos, MOD-15 Costeo

### Pasos

```
1. Manager accede al catálogo de menú
2. Selecciona el ítem a actualizar
3. Modifica precio_con_iva y/o precio_sin_iva
4. Sistema valida coherencia: precio_sin_iva * 1.13 ≈ precio_con_iva
5. Sistema guarda el nuevo precio
6. IMPORTANTE: Los pedidos ya abiertos mantienen el precio_snapshot anterior
7. Los nuevos pedidos usarán el precio actualizado
8. Sistema registra en auditoría: precio anterior, precio nuevo, usuario, timestamp
9. El costeo live se recalcula automáticamente con el nuevo precio
```

---

## F-20 — Alta de nuevo empleado

**Actores:** Administrador
**Módulos:** MOD-02 Usuarios, MOD-01 Seguridad

### Pasos

```
1. Admin accede al módulo de Personal
2. Admin completa el formulario:
   - Nombre, email, contraseña inicial
   - Rol: admin / manager / staff / member
   - Color de avatar
   - PIN de acceso rápido (4 dígitos)
3. Sistema valida:
   - Email único en el sistema
   - PIN no repetido entre empleados activos
4. Sistema crea el usuario (contraseña hasheada, PIN hasheado)
5. Sistema registra en auditoría
6. El empleado aparece inmediatamente en la pantalla de selección de PIN del login
```

---

## F-21 — Configuración inicial del emisor DTE

**Actores:** Administrador
**Módulos:** MOD-22 Configuración Fiscal, MOD-10 DTE

### Pasos (se hace una sola vez antes de emitir el primer DTE)

```
1. Admin accede a Configuración → Facturación Electrónica
2. Admin ingresa los datos del emisor:
   - NIT (formato XXXX-XXXXXX-XXX-X)
   - NRC
   - Nombre legal y nombre comercial
   - Código de Actividad Económica (CAT-019)
   - Tipo de Establecimiento (CAT-009)
   - Código de Establecimiento (asignado por el MH)
   - Código de Punto de Venta (asignado por el MH)
   - Departamento (CAT-012): código 2 dígitos
   - Municipio (CAT-013): código 2 dígitos
   - Dirección complemento
   - Teléfono
   - Email fiscal
   - Ambiente: "00" (prueba) o "01" (producción)
3. Admin configura el correlativo inicial:
   - Tipo de DTE: "01" (Factura)
   - Último correlativo: 0 (primer DTE será el #1)
4. Sistema guarda la configuración
5. Admin realiza prueba de emisión con un DTE de prueba
6. Si el DTE de prueba es aceptado: confirmar ambiente producción
```

---

## Mapa de transiciones de estado

### Pedido

```
abierto → en_cocina → listo → entregado → pagado
                                         ↑
abierto → cancelado
en_cocina → cancelado (con autorización)
```

### Venta

```
completada → anulada (con NC emitida)
```

### DTE

```
borrador → firmado → transmitido → aceptado
                   → rechazado
borrador → (contingencia) → firmado → transmitido → aceptado
aceptado → anulado (con NC aceptada)
```

### Mesa

```
libre → ocupada → libre
libre → fuera_de_servicio → libre
ocupada → necesita_check → ocupada
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
