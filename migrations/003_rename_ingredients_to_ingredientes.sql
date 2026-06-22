-- ============================================================
-- ZENSOCI POS — Migración 003: Renombrar y enriquecer tabla ingredients
-- Base de datos: u485160167_zensoci_db (Hostinger)
--
-- QUÉ HACE ESTE SCRIPT:
--   1. Renombra la tabla ingredients → ingredientes
--   2. Renombra columnas a español (para que ingredients.php funcione sin aliases)
--   3. Agrega campos faltantes del Excel "Ingredientes"
--   4. Agrega campos necesarios para el módulo de Costeo (líneas de receta)
--
-- REQUIERE: ejecutar ANTES 001_costeo_tables.sql (crea costeo_platillos)
-- ORDEN DE EJECUCIÓN: ejecutar este script COMPLETO antes del 002_costeo_data.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PASO 1: Renombrar tabla
-- ────────────────────────────────────────────────────────────
RENAME TABLE `ingredients` TO `ingredientes`;


-- ────────────────────────────────────────────────────────────
-- PASO 2: Renombrar columnas existentes a español
--   Columna actual          → Columna nueva
--   name                    → nombre
--   category_label          → categoria
--   supplier                → proveedor
--   unit                    → unidad          (unidad de medida de inventario)
--   stock_qty               → stock
--   min_stock               → stock_minimo
--   cost                    → precio_compra   (precio de compra por presentación c/IVA)
-- ────────────────────────────────────────────────────────────
ALTER TABLE `ingredientes`
  CHANGE COLUMN `name`           `nombre`         VARCHAR(200)   NOT NULL,
  CHANGE COLUMN `category_label` `categoria`      VARCHAR(80)    DEFAULT NULL,
  CHANGE COLUMN `supplier`       `proveedor`      VARCHAR(150)   DEFAULT NULL,
  CHANGE COLUMN `unit`           `unidad`         VARCHAR(40)    DEFAULT NULL   COMMENT 'Unidad de medida para inventario (kg, L, unidad…)',
  CHANGE COLUMN `stock_qty`      `stock`          DECIMAL(12,4)  NOT NULL DEFAULT 0,
  CHANGE COLUMN `min_stock`      `stock_minimo`   DECIMAL(12,4)  NOT NULL DEFAULT 0,
  CHANGE COLUMN `cost`           `precio_compra`  DECIMAL(10,4)  DEFAULT NULL   COMMENT 'Precio de compra por presentación (con IVA)';


-- ────────────────────────────────────────────────────────────
-- PASO 3: Agregar campos del catálogo enriquecido (Excel hoja "Ingredientes")
-- ────────────────────────────────────────────────────────────
ALTER TABLE `ingredientes`
  -- Datos de la presentación de compra
  ADD COLUMN `marca`                VARCHAR(100)    DEFAULT NULL                  COMMENT 'Marca del ingrediente'                      AFTER `categoria`,
  ADD COLUMN `presentacion_compra`  VARCHAR(250)    DEFAULT NULL                  COMMENT 'Ej: Saco de 25 libras, 4 latas x 567g'     AFTER `marca`,
  ADD COLUMN `peso_unitario`        DECIMAL(14,4)   DEFAULT NULL                  COMMENT 'Peso o cantidad por unidad de la presentación' AFTER `presentacion_compra`,
  ADD COLUMN `unidad_medida_compra` VARCHAR(40)     DEFAULT NULL                  COMMENT 'Unidad en que se compra (Gramos, Mililitro, Unidad…)' AFTER `peso_unitario`,
  ADD COLUMN `precio_compra_sin_iva` DECIMAL(10,4)  DEFAULT NULL                  COMMENT 'Precio compra sin IVA'                     AFTER `precio_compra`,
  ADD COLUMN `tipo_envoltorio`      VARCHAR(100)    DEFAULT NULL                  COMMENT 'Ej: Saco de papel, Bote de plástico, Lata'  AFTER `precio_compra_sin_iva`,
  ADD COLUMN `temperatura_compra`   VARCHAR(50)     DEFAULT NULL                  COMMENT 'Ambiente / Refrigerado / Congelado'         AFTER `tipo_envoltorio`,
  ADD COLUMN `unidades_por_caja`    DECIMAL(8,2)    NOT NULL DEFAULT 1            COMMENT 'Unidades incluidas en la presentación'      AFTER `temperatura_compra`,
  ADD COLUMN `peso_neto_compra`     DECIMAL(14,4)   DEFAULT NULL                  COMMENT 'Peso neto total de la presentación'         AFTER `unidades_por_caja`,
  -- Costo calculado por unidad mínima (el dato clave para el costeo de recetas)
  ADD COLUMN `costo_unitario`       DECIMAL(14,8)   DEFAULT NULL                  COMMENT 'Costo neto sin IVA por unidad mínima (gramo, ml, unidad)' AFTER `peso_neto_compra`;


-- ────────────────────────────────────────────────────────────
-- PASO 4: Agregar campos para líneas de receta (módulo Costeo)
--   Filas con costeo_platillo_id IS NULL → catálogo maestro
--   Filas con costeo_platillo_id = N     → línea de receta del platillo N
-- ────────────────────────────────────────────────────────────
ALTER TABLE `ingredientes`
  ADD COLUMN `tipo`               ENUM('ingrediente','subreceta','empaque')
                                  NOT NULL DEFAULT 'ingrediente'             COMMENT 'Tipo de ítem en el catálogo'  AFTER `nombre`,
  ADD COLUMN `costeo_platillo_id` INT UNSIGNED    DEFAULT NULL               COMMENT 'NULL = fila de catálogo'      AFTER `costo_unitario`,
  ADD COLUMN `tipo_receta`        ENUM('principal','secundario','empaque')
                                  DEFAULT NULL                               COMMENT 'Rol del ingrediente en la receta' AFTER `costeo_platillo_id`,
  ADD COLUMN `cantidad`           DECIMAL(12,4)   DEFAULT NULL               COMMENT 'Cantidad utilizada en la receta' AFTER `tipo_receta`,
  ADD COLUMN `unidad_medida`      VARCHAR(40)     DEFAULT NULL               COMMENT 'Unidad de la cantidad en receta' AFTER `cantidad`,
  ADD COLUMN `porcentaje_merma`   DECIMAL(6,4)    NOT NULL DEFAULT 0         COMMENT 'Ej: 0.05 = 5% de merma'       AFTER `unidad_medida`,
  ADD COLUMN `precio_ref`         DECIMAL(14,8)   DEFAULT NULL               COMMENT 'Precio snapshot al momento del costeo' AFTER `porcentaje_merma`,
  ADD COLUMN `costo_linea`        DECIMAL(10,4)   DEFAULT NULL               COMMENT 'Costo total de esta línea (snapshot)' AFTER `precio_ref`;


-- ────────────────────────────────────────────────────────────
-- PASO 5: Índices y FK para el módulo de Costeo
-- ────────────────────────────────────────────────────────────
ALTER TABLE `ingredientes`
  ADD INDEX `idx_nombre`            (`nombre`),
  ADD INDEX `idx_tipo`              (`tipo`),
  ADD INDEX `idx_costeo_platillo`   (`costeo_platillo_id`),
  ADD CONSTRAINT `fk_ing_costeo_platillo`
    FOREIGN KEY (`costeo_platillo_id`) REFERENCES `costeo_platillos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;


-- ────────────────────────────────────────────────────────────
-- PASO 6: Actualizar los datos existentes con el costo_unitario calculado
--   costo_unitario = precio_compra / (1.13) / peso_neto_compra
--   (asumiendo IVA 13% — ajusta si tu región tiene otro %)
--   Como no conocemos peso_neto_compra de los datos viejos, solo actualizamos
--   los que sí tienen nombre reconocible del Excel.
-- ────────────────────────────────────────────────────────────
UPDATE `ingredientes` SET
  `costo_unitario`       = ROUND(`precio_compra` / 1.13 / 1000, 8),  -- estimado si no hay peso_neto
  `unidad_medida_compra` = `unidad`,
  `peso_neto_compra`     = NULL
WHERE `costeo_platillo_id` IS NULL;

-- Ajuste específico para los ingredientes con datos reales del Excel
-- (el costo_unitario correcto se carga en 002_costeo_data.sql)
UPDATE `ingredientes` SET `costo_unitario` = 0.00453326 WHERE `nombre` = 'Garbanzos';
UPDATE `ingredientes` SET `costo_unitario` = 0.00918329 WHERE `nombre` = 'Aceite de oliva';
UPDATE `ingredientes` SET `costo_unitario` = 0.01243516 WHERE `nombre` = 'Tofu';
UPDATE `ingredientes` SET `costo_unitario` = 0.00440039 WHERE `nombre` = 'Mantequilla de Maní';


-- ────────────────────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- Ejecuta esto para confirmar que todo quedó bien:
-- ────────────────────────────────────────────────────────────
-- SELECT COUNT(*) AS total_filas FROM ingredientes;
-- DESCRIBE ingredientes;
