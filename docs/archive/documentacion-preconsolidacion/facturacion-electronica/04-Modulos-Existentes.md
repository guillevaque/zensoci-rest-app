# 04 — Módulos Existentes

## Estado general

El POS tiene módulos en distintos estados de madurez:
- **Completamente funcionales:** Inventario, Menú, Costeo, Empaques (con backend PHP + DB real)
- **UI funcional, datos hardcodeados:** Pedidos, Dashboard, Reports, Personal, Mesas
- **Prototipo/placeholder:** Caja, Settings

---

## Módulo: Autenticación

**Archivos:** `src/auth/AuthContext.jsx`, `src/auth/ProtectedRoute.jsx`, `src/services/auth.service.ts`

**Qué hace:**
- Mantiene sesión de usuario vía cookie PHP
- Soporta dos flujos: login por PIN (operadores) y email+password (admin)
- Al cargar la app llama a `/api/auth/me.php` para verificar sesión activa
- Redirige a `/login` si no hay sesión

**Datos del usuario disponibles en sesión:**
```ts
{ id: number, name: string, email: string, role: 'admin'|'manager'|'staff'|'member' }
```

**Relevancia para DTE:** El `user_id` de sesión puede vincularse al cajero que emite el DTE.
El sistema ya tiene roles que podrían determinar quién puede emitir documentos.

---

## Módulo: Dashboard

**Archivo:** `src/pages/Dashboard.tsx`

**Qué hace:**
- Muestra estadísticas del día: ventas, pedidos, mesas ocupadas, ticket promedio
- Gráfico de barras de ventas por hora
- Tabla de pedidos recientes
- Feed de actividad en tiempo real
- Selector de período (Hoy / Semana / Mes)

**Estado:** UI completa. **Todos los datos son hardcodeados** (sin consumir API).

**Relevancia para DTE:** Podría mostrar un resumen de DTE emitidos del día (facturas, CCF, etc.)
una vez que exista backend de ventas.

---

## Módulo: Mesas (GestionMesas)

**Archivo:** `src/pages/GestionMesas.tsx`

**Qué hace:** Gestión de mesas del restaurante.

**Estado:** PENDIENTE DE CONFIRMAR — archivo existe pero no se leyó en detalle.

---

## Módulo: Pedidos

**Archivo:** `src/pages/Pedidos.tsx`

**Qué hace:**
- Lista pedidos con filtros: Todos / En cocina / Listos / Pagados
- Muestra: ID pedido, mesa/pickup, mesero, estado, total
- Botón "Nuevo pedido" (sin funcionalidad implementada)
- Botón "Imprimir →" por fila (sin funcionalidad)

**Estado:** UI completamente funcional. **Datos hardcodeados** (6 pedidos de ejemplo).

**Observación crítica para DTE:** Este módulo es el punto natural de emisión de DTE.
Al marcar un pedido como "Pagado" debería dispararse la generación y emisión del documento fiscal.
Actualmente no existe flujo de pago real ni integración con el backend.

---

## Módulo: Menú (GestionMenu)

**Archivo:** `src/pages/GestionMenu.tsx`, `src/api/menu.ts`, `menu.php`

**Qué hace:**
- CRUD completo de ítems del menú
- Subida de imágenes (via `upload.php`)
- Filtros por categoría y búsqueda por nombre
- Modal de creación/edición (`MenuModal.tsx`)

**Backend PHP:** `menu.php` — completamente funcional, consulta tabla `menu`.

**Datos en DB:** Ítems reales cargados (nombre, categoría, precio con IVA, imagen, activo).

**Relevancia para DTE:** El campo `price` de `menu` es el precio con IVA. Para el cuerpo del DTE
se necesitará el precio sin IVA y el monto de IVA por ítem. Actualmente `menu` no tiene
`price_no_iva`. Puede calcularse: `price / 1.13` para el 13% de El Salvador.

---

## Módulo: Inventario

**Archivo:** `src/pages/Inventory.tsx`, `src/services/ingredients.service.ts`, `ingredients.php`

**Qué hace:**
- CRUD completo de ingredientes
- Filtros: todos / bajo stock / agotados
- Búsqueda por nombre, categoría, proveedor
- Exportación CSV
- Alertas visuales de stock mínimo
- Modal de creación/edición (`IngredientModal.tsx`)
- Estadísticas: valor total del inventario, conteo de bajo stock y agotados

**Backend PHP:** `ingredients.php` — funcional, consulta tabla `ingredientes`
(solo filas donde `costeo_platillo_id IS NULL`).

**Datos en DB:** 42+ ingredientes con datos reales de proveedores y costos unitarios.

**Relevancia para DTE:** Los proveedores en `ingredientes` tienen nombre pero no NIT/NRC.
Si en el futuro se emiten CCF (Crédito Fiscal) para compras, se necesitarán datos fiscales del proveedor.

---

## Módulo: Costeo

**Archivo:** `src/pages/Costeo.tsx`, `src/api/costeo.ts`, `costeo.php`

**Qué hace:**
- Visualización de costeo de platillos: precio, costo, margen, % costo
- Desglose de ingredientes por receta con costo vivo vs. snapshot
- Filtros por categoría y búsqueda
- Actualización de precios (PUT)

**Backend PHP:** `costeo.php` — funcional, consulta tablas `costeo_platillos` e `ingredientes`.
Usa un self-join para obtener el precio actual del catálogo vs. el precio snapshot de la receta.

**Datos en DB:** 20 platillos con costeo completo; 1 receta detallada (Humus Clásico).

**Relevancia para DTE:** Los datos de costeo tienen `precio_con_iva` y `precio_sin_iva` por platillo.
Esta información puede alimentar el cuerpo del DTE. El `porcentaje_costo` y `margen` son útiles
para reportes internos pero no forman parte del DTE.

---

## Módulo: Empaques

**Archivo:** `src/pages/Empaques.tsx`, `src/api/empaques.ts`, `empaques.php`

**Qué hace:**
- CRUD completo del catálogo de materiales de empaque
- Filtros: todos / bajo stock / agotados
- Borrado lógico (activo=0)

**Backend PHP:** `empaques.php` — funcional, consulta tabla `empaques`.

**Relevancia para DTE:** Los empaques tienen `purchase_price_no_iva` y `unit_cost`. Si se factural
empaques como ítems separados, estos datos son la base del precio unitario sin IVA.

---

## Módulo: Reportes

**Archivo:** `src/pages/Reports.tsx`

**Qué hace:**
- Muestra 4 KPIs: ventas brutas, impuestos, propinas, método de pago
- Filtros de período: Hoy / Esta semana / Mes / Año
- Botón "Exportar CSV" (sin funcionalidad real)
- Placeholder "Más reportes próximamente"

**Estado:** UI básica funcional. **Todos los datos son hardcodeados**.

**Relevancia para DTE:** Será el lugar natural para el reporte de DTE emitidos, anulados,
contingencias, y el libro de ventas a consumidor final.

---

## Módulo: Personal

**Archivo:** `src/pages/Personal.tsx`

**Qué hace:**
- Lista de empleados con foto/avatar, rol, estado (en turno / libre), horario
- Filtros por tipo: Todos / Meseros / Cocina / Admin
- Botón "Agregar persona" (sin funcionalidad)

**Estado:** UI funcional. **Datos hardcodeados** (6 empleados de ejemplo).

**Relevancia para DTE:** El mesero/cajero que procesa el pago debería quedar registrado en el DTE
como referencia interna. No es campo obligatorio del DTE pero es útil para auditoría.

---

## Módulo: Configuración (Settings)

**Archivo:** `src/pages/Settings.tsx`

**Qué hace:**
- Muestra grupos de configuración: Restaurante, Impuestos & propina, Impresoras, Pagos
- Todos los valores son **estáticos hardcodeados**
- Botones "Editar →" sin funcionalidad

**Datos visibles:**
- Nombre: "Zensoci · Cocina Vegana"
- Dirección: "Col. Escalón, San Salvador"
- IVA: 13%
- Terminal: Stripe Reader M2
- Métodos: Tarjeta / Efectivo / QR

**Relevancia para DTE (CRÍTICA):** Este módulo debe evolucionar para almacenar y gestionar los datos
del **emisor DTE**: NIT, NRC, nombre comercial, código de actividad económica, dirección fiscal,
código de establecimiento, etc. Actualmente no existe backend ni DB para esta información.

---

## Módulo: Caja

**Archivo:** `src/pages/Caja.tsx`

**Qué hace:**
- Prototipo de caja básica: agrega ítems de un menú fijo, calcula total
- Botón "Cobrar" muestra `alert('Cobro simulado')`
- Botón "Nuevo" limpia la lista

**Estado:** **Prototipo sin backend.** No está registrado en el router principal (no tiene ruta).

**Relevancia para DTE:** Este componente puede convertirse en el módulo de emisión de DTE una vez
que se integre con:
1. Pedidos reales desde DB
2. Flujo de pago real
3. Generación y firma del JSON del DTE
4. Envío al MH via Firmador

---

## Módulo: POS

**Archivo:** `src/pages/POS.tsx`

**Estado:** Existe el archivo. El router lo redirige a `/pedidos`. PENDIENTE DE CONFIRMAR contenido.
