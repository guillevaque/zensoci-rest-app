-- ============================================================
-- ZENSOCI POS — Script A: Estructura de tablas
-- Base de datos: u485160167_zensoci_db (Hostinger)
--
-- ESTADO ACTUAL DE TU BASE DE DATOS:
--   ✅ costeo_platillos  → ya existe (creada antes), puede estar vacía
--   ✅ ingredientes      → existe VACÍA con columnas incorrectas (borrar)
--   ✅ ingredients       → tu tabla ORIGINAL con 5 registros (renombrar)
--
-- QUÉ HACE ESTE SCRIPT:
--   1. Elimina la tabla ingredientes vacía incorrecta
--   2. Renombra ingredients → ingredientes
--   3. Renombra columnas a español
--   4. Agrega todos los campos nuevos
-- ============================================================


-- PASO 1: Eliminar la tabla ingredientes vacía (la del error)
DROP TABLE IF EXISTS `ingredientes`;


-- PASO 2: Renombrar tu tabla original (con tus 5 registros)
RENAME TABLE `ingredients` TO `ingredientes`;


-- PASO 3: Renombrar las 7 columnas existentes a español
ALTER TABLE `ingredientes`
  CHANGE COLUMN `name`           `nombre`        VARCHAR(200)  NOT NULL,
  CHANGE COLUMN `category_label` `categoria`     VARCHAR(80)   DEFAULT NULL,
  CHANGE COLUMN `supplier`       `proveedor`     VARCHAR(150)  DEFAULT NULL,
  CHANGE COLUMN `unit`           `unidad`        VARCHAR(40)   DEFAULT NULL,
  CHANGE COLUMN `stock_qty`      `stock`         DECIMAL(12,4) NOT NULL DEFAULT 0,
  CHANGE COLUMN `min_stock`      `stock_minimo`  DECIMAL(12,4) NOT NULL DEFAULT 0,
  CHANGE COLUMN `cost`           `precio_compra` DECIMAL(10,4) DEFAULT NULL;


-- PASO 4: Agregar campos del Excel (hoja Ingredientes)
ALTER TABLE `ingredientes`
  ADD COLUMN `tipo`                ENUM('ingrediente','subreceta','empaque') NOT NULL DEFAULT 'ingrediente' AFTER `nombre`,
  ADD COLUMN `marca`               VARCHAR(100)   DEFAULT NULL  AFTER `categoria`,
  ADD COLUMN `presentacion_compra` VARCHAR(250)   DEFAULT NULL  AFTER `marca`,
  ADD COLUMN `peso_unitario`       DECIMAL(14,4)  DEFAULT NULL  AFTER `presentacion_compra`,
  ADD COLUMN `unidad_medida_compra` VARCHAR(40)   DEFAULT NULL  AFTER `peso_unitario`,
  ADD COLUMN `precio_compra_sin_iva` DECIMAL(10,4) DEFAULT NULL AFTER `precio_compra`,
  ADD COLUMN `tipo_envoltorio`     VARCHAR(100)   DEFAULT NULL  AFTER `precio_compra_sin_iva`,
  ADD COLUMN `temperatura_compra`  VARCHAR(50)    DEFAULT NULL  AFTER `tipo_envoltorio`,
  ADD COLUMN `unidades_por_caja`   DECIMAL(8,2)   NOT NULL DEFAULT 1 AFTER `temperatura_compra`,
  ADD COLUMN `peso_neto_compra`    DECIMAL(14,4)  DEFAULT NULL  AFTER `unidades_por_caja`,
  ADD COLUMN `costo_unitario`      DECIMAL(14,8)  DEFAULT NULL  AFTER `peso_neto_compra`;


-- PASO 5: Agregar campos para líneas de receta (módulo Costeo)
ALTER TABLE `ingredientes`
  ADD COLUMN `costeo_platillo_id` INT UNSIGNED   DEFAULT NULL  AFTER `costo_unitario`,
  ADD COLUMN `tipo_receta`        ENUM('principal','secundario','empaque') DEFAULT NULL AFTER `costeo_platillo_id`,
  ADD COLUMN `cantidad`           DECIMAL(12,4)  DEFAULT NULL  AFTER `tipo_receta`,
  ADD COLUMN `unidad_medida`      VARCHAR(40)    DEFAULT NULL  AFTER `cantidad`,
  ADD COLUMN `porcentaje_merma`   DECIMAL(6,4)   NOT NULL DEFAULT 0 AFTER `unidad_medida`,
  ADD COLUMN `precio_ref`         DECIMAL(14,8)  DEFAULT NULL  AFTER `porcentaje_merma`,
  ADD COLUMN `costo_linea`        DECIMAL(10,4)  DEFAULT NULL  AFTER `precio_ref`;


-- PASO 6: Índices y FK hacia costeo_platillos
ALTER TABLE `ingredientes`
  ADD INDEX `idx_nombre`          (`nombre`),
  ADD INDEX `idx_costeo_platillo` (`costeo_platillo_id`),
  ADD CONSTRAINT `fk_ing_costeo`
    FOREIGN KEY (`costeo_platillo_id`) REFERENCES `costeo_platillos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;


-- PASO 7: Calcular costo_unitario para tus 5 registros existentes
UPDATE `ingredientes` SET `costo_unitario` = 0.00179330 WHERE `nombre` = 'Tomate';
UPDATE `ingredientes` SET `costo_unitario` = 0.00453326 WHERE `nombre` = 'Garbanzos';
UPDATE `ingredientes` SET `costo_unitario` = 0.00918329 WHERE `nombre` = 'Aceite de oliva';
UPDATE `ingredientes` SET `costo_unitario` = 0.01243516 WHERE `nombre` = 'Tofu';
UPDATE `ingredientes` SET `costo_unitario` = 0.00440039 WHERE `nombre` = 'Mantequilla de Maní';


-- ── Verificación (copia y pega esto por separado para confirmar) ──────
-- SELECT id, nombre, tipo, categoria, proveedor, unidad, stock, precio_compra, costo_unitario FROM ingredientes;
