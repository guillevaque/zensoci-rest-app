# 05 — Brechas DTE

Este documento identifica qué existe, qué falta, y qué puede reutilizarse para implementar la
Facturación Electrónica del Ministerio de Hacienda de El Salvador.

---

## Catálogos MH requeridos (del archivo CAT-001 a CAT-019+)

| Catálogo MH | Uso en DTE | Estado en el sistema |
|---|---|---|
| CAT-001 Ambiente destino | `00`=prueba, `01`=producción | **FALTA** — necesita config |
| CAT-002 Tipo de Documento | `01`=Factura, `03`=CCF, `05`=NC, `06`=ND | **FALTA** — no hay tabla |
| CAT-003 Modelo Facturación | `1`=previo, `2`=diferido | **FALTA** |
| CAT-004 Tipo Transmisión | `1`=normal, `2`=contingencia | **FALTA** |
| CAT-005 Tipo Contingencia | 5 causales | **FALTA** |
| CAT-011 Tipo de ítem | `1`=Bienes, `2`=Servicios, `3`=Ambos | **FALTA** — menú no categoriza |
| CAT-012 Departamento | Código 2 dígitos | **FALTA** en config emisor |
| CAT-013 Municipio | Código 2 dígitos | **FALTA** en config emisor |
| CAT-014 Unidad de Medida | Código numérico (ej. `59`=Unidad) | **FALTA** — `ingredientes.unidad` es texto libre |
| CAT-015 Tributos | `20`=IVA 13% | **FALTA** — IVA calculado pero no estructurado |
| CAT-016 Condición Operación | `1`=Contado, `2`=Crédito | **FALTA** — no se registra |
| CAT-017 Forma de Pago | `01`=Efectivo, `02`=Débito, `03`=Crédito, etc. | **FALTA** — Settings lo menciona pero no se almacena |
| CAT-019 Actividad Económica | Código 5 dígitos | **FALTA** en config emisor |

---

## Brechas por área

### 1. Datos del Emisor (CRÍTICO — todo falta)

El DTE requiere en el encabezado (`emisor`):

| Campo DTE | Fuente posible | Estado |
|---|---|---|
| NIT del emisor | Config Settings | **FALTA** |
| NRC del emisor | Config Settings | **FALTA** |
| Nombre comercial | Settings: "Zensoci · Cocina Vegana" (hardcodeado) | Existe pero no en DB |
| Código de actividad económica (CAT-019) | PENDIENTE DE CONFIRMAR | **FALTA** |
| Dirección (departamento, municipio, complemento) | Settings: "Col. Escalón, San Salvador" (hardcodeado) | Existe pero no en DB |
| Código de establecimiento (CAT-009) | PENDIENTE DE CONFIRMAR | **FALTA** |
| Código de punto de venta | PENDIENTE DE CONFIRMAR | **FALTA** |
| Teléfono | Settings: "+503 0000-0000" (placeholder) | **FALTA dato real** |
| Email | PENDIENTE DE CONFIRMAR | **FALTA** |

**Acción:** Crear tabla `dte_emisor` y pantalla de configuración con persistencia en DB.

---

### 2. Datos del Receptor (CRÍTICO — no existe)

El DTE tipo Factura (consumidor final) puede tener receptor anónimo.
El DTE tipo CCF (Crédito Fiscal) requiere datos completos del receptor.

| Campo DTE | Estado |
|---|---|
| NIT o DUI del receptor | **FALTA** — no hay campo en ningún flujo |
| Nombre/Razón social | **FALTA** |
| NRC (para CCF) | **FALTA** |
| Correo electrónico | **FALTA** |
| Dirección | **FALTA** |

**Acción:** El flujo de cobro/caja debe solicitar estos datos al momento del pago según el tipo de
documento que el cliente solicite.

---

### 3. Tabla de Ventas / Transacciones (CRÍTICO — no existe)

No existe ninguna tabla en DB que registre ventas reales. Los pedidos en `Pedidos.tsx` son datos
hardcodeados en el frontend.

**Faltan:**
- Tabla `ventas` o `tickets` (cabecera del ticket: fecha, cajero, mesa, total, tipo de pago)
- Tabla `venta_detalle` (ítems vendidos: ítem, cantidad, precio unitario, IVA)
- Tabla `dte_documentos` (JSON del DTE firmado, código de generación, sello, estado)

---

### 4. Precio sin IVA en tabla `menu` (MEDIO)

- `menu.price` es el precio **con IVA** (confirmado por Settings: "IVA 13%")
- El DTE requiere el precio **unitario sin IVA** en el cuerpo del documento
- `costeo_platillos` sí tiene `precio_sin_iva` pero `menu` no
- Solución temporal: calcular `price / 1.13` en el momento de generar el DTE
- Solución correcta: agregar columna `price_no_iva` a `menu`

---

### 5. Tipos de ítem del menú (CAT-011)

El MH requiere indicar si cada ítem es Bien (1), Servicio (2), o Ambos (3).
Los platillos de Zensoci son **Bienes** (código `1`) en general.

**Acción:** Este valor puede ser una constante `1` para todos los ítems de menú en la primera
implementación. No requiere modificar la DB de menú.

---

### 6. Unidades de medida normalizadas (CAT-014)

La columna `ingredientes.unidad` usa texto libre (ej: "Gramos", "Mililitro", "Unidad").
El MH usa códigos numéricos:

| Texto libre actual | Código CAT-014 |
|---|---|
| Gramos | 39 |
| Kilogramo | 34 |
| Mililitro | 26 |
| Litro | 23 |
| Unidad | 59 |
| Otro | 99 |

Para DTE de ventas, el ítem del menú se vende por "Unidad" (código `59`).
Para DTE de compras a proveedores (si se implementa), se necesitará el mapeo completo.

---

### 7. Integración con el Firmador (CRÍTICO)

El Firmador Docker solo corre localmente en la máquina del desarrollador.
El backend PHP en Hostinger no puede llamar a `http://localhost:8113`.

**Opciones a definir:**
1. Desplegar el Firmador en el mismo servidor o VPS accesible desde Hostinger
2. Usar un proxy / túnel seguro desde Hostinger hacia el Firmador local
3. El frontend llama directamente al Firmador (arquitectura alternativa no recomendada)

**Esta es la brecha técnica más crítica de infraestructura.**

---

### 8. Correlatividad y Código de Generación

El DTE requiere:
- `codigoGeneracion`: UUID v4 único por documento
- `numeroControl`: formato `DTE-TT-PPPP-XXXXXXXXXXXXXXXXX` (tipo, punto de venta, correlativo)
- `selloRecibido`: retornado por el MH tras transmisión exitosa

**Falta:**
- Tabla para mantener el correlativo por tipo de documento y punto de venta
- Lógica para generar el UUID v4
- Almacenamiento del sello del MH

---

### 9. Modo Contingencia

El MH prevé 5 causales de contingencia (CAT-005). El sistema debe poder emitir DTE en modo
contingencia cuando:
- No hay disponibilidad del MH
- No hay internet
- Falla de sistema

**Falta:** Lógica de contingencia, almacenamiento local temporal, reenvío posterior.

---

## Qué puede reutilizarse

| Elemento existente | Reutilización para DTE |
|---|---|
| `src/services/http.ts` | Llamadas al Firmador y a los endpoints de MH |
| `src/auth/AuthContext.jsx` | Identificar el cajero emisor del DTE |
| Roles de usuario (`admin`, `manager`, `staff`) | Controlar quién puede emitir DTE |
| `costeo_platillos.precio_sin_iva` | Precio base para el cuerpo del DTE |
| `menu.price` | Precio con IVA para mostrar al cliente |
| `menu.id` y `menu.name` | Descripción del ítem en el DTE |
| `empaques.purchase_price_no_iva` | Si los empaques se facturan como ítems |
| Estructura de Layout + Sidebar | Agregar sección "Facturación" sin redeseñar |
| `Settings.tsx` | Base para el formulario de configuración del emisor DTE |
| Patrón CRUD PHP (ingredients.php, menu.php) | Mismo patrón para `dte_documentos.php`, `dte_emisor.php` |
