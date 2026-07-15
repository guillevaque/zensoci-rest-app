# 03 — Análisis de Base de Datos

## Base de datos

- **Motor:** MySQL (InnoDB, utf8mb4_unicode_ci)
- **Host:** Hostinger
- **Nombre:** `u485160167_zensoci_db`

## Tablas identificadas

### `menu`

Tabla de ítems del menú del restaurante.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT |
| `name` | VARCHAR | Nombre del ítem |
| `category` | VARCHAR | Categoría |
| `price` | DECIMAL | Precio de venta al cliente |
| `description` | VARCHAR | Descripción opcional |
| `image_url` | VARCHAR | URL relativa de imagen |
| `active` | TINYINT(1) | 1 = activo |

> PHP hace alias `name→nombre`, `category→categoria`, `price→precio`, etc.

---

### `ingredientes`

Tabla unificada que sirve tanto para el catálogo de ingredientes del inventario **como** para las
líneas de receta del módulo de costeo. Se diferencia por la columna `costeo_platillo_id`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT UNSIGNED | PK |
| `nombre` | VARCHAR(200) | Nombre |
| `tipo` | ENUM | `'ingrediente'`, `'subreceta'`, `'empaque'` |
| `categoria` | VARCHAR(80) | |
| `marca` | VARCHAR(100) | |
| `presentacion_compra` | VARCHAR(250) | |
| `peso_unitario` | DECIMAL(14,4) | |
| `unidad_medida_compra` | VARCHAR(40) | |
| `proveedor` | VARCHAR(150) | |
| `unidad` | VARCHAR(40) | Unidad de uso en receta |
| `stock` | DECIMAL(12,4) | Stock actual |
| `stock_minimo` | DECIMAL(12,4) | Stock mínimo para alerta |
| `precio_compra` | DECIMAL(10,4) | Precio de compra con IVA |
| `precio_compra_sin_iva` | DECIMAL(10,4) | |
| `tipo_envoltorio` | VARCHAR(100) | |
| `temperatura_compra` | VARCHAR(50) | Ambiente / Refrigerado |
| `unidades_por_caja` | DECIMAL(8,2) | |
| `peso_neto_compra` | DECIMAL(14,4) | |
| `costo_unitario` | DECIMAL(14,8) | Costo por unidad mínima de medida |
| `costeo_platillo_id` | INT UNSIGNED | FK → `costeo_platillos.id`. NULL = catálogo |
| `tipo_receta` | ENUM | `'principal'`, `'secundario'`, `'empaque'` |
| `cantidad` | DECIMAL(12,4) | Cantidad en receta |
| `unidad_medida` | VARCHAR(40) | Unidad en receta |
| `porcentaje_merma` | DECIMAL(6,4) | % de merma (ej. 0.05 = 5%) |
| `precio_ref` | DECIMAL(14,8) | Precio snapshot al momento del costeo |
| `costo_linea` | DECIMAL(10,4) | Costo total de la línea |

**Índices:**
- `idx_nombre` en `nombre`
- `idx_costeo_platillo` en `costeo_platillo_id`
- FK `fk_ing_costeo` → `costeo_platillos(id)` ON DELETE CASCADE

---

### `costeo_platillos`

Resumen financiero de cada platillo del menú.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT UNSIGNED | PK |
| `numero_menu` | TINYINT UNSIGNED | Número de orden (UNIQUE) |
| `nombre` | VARCHAR(150) | |
| `categoria` | VARCHAR(80) | |
| `porciones` | TINYINT UNSIGNED | Porciones por receta |
| `precio_con_iva` | DECIMAL(10,4) | Precio al cliente |
| `precio_sin_iva` | DECIMAL(10,4) | |
| `costo_porcion` | DECIMAL(10,4) | Costo ingredientes / porciones |
| `costo_subreceta` | DECIMAL(10,4) | |
| `costo_empaque` | DECIMAL(10,4) | |
| `costo_unitario` | DECIMAL(10,4) | Costo total por unidad |
| `porcentaje_costo` | DECIMAL(6,4) | ej. 0.35 = 35% |
| `margen_unitario` | DECIMAL(10,4) | |
| `porcentaje_margen` | DECIMAL(6,4) | |
| `incremento_delivery` | DECIMAL(6,4) | Factor adicional delivery |
| `precio_delivery` | DECIMAL(10,4) | |
| `precio_delivery_sin_iva` | DECIMAL(10,4) | |
| `activo` | TINYINT(1) | |
| `ultima_actualizacion` | DATE | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP |

**Catálogo cargado:** 20 platillos en las categorías:
- Entradas (6), Sopas (2), Bowls (3), Especialidades (2), Pasta (2), Sandwich (3), Postres (2)

---

### `empaques`

Catálogo de materiales de empaque.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT | PK |
| `name` | VARCHAR | Nombre |
| `category_label` | VARCHAR | Categoría |
| `brand` | VARCHAR | Marca |
| `supplier` | VARCHAR | Proveedor |
| `presentation` | VARCHAR | Presentación de compra |
| `unit` | VARCHAR | Unidad |
| `units_per_pack` | DECIMAL | |
| `purchase_price_no_iva` | DECIMAL | |
| `unit_cost` | DECIMAL | Costo unitario calculado |
| `stock_qty` | DECIMAL | Stock actual |
| `min_stock` | DECIMAL | Stock mínimo |
| `activo` | TINYINT(1) | Borrado lógico (DELETE → activo=0) |

---

### Tablas de autenticación

> **PENDIENTE DE CONFIRMAR** — Los archivos `headers.php` y `config.php` no están en el repositorio
> Git. Se infiere la existencia de una tabla de usuarios por el comportamiento del sistema:

Columnas inferidas desde el código PHP y TypeScript:

| Columna inferida | Tipo inferido | Fuente de inferencia |
|---|---|---|
| `id` | INT | `$_SESSION['user_id']`, `AuthUser.id` |
| `name` | VARCHAR | `AuthUser.name` |
| `email` | VARCHAR | Login por email |
| `password` | VARCHAR | Login por password |
| `pin` | VARCHAR | Login por PIN de 4 dígitos |
| `role` | ENUM | `'admin'`, `'manager'`, `'staff'`, `'member'` |
| `status` | VARCHAR | `LoginUser.status` |
| `color` | VARCHAR | Color del avatar en pantalla de login |

**Tabla probable:** `usuarios` o `users` — PENDIENTE DE CONFIRMAR nombre exacto.

---

## Relaciones

```
costeo_platillos (1) ───< ingredientes (N)
  [id]                    [costeo_platillo_id]

menu (independiente — no tiene FK a costeo_platillos actualmente)
empaques (independiente — referenciado por nombre en costeo.php)
```

## Migraciones identificadas

| Archivo | Propósito |
|---|---|
| `migrations/001_costeo_tables.sql` | Creación inicial de tablas de costeo |
| `migrations/002_costeo_data.sql` | Datos iniciales de costeo |
| `migrations/003_fix_ingredientes.sql` | Corrección de tabla ingredientes |
| `migrations/003_rename_ingredients_to_ingredientes.sql` | Renombrado de tabla |
| `migrations/004_rename_empaques_columns.sql` | Renombrado de columnas de empaques |
| `migrations/005_recrear_ingredientes.sql` | Recreación de la tabla |
| `migrations/final_A_estructura.sql` | Script maestro de estructura |
| `migrations/final_B_datos.sql` | Script maestro de datos |
| `costeo_platillos.sql` | Script alternativo (define también `costeo_detalle_ingredientes`) |
| `unificacion_inventario_costeo.sql` | Script de unificación de tablas |

> **Nota importante:** Existe un script antiguo `costeo_platillos.sql` que define una tabla
> `costeo_detalle_ingredientes` separada. La migración final unificó ese detalle dentro de la
> propia tabla `ingredientes` usando `costeo_platillo_id`. La tabla `costeo_detalle_ingredientes`
> puede o no existir en producción — PENDIENTE DE CONFIRMAR.

## Observaciones para DTE

- La tabla `menu` tiene `price` (precio de venta con IVA). Para DTE se necesitará separar
  `precio_sin_iva` y el monto de IVA. Actualmente `costeo_platillos` ya tiene `precio_sin_iva`
  pero `menu` no.
- No existe ninguna tabla de transacciones/ventas/tickets. Las ventas son simuladas en el frontend
  (datos hardcodeados en `Pedidos.tsx` y `Dashboard.tsx`).
- No existe tabla de clientes (receptores DTE).
- No existe tabla de configuración del emisor (NIT, NRC, dirección, código de actividad económica).
