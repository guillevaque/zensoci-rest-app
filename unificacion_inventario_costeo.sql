-- ============================================================================
-- ZENSOCI POS — TABLA UNIFICADA `ingredientes`
-- ----------------------------------------------------------------------------
-- Una sola tabla reemplaza a `ingredients` (inventario) y
-- `costeo_detalle_ingredientes` (líneas de receta).
--
-- Lógica de dos tipos de fila:
--   costeo_platillo_id IS NULL     → entrada de catálogo (inventario/compras)
--   costeo_platillo_id IS NOT NULL → línea de receta de ese platillo
--
-- tipo:       'ingrediente' | 'subreceta' | 'empaque'
-- tipo_receta:'principal'   | 'secundario' | 'empaque'  (solo en filas de receta)
--
-- Base: u485160167_zensoci_db  (MariaDB 11.8 / Hostinger)
-- ============================================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1. CREAR LA TABLA UNIFICADA `ingredientes`
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ingredientes` (

  -- ── Identidad ──────────────────────────────────────────────────────────────
  `id`                    INT(11)       NOT NULL AUTO_INCREMENT,
  `name`                  VARCHAR(255)  NOT NULL,
  `tipo`                  ENUM('ingrediente','subreceta','empaque')
                                        NOT NULL DEFAULT 'ingrediente',

  -- ── Catálogo / Inventario (NULL cuando es solo línea de receta) ────────────
  `category_label`        VARCHAR(100)  DEFAULT NULL,
  `brand`                 VARCHAR(120)  DEFAULT NULL,
  `supplier`              VARCHAR(150)  DEFAULT NULL,
  `presentation`          VARCHAR(200)  DEFAULT NULL COMMENT 'Presentación de compra (ej. caja de 24 un)',
  `unit`                  VARCHAR(50)   DEFAULT NULL COMMENT 'Unidad base: g, ml, Unidad…',
  `units_per_pack`        DECIMAL(12,4) DEFAULT NULL COMMENT 'Unidades por caja/paquete',
  `purchase_price_no_iva` DECIMAL(12,4) DEFAULT NULL COMMENT 'Precio del paquete sin IVA',
  `unit_cost`             DECIMAL(16,8) DEFAULT NULL COMMENT 'Costo unitario sin IVA (vivo del inventario)',
  `stock_qty`             DECIMAL(12,4) DEFAULT 0,
  `min_stock`             DECIMAL(12,4) DEFAULT 0,
  `activo`                TINYINT(1)    NOT NULL DEFAULT 1,

  -- ── Detalle de receta (NULL cuando es solo catálogo) ──────────────────────
  `costeo_platillo_id`    INT(11)       DEFAULT NULL COMMENT 'FK a costeo_platillos; NULL = catálogo',
  `tipo_receta`           ENUM('principal','secundario','empaque')
                                        DEFAULT NULL COMMENT 'Rol del ingrediente en la receta',
  `cantidad`              DECIMAL(12,6) DEFAULT NULL,
  `unidad_medida`         VARCHAR(50)   DEFAULT NULL,
  `porcentaje_merma`      DECIMAL(8,4)  DEFAULT 0,
  `precio_unitario_ref`   DECIMAL(16,8) DEFAULT NULL COMMENT 'Precio snapshot al momento del costeo',
  `costo_linea_ref`       DECIMAL(16,8) DEFAULT NULL COMMENT 'Costo total de la línea (snapshot)',

  -- ── Auditoría ──────────────────────────────────────────────────────────────
  `created_at`            TIMESTAMP     NULL DEFAULT current_timestamp(),
  `updated_at`            TIMESTAMP     NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),

  PRIMARY KEY (`id`),
  KEY `idx_platillo` (`costeo_platillo_id`),
  KEY `idx_tipo`     (`tipo`),
  KEY `idx_activo`   (`activo`),
  KEY `idx_name`     (`name`(100)),

  CONSTRAINT `fk_ingredientes_platillo`
    FOREIGN KEY (`costeo_platillo_id`)
    REFERENCES `costeo_platillos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla unificada: catálogo (inventario) + líneas de receta (costeo)';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2. MIGRAR CATÁLOGO DESDE `ingredients`
--         (filas de inventario → costeo_platillo_id = NULL)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `ingredientes`
  (`name`, `tipo`, `category_label`, `supplier`, `unit`,
   `unit_cost`, `stock_qty`, `min_stock`, `activo`)
SELECT
  `name`,
  'ingrediente',
  `category_label`,
  `supplier`,
  `unit`,
  `cost`,       -- columna original de la tabla ingredients
  `stock_qty`,
  `min_stock`,
  `activo`
FROM `ingredients`;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3. INSERTAR CATÁLOGO DE EMPAQUES
--         ON DUPLICATE KEY: si ya vino alguno de `ingredients`, lo enriquece.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `ingredientes`
  (`name`,`tipo`,`supplier`,`presentation`,`unit`,`units_per_pack`,`purchase_price_no_iva`,`unit_cost`)
VALUES
  ('ENVASE PAPEL KRAFT 16 OZ S/T 24 UN BIO FORM 2864014000','empaque','Tienda Morena / Empaques Carvajal','24 unidades','Unidad',1.0,3.8,0.15833333),
  ('TAPA PAPEL P/ENV 16/32 OZ 24 UN BIO FORM 2864014002','empaque','Tienda Morena / Empaques Carvajal','24 unidades','Unidad',1.0,4.24,0.17666667),
  ('ENVASE PAPEL KRAFT 32 OZ S/T 24 UN BIO FORM 2864014001','empaque','Tienda Morena / Empaques Carvajal','24 unidades','Unidad',1.0,5.22,0.2175),
  ('Cuchara Maderita Compostable Eco','empaque','Despensa de Don Juan','30 unidades','Unidad',1.0,1.10619469,0.03687316),
  ('Palillo de Bambú Refin Desech Fu Mau','empaque','Super Selectos','36 unidades','Unidad',1.0,1.7699115,0.04916421),
  ('Bowl para Alimentos 1000 ml Kraft','empaque','DIASA','300 unidades','Unidad',1.0,54.0,0.18),
  ('Tapa Trans. PP Bowl 500/1000 ml','empaque','DIASA','300 unidades','Unidad',1.0,39.0,0.13),
  ('Clamshell 9x6','empaque','DIASA','250 unidades','Unidad',1.0,62.5,0.25),
  ('Pajilla de Papel Diapack','empaque',NULL,'50 unidades','Unidad',1.0,0.75,0.015),
  ('Tenedor de maderita compostable','empaque','Temu','200 unidades','Unidad',1.0,15.61061947,0.0780531),
  ('Bolsa de papel kraft pequeña UBPKFC-8','empaque','Diasa','250 unidades','Unidad',1.0,25.02,0.05004),
  ('Bolsa de papel kraft grande UBPKFC-20','empaque','Diasa','250 unidades','Unidad',1.0,30.37,0.12148),
  ('Champack retro kraft 11.1 x 8.9 x 6.4 (cm)','empaque','Diasa','10 unidades','Unidad',1.0,2.1,0.21)
AS x(`name`,`tipo`,`supplier`,`presentation`,`unit`,`units_per_pack`,`purchase_price_no_iva`,`unit_cost`)
ON DUPLICATE KEY UPDATE
  `tipo`                  = 'empaque',
  `supplier`              = COALESCE(x.`supplier`,              `ingredientes`.`supplier`),
  `presentation`          = COALESCE(x.`presentation`,          `ingredientes`.`presentation`),
  `units_per_pack`        = COALESCE(x.`units_per_pack`,        `ingredientes`.`units_per_pack`),
  `purchase_price_no_iva` = COALESCE(x.`purchase_price_no_iva`, `ingredientes`.`purchase_price_no_iva`),
  `unit_cost`             = x.`unit_cost`;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4. MIGRAR LÍNEAS DE RECETA DESDE `costeo_detalle_ingredientes`
--         Enriquece cada línea con el costo vivo del catálogo (si existe).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `ingredientes`
  (`name`, `tipo`,
   `costeo_platillo_id`, `tipo_receta`,
   `cantidad`, `unidad_medida`, `porcentaje_merma`,
   `precio_unitario_ref`, `costo_linea_ref`,
   `unit_cost`, `category_label`, `supplier`, `unit`)
SELECT
  d.nombre_ingrediente,
  IF(d.tipo = 'empaque', 'empaque', 'ingrediente'),
  d.costeo_platillo_id,
  d.tipo,                   -- 'principal' | 'secundario' | 'empaque'
  d.cantidad,
  d.unidad_medida,
  d.porcentaje_merma,
  d.precio_unitario,        -- snapshot del Excel
  d.costo_ingrediente,      -- snapshot total de la línea
  -- Enriquece con el costo vivo del catálogo (si la entrada ya existe)
  cat.unit_cost,
  cat.category_label,
  cat.supplier,
  cat.unit
FROM `costeo_detalle_ingredientes` d
LEFT JOIN `ingredientes` cat
       ON cat.name = d.nombre_ingrediente
      AND cat.costeo_platillo_id IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5. VISTA: ingredientes de receta con costo snapshot vs. costo vivo
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW `v_costeo_ingredientes` AS
SELECT
  r.id,
  r.costeo_platillo_id,
  r.tipo_receta                   AS tipo,
  r.name                          AS nombre_ingrediente,
  r.cantidad,
  r.unidad_medida,
  r.porcentaje_merma,
  r.precio_unitario_ref           AS precio_unitario,
  r.costo_linea_ref               AS costo_ingrediente,
  c.unit_cost                     AS precio_unitario_actual
FROM `ingredientes` r
LEFT JOIN `ingredientes` c
       ON c.name = r.name
      AND c.costeo_platillo_id IS NULL
WHERE r.costeo_platillo_id IS NOT NULL;


COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6. LIMPIEZA (ejecuta solo tras verificar que los datos migraron bien)
-- ─────────────────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS `costeo_detalle_ingredientes`;
-- DROP TABLE IF EXISTS `ingredients`;
