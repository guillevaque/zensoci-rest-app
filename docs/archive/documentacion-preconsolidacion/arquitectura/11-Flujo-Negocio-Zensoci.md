# 11 — Flujo de Negocio Zensoci

## Entendimiento del negocio

Zensoci es un restaurante de cocina vegana ubicado en El Salvador. Opera con mesas presenciales
y modalidad Pickup (para llevar). Tiene personal de sala (meseros), cocina, cajeros y administración.
El sistema POS gestiona operaciones diarias: mesas, pedidos, menú, inventario, costeo y personal.
La Facturación Electrónica (DTE) debe integrarse como parte del flujo de cobro existente.

---

## Estado actual de cada módulo

### Login / Autenticación
**Qué hace:** Los empleados se autentican seleccionando su tarjeta y digitando un PIN de 4 dígitos.
Los administradores pueden usar email + contraseña como fallback. La sesión vive en una cookie PHP.

**Qué almacena:** Sesión en `$_SESSION['user_id']`. Los datos del usuario (id, nombre, rol, color)
vienen del backend al iniciar sesión.

**Qué genera:** Cookie de sesión. El rol del usuario (`admin`, `manager`, `staff`, `member`)
determina los accesos disponibles.

**Qué consume:** Lista de usuarios activos desde el backend (`/api/auth/users.php`).

**Estado:** **Completamente funcional** con backend PHP y DB real.

---

### Dashboard
**Qué hace:** Muestra un resumen del día: ventas, pedidos, mesas ocupadas, ticket promedio,
gráfico de ventas por hora, top ítems más vendidos, pedidos recientes, actividad en tiempo real.

**Qué almacena:** Nada (sin estado persistente).

**Qué genera:** Nada.

**Qué consume:** Actualmente datos hardcodeados. Debería consumir ventas reales, estado de mesas
y pedidos del día.

**Estado:** UI completa. **Sin backend real**. Todos los datos son ficticios.

**Dependencias faltantes:** Módulo de ventas/pedidos con backend real.

---

### Mesas (GestionMesas)
**Qué hace:** Muestra el mapa de mesas del restaurante (10 mesas + Pickup). Permite ver estado
(libre, ocupada, necesita check), mesero asignado, hora de inicio y total acumulado.

**Qué almacena:** Nada (sin estado persistente).

**Qué genera:** Nada.

**Qué consume:** Actualmente datos hardcodeados (11 mesas de ejemplo).

**Estado:** UI funcional. **Sin backend ni tabla de mesas en DB**.

**Dependencias faltantes:** Tabla `mesas` en DB, endpoint PHP para estado de mesas, vinculación con pedidos.

---

### Pedidos
**Qué hace:** Lista pedidos con estados (En cocina / Listo / Pagado). Permite filtrar por estado.
Tiene botón "Nuevo pedido" e "Imprimir" sin funcionalidad implementada.

**Qué almacena:** Nada.

**Qué genera:** Nada.

**Qué consume:** Actualmente 6 pedidos hardcodeados.

**Estado:** UI funcional. **Sin backend ni tabla de pedidos en DB**.

**Dependencias faltantes:** Todo el ciclo de vida de un pedido (creación, envío a cocina, cierre).
Es el módulo más crítico para DTE porque es el origen de cada venta.

---

### Menú (GestionMenu)
**Qué hace:** CRUD completo de ítems del menú. Filtros por categoría y búsqueda. Subida de imágenes.
Paginación. Disponibilidad (activo/inactivo).

**Qué almacena:** Tabla `menu` (nombre, categoría, precio CON IVA, descripción, imagen, activo).

**Qué genera:** Ítems que aparecen en el POS y en Pedidos para agregar al pedido.

**Qué consume:** API `/api/menu.php`.

**Estado:** **Completamente funcional** con backend PHP y DB real.

**Dependencias faltantes:** Precio sin IVA (actualmente solo tiene precio con IVA). Para DTE se
necesitará separar ambos valores.

---

### Inventario (Ingredients)
**Qué hace:** CRUD de ingredientes del catálogo. Stock actual y mínimo. Alertas de stock bajo y
agotados. Exportación CSV. Búsqueda y filtros.

**Qué almacena:** Tabla `ingredientes` (filas con `costeo_platillo_id IS NULL`): nombre, categoría,
proveedor, unidad, stock, stock mínimo, precio compra, costo unitario.

**Qué genera:** Alertas de reabastecimiento. Valor total del inventario.

**Qué consume:** API `/api/ingredients.php`.

**Estado:** **Completamente funcional** con backend PHP y DB real.

**Dependencias faltantes:** No se descuenta stock automáticamente al vender. No hay integración con
Pedidos ni con Cocina. El descuento de inventario debe ocurrir cuando un pedido se completa.

---

### Recetas / Costeo
**Qué hace:** Visualiza el costeo financiero de cada platillo del menú: precio de venta, costo de
ingredientes, margen, % de costo. Desglose de ingredientes de cada receta con precio snapshot vs.
precio vivo del catálogo. Detecta variaciones de costo (Δ).

**Qué almacena:**
- `costeo_platillos`: resumen financiero por platillo (precio con/sin IVA, costo porción, margen, delivery).
- `ingredientes` (filas con `costeo_platillo_id`): líneas de receta de cada platillo.

**Qué genera:** Información financiera para decisiones de precio y margen.

**Qué consume:** API `/api/costeo.php`. Self-join en `ingredientes` para precio vivo.

**Estado:** **Completamente funcional** con backend PHP y DB real. 20 platillos con costeo.
1 receta completa (Humus Clásico). Las demás recetas tienen solo resumen, sin desglose de ingredientes.

**Dependencias faltantes:** Vinculación entre `costeo_platillos` y `menu` (no hay FK entre ellos
actualmente). Cuando el precio del menú cambia, el costeo debería actualizarse.

---

### Empaques
**Qué hace:** CRUD del catálogo de materiales de empaque (envases, tapas, cubiertos, bolsas, etc.).
Precio de compra sin IVA, costo unitario, stock. Borrado lógico.

**Qué almacena:** Tabla `empaques`.

**Qué genera:** Costo de empaque por platillo (referenciado en costeo por nombre).

**Qué consume:** API `/api/empaques.php`.

**Estado:** **Completamente funcional** con backend PHP y DB real.

---

### Caja / POS
**Qué hace:** Prototipo de punto de venta. Permite seleccionar ítems del menú (lista fija),
ajustar cantidades, ver total y simular un cobro. No tiene conexión con backend.

**Qué almacena:** Estado local React (sin persistencia).

**Qué genera:** Nada.

**Qué consume:** Lista hardcodeada de 4 productos.

**Estado:** **Prototipo sin funcionalidad real**. `POS.tsx` (redirigido a Pedidos) y `Caja.tsx`
(sin ruta en el router) son dos implementaciones paralelas del mismo concepto.

**Dependencias faltantes:** Todo. Es el módulo que debe transformarse en el punto central de
generación de ventas y emisión de DTE.

---

### Reportes
**Qué hace:** Muestra KPIs: ventas brutas, impuestos, propinas, método de pago. Selector de período.
Botón de exportar CSV sin funcionalidad.

**Qué almacena:** Nada.

**Qué genera:** Nada.

**Qué consume:** Datos hardcodeados.

**Estado:** UI básica. **Sin backend real**.

---

### Personal
**Qué hace:** Lista empleados con rol, estado (en turno / libre) y horario. Filtros por tipo.

**Qué almacena:** Nada.

**Qué consume:** 6 empleados hardcodeados.

**Estado:** UI funcional. **Sin backend ni tabla de personal en DB**.

---

### Configuración (Settings)
**Qué hace:** Muestra datos del restaurante: nombre, dirección, teléfono, IVA, impresoras,
métodos de pago. Todo estático.

**Qué almacena:** Nada (sin DB).

**Qué consume:** Valores hardcodeados en el componente.

**Estado:** UI placeholder. **Sin backend ni persistencia**.

**Relevancia crítica para DTE:** Debe evolucionar para almacenar todos los datos del emisor fiscal.

---

## Flujo completo del restaurante — Estado actual vs. Estado futuro

### Estado actual (lo que realmente ocurre hoy)

```
Inicio de turno
    ↓
Empleado se autentica con PIN
    ↓
Ve el Dashboard (datos ficticios)
    ↓
---- SIN FLUJO OPERATIVO REAL ----
No existe creación de pedidos en DB.
No existe envío a cocina.
No existe cobro real.
No existe generación de venta.
```

Los únicos módulos con operación real son:
- Gestión del catálogo de Menú (agregar/editar platos)
- Gestión del Inventario de ingredientes
- Gestión de Empaques
- Consulta de Costeo

El resto del ciclo operativo (mesas → pedido → cocina → cobro → venta → DTE) **no existe aún**.

---

### Flujo futuro propuesto para Zensoci

```
1. LLEGADA DEL CLIENTE
   Cliente llega al restaurante
        ↓
   Mesero selecciona su perfil (ya autenticado con PIN al inicio del turno)
        ↓
   Abre GestionMesas → elige mesa libre o Pickup
        ↓
   Crea nuevo pedido vinculado a esa mesa

2. TOMA DEL PEDIDO
   Mesero accede al POS / módulo de pedido
        ↓
   Busca y agrega ítems del menú al pedido
   (los ítems vienen de la tabla `menu`, activos)
        ↓
   Puede agregar notas por ítem (sin gluten, sin cebolla, etc.)
        ↓
   Puede modificar cantidades o eliminar ítems

3. ENVÍO A COCINA
   Mesero confirma el pedido
        ↓
   El pedido cambia a estado "En cocina"
        ↓
   [Futuro] Notificación a pantalla de cocina (KDS)
        ↓
   Se registra hora de envío

4. PREPARACIÓN Y ENTREGA
   Cocina prepara los ítems
        ↓
   Marca pedido como "Listo"
        ↓
   Mesero recoge y entrega en mesa
        ↓
   Pedido pasa a "Entregado"

5. SOLICITUD DE CUENTA
   Cliente solicita la cuenta
        ↓
   Mesero / Cajero abre el pedido
        ↓
   Ve detalle con subtotal, IVA (13%), propina sugerida (10/15/20%), total
        ↓
   Cliente decide tipo de documento fiscal:
     - Consumidor final → Factura (DTE-01)
     - Empresa con NRC → Comprobante de Crédito Fiscal (DTE-03)
        ↓
   Si CCF: cajero solicita NIT, NRC, nombre, correo del receptor

6. COBRO Y PAGO
   Cajero selecciona forma de pago:
     - Efectivo (CAT-017 código 01)
     - Tarjeta débito (02)
     - Tarjeta crédito (03)
     - Otro
        ↓
   Si efectivo: ingresa monto recibido → calcula cambio
   Si tarjeta: procesa terminal física (Stripe Reader M2)
        ↓
   Sistema registra la venta en DB:
     → crea registro en tabla `ventas`
     → crea registros en tabla `venta_detalle` (1 fila por ítem)
     → calcula subtotal sin IVA, monto IVA, total
        ↓
   Pedido pasa a estado "Pagado"

7. GENERACIÓN Y FIRMA DEL DTE
   PHP genera el JSON del DTE según esquema del MH
        ↓
   PHP llama al Firmador Docker:
     POST http://<firmador>/firmardocumento/
     Body: { nit, activo, passwordPri, dteJson }
        ↓
   Firmador devuelve JSON firmado digitalmente
        ↓
   Sistema guarda en tabla `dte_documentos`:
     - JSON firmado
     - codigoGeneracion (UUID v4)
     - numeroControl (DTE-01-PPPP-XXXXXXXXXXXXXXX)
     - estado: "firmado"

8. TRANSMISIÓN AL MH
   PHP transmite el DTE firmado al API del Ministerio de Hacienda
        ↓
   Si el MH acepta:
     - Guarda selloRecibido
     - Estado → "aceptado"
   Si el MH rechaza:
     - Guarda respuesta con código de error
     - Estado → "rechazado"
     - Cajero ve mensaje de error y razón
   Si no hay internet / MH caído:
     - Modo contingencia (CAT-004 código 2)
     - DTE se guarda localmente pendiente de retransmisión

9. COMPROBANTE AL CLIENTE
   Sistema genera representación gráfica del DTE
        ↓
   Opciones:
     a. Imprime ticket en impresora térmica (Epson TM-T20)
        Incluye: número de control, sello, QR de verificación MH
     b. Envía por correo electrónico al receptor
        ↓
   Pedido se cierra definitivamente

10. DESCUENTO DE INVENTARIO
    Al cerrar el pedido, el sistema descuenta del inventario
    los ingredientes usados según las recetas
    (requiere que las recetas estén completas en costeo)

11. REPORTES
    Los datos de ventas y DTE alimentan:
      - Dashboard (ventas del día, hora pico, top ítems)
      - Reportes (libro de ventas, resumen por período, DTE emitidos)
```

---

## Relación entre módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONFIGURACIÓN                            │
│  Datos del emisor (NIT, NRC, dirección, actividad económica)    │
│  Datos del restaurante (nombre, horario, impresoras)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ alimenta
                           ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  MENÚ    │   │INVENTARIO│   │ COSTEO   │   │ EMPAQUES │
│ (catálogo│   │(stock de │   │(precios, │   │(materiales│
│ de platos│   │ingredien-│   │márgenes, │   │empaque)  │
│ con precio│  │tes)      │   │recetas)  │   │          │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │               │               │
     │ ítems        │ stock         │ precio        │ costo
     │              │ disponible    │ sin IVA       │ unitario
     ▼              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MESAS                                   │
│    Estado de mesas (libre / ocupada / necesita check)           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ mesa asignada
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PEDIDOS                                  │
│  Ciclo de vida: Abierto → En cocina → Listo → Pagado            │
│  Detalle de ítems pedidos, cantidades, notas                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ pedido pagado
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAJA / COBRO (POS)                           │
│  Forma de pago, receptor, tipo de documento fiscal              │
│  Cálculo: subtotal sin IVA + IVA 13% + propina = total         │
└────────────┬────────────────────────────┬───────────────────────┘
             │ genera                     │ genera
             ▼                            ▼
┌────────────────────────┐  ┌─────────────────────────────────────┐
│       VENTA            │  │           DTE                       │
│  Registro contable de  │  │  JSON firmado, transmitido al MH    │
│  la transacción        │  │  Número de control, sello           │
└────────────┬───────────┘  └─────────────────────────────────────┘
             │ alimenta
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       REPORTES                                  │
│  Ventas del día / semana / mes. Libro de ventas. DTE emitidos.  │
│  Top ítems. Hora pico. Forma de pago. Personal.                 │
└─────────────────────────────────────────────────────────────────┘
             │ visualiza
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD                                  │
│  Resumen ejecutivo en tiempo real para el turno activo          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Datos que viajan entre módulos

| Desde | Hacia | Datos |
|---|---|---|
| Menú | POS / Pedidos | id, nombre, precio (con IVA), imagen, activo |
| Costeo | DTE | precio_sin_iva, precio_con_iva (para calcular IVA) |
| Inventario | Costeo | precio_compra, costo_unitario (para recalcular márgenes) |
| Empaques | Costeo | unit_cost (costo empaque por platillo) |
| Configuración | DTE | NIT, NRC, dirección, actividad económica del emisor |
| Login | Pedidos / Caja | user_id, nombre, rol (para registrar quién tomó/cobró) |
| Mesas | Pedidos | mesa_id, nombre de la mesa |
| Pedidos | Venta | detalle de ítems, cantidades, precios, mesa, mesero |
| Venta | DTE | subtotal sin IVA, IVA, total, receptor, forma de pago |
| DTE | Reportes | número de control, sello, estado, fecha |
| Venta | Inventario | cantidades consumidas (para descuento de stock) |

---

## Riesgos identificados

### R1 — No existe flujo operativo real (CRÍTICO)
Los módulos de Mesas, Pedidos, Caja y Reportes no tienen backend. El 70% del flujo operativo
del restaurante existe solo como UI con datos ficticios. DTE depende de que existan ventas reales.

### R2 — Duplicación de clientes HTTP
Existen tres implementaciones de cliente HTTP (`src/api/http.ts`, `src/services/http.ts`, `src/lib/api.ts`).
Si se agrega un cuarto para DTE, el sistema se vuelve difícil de mantener.

### R3 — Desconexión entre Menú y Costeo
La tabla `menu` y `costeo_platillos` son independientes. No hay FK entre ellas. Un platillo puede
existir en el menú sin tener costeo, y viceversa. Para DTE se necesita el precio sin IVA, que solo
está en `costeo_platillos`, no en `menu`.

### R4 — Firmador solo accesible localmente
El Firmador Docker corre en `localhost:8113`. El backend PHP en Hostinger no puede acceder a él.
Esta es la brecha de infraestructura más crítica para la implementación de DTE.

### R5 — Ingredientes como tabla dual
La tabla `ingredientes` sirve tanto como catálogo (inventario) como líneas de receta (costeo).
Este diseño complica las consultas y puede generar inconsistencias si no se maneja con cuidado.

### R6 — Inventario sin descuento automático
El stock no se descuenta al vender. Cuando se implemente el flujo real de ventas, el inventario
debe integrarse con el ciclo de pedidos para mantener coherencia.

### R7 — Recetas incompletas
Solo el Humus Clásico tiene receta completa con desglose de ingredientes. Los otros 19 platillos
tienen solo el resumen financiero. Sin recetas completas no puede haber descuento automático de stock.

### R8 — Datos de personal hardcodeados
El módulo Personal muestra empleados ficticios. La tabla de usuarios (para login) existe en DB,
pero Personal no la consume. No hay forma de gestionar el personal desde la app actualmente.

---

## Recomendaciones

1. **Construir el módulo de Pedidos + Ventas primero.** Sin él, el DTE no tiene de dónde tomar datos.
   Este módulo es el eje central del sistema.

2. **Definir la arquitectura del Firmador antes de implementar DTE.** Proponer y aprobar con el
   equipo si el Firmador va en VPS propio, en Hostinger, o via otro mecanismo.

3. **Unificar los clientes HTTP.** Elegir `src/services/http.ts` (el más completo) y migrar todos
   los módulos a él. Así el cliente DTE será el mismo y se mantiene consistencia.

4. **Vincular Menú con Costeo.** Agregar `costeo_platillo_id` a `menu` o agregar `menu_id` a
   `costeo_platillos`. Esto permitirá obtener el precio sin IVA desde el flujo de venta.

5. **No tocar Inventario, Costeo, Menú, Empaques ni Autenticación.** Funcionan bien. Construir
   alrededor de ellos, no sobre ellos.

6. **Implementar DTE tipo Factura (01) primero.** El CCF (03) puede venir después. La Factura
   cubre el 95%+ de las transacciones de un restaurante a consumidor final.
