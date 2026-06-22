-- ============================================================
-- ZENSOCI POS — Migración 001: Módulo Costeo de Platillos
-- Base de datos: u485160167_zensoci_db (Hostinger)
-- Ejecutar en phpMyAdmin > pestaña SQL
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLA: costeo_platillos
-- Resumen financiero de cada platillo (datos del Excel "Precios Menu")
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `costeo_platillos` (
  `id`                      INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `numero_menu`             TINYINT UNSIGNED NOT NULL COMMENT 'Nº de orden en el menú',
  `nombre`                  VARCHAR(150)   NOT NULL,
  `categoria`               VARCHAR(80)    NOT NULL,
  `porciones`               TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Porciones por receta',
  `precio_con_iva`          DECIMAL(10,4)  DEFAULT NULL,
  `precio_sin_iva`          DECIMAL(10,4)  DEFAULT NULL,
  `costo_porcion`           DECIMAL(10,4)  DEFAULT NULL COMMENT 'Costo ingredientes / porciones',
  `costo_subreceta`         DECIMAL(10,4)  DEFAULT NULL COMMENT 'Pan, salsas base, etc.',
  `costo_empaque`           DECIMAL(10,4)  DEFAULT NULL,
  `costo_unitario`          DECIMAL(10,4)  DEFAULT NULL COMMENT 'Costo total por unidad vendida',
  `porcentaje_costo`        DECIMAL(6,4)   DEFAULT NULL COMMENT 'e.g. 0.35 = 35%',
  `margen_unitario`         DECIMAL(10,4)  DEFAULT NULL,
  `porcentaje_margen`       DECIMAL(6,4)   DEFAULT NULL COMMENT 'e.g. 0.65 = 65%',
  `incremento_delivery`     DECIMAL(6,4)   DEFAULT NULL COMMENT 'Factor adicional delivery',
  `precio_delivery`         DECIMAL(10,4)  DEFAULT NULL,
  `precio_delivery_sin_iva` DECIMAL(10,4)  DEFAULT NULL,
  `activo`                  TINYINT(1)     NOT NULL DEFAULT 1,
  `ultima_actualizacion`    DATE           DEFAULT NULL,
  `created_at`              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_numero_menu` (`numero_menu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Costeo financiero de platillos — fuente: Costeo_Platillos_Zensoci.xlsx';


-- ────────────────────────────────────────────────────────────
-- TABLA: ingredientes
-- Tabla unificada que sirve dos roles:
--   1) Catálogo (costeo_platillo_id IS NULL) — equivale al Excel "Ingredientes"
--   2) Líneas de receta (costeo_platillo_id = N) — reemplaza costeo_detalle_ingredientes
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ingredientes` (
  `id`                    INT UNSIGNED     NOT NULL AUTO_INCREMENT,

  -- ── Campos comunes (catálogo y líneas de receta) ──────────────────────
  `name`                  VARCHAR(200)     NOT NULL                   COMMENT 'Nombre del ingrediente',
  `tipo`                  ENUM('ingrediente','subreceta','empaque')
                          NOT NULL DEFAULT 'ingrediente',
  `unit`                  VARCHAR(40)      DEFAULT NULL               COMMENT 'Unidad de uso (gramos, ml, unidad…)',
  `unit_cost`             DECIMAL(14,8)    DEFAULT NULL               COMMENT 'Costo neto unitario sin IVA',
  `category_label`        VARCHAR(80)      DEFAULT NULL               COMMENT 'Categoría del ingrediente',

  -- ── Campos de catálogo enriquecido (Excel hoja "Ingredientes") ────────
  `marca`                 VARCHAR(100)     DEFAULT NULL,
  `presentacion_compra`   VARCHAR(250)     DEFAULT NULL               COMMENT 'Ej: "Saco de 25 libras"',
  `proveedor`             VARCHAR(150)     DEFAULT NULL,
  `peso_unitario`         DECIMAL(14,4)    DEFAULT NULL               COMMENT 'Peso o cantidad por unidad de compra',
  `unidad_medida_compra`  VARCHAR(40)      DEFAULT NULL               COMMENT 'Unidad en que se compra',
  `precio_compra_con_iva` DECIMAL(10,4)    DEFAULT NULL,
  `precio_compra_sin_iva` DECIMAL(10,4)    DEFAULT NULL,
  `tipo_envoltorio`       VARCHAR(100)     DEFAULT NULL               COMMENT 'Ej: "Saco de papel", "Bote de plástico"',
  `temperatura_compra`    VARCHAR(50)      DEFAULT NULL               COMMENT 'Ambiente / Refrigerado / Congelado',
  `unidades_por_caja`     DECIMAL(8,2)     DEFAULT 1,
  `peso_neto_compra`      DECIMAL(14,4)    DEFAULT NULL               COMMENT 'Peso neto total de la presentación',

  -- ── Campos de inventario (stock) ──────────────────────────────────────
  `stock`                 DECIMAL(12,4)    NOT NULL DEFAULT 0,
  `stock_minimo`          DECIMAL(12,4)    NOT NULL DEFAULT 0,

  -- ── Campos de línea de receta (NULL en filas de catálogo) ─────────────
  `costeo_platillo_id`    INT UNSIGNED     DEFAULT NULL,
  `tipo_receta`           ENUM('principal','secundario','empaque') DEFAULT NULL,
  `cantidad`              DECIMAL(12,4)    DEFAULT NULL               COMMENT 'Cantidad usada en la receta',
  `unidad_medida`         VARCHAR(40)      DEFAULT NULL               COMMENT 'Unidad de la cantidad en receta',
  `porcentaje_merma`      DECIMAL(6,4)     NOT NULL DEFAULT 0,
  `precio_unitario_ref`   DECIMAL(14,8)    DEFAULT NULL               COMMENT 'Precio snapshot al momento del costeo',
  `costo_linea_ref`       DECIMAL(10,4)    DEFAULT NULL               COMMENT 'Costo total de esta línea (snapshot)',

  -- ── Metadata ──────────────────────────────────────────────────────────
  `activo`                TINYINT(1)       NOT NULL DEFAULT 1,
  `created_at`            TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_name`             (`name`),
  KEY `idx_tipo`             (`tipo`),
  KEY `idx_costeo_platillo`  (`costeo_platillo_id`),
  CONSTRAINT `fk_ing_costeo_platillo`
    FOREIGN KEY (`costeo_platillo_id`) REFERENCES `costeo_platillos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de ingredientes + líneas de receta unificadas';
