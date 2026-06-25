-- ============================================================
-- ZENSOCI POS — Renombrar columnas de empaques a español
-- Ejecutar en phpMyAdmin sobre u485160167_zensoci_db
-- ============================================================

ALTER TABLE `empaques`
  CHANGE COLUMN `name`                 `nombre`               VARCHAR(255)   NOT NULL,
  CHANGE COLUMN `category_label`       `categoria`            VARCHAR(100)   DEFAULT NULL,
  CHANGE COLUMN `brand`                `marca`                VARCHAR(100)   DEFAULT NULL,
  CHANGE COLUMN `supplier`             `proveedor`            VARCHAR(150)   DEFAULT NULL,
  CHANGE COLUMN `presentation`         `presentacion`         VARCHAR(250)   DEFAULT NULL,
  CHANGE COLUMN `unit`                 `unidad`               VARCHAR(40)    DEFAULT NULL,
  CHANGE COLUMN `units_per_pack`       `unidades_por_paquete` DECIMAL(8,2)   DEFAULT NULL,
  CHANGE COLUMN `purchase_price_no_iva` `precio_compra_sin_iva` DECIMAL(10,4) DEFAULT NULL,
  CHANGE COLUMN `unit_cost`            `costo_unitario`       DECIMAL(14,8)  DEFAULT NULL,
  CHANGE COLUMN `stock_qty`            `stock`                DECIMAL(12,4)  DEFAULT NULL,
  CHANGE COLUMN `min_stock`            `stock_minimo`         DECIMAL(12,4)  DEFAULT NULL;

-- Verificación
-- SELECT id, nombre, categoria, proveedor, unidad, costo_unitario, stock FROM empaques;
