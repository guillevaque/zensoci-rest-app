-- ============================================================
-- 011_venta_items.sql
-- Líneas de detalle de cada venta
-- ============================================================

CREATE TABLE IF NOT EXISTS `venta_items` (
  `id`                  INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `venta_id`            INT UNSIGNED     NOT NULL,
  `numero_item`         SMALLINT UNSIGNED NOT NULL DEFAULT 1
                        COMMENT 'Orden del ítem dentro de la venta (1-based)',

  -- Descripción del bien o servicio
  `descripcion`         VARCHAR(1000)    NOT NULL,
  `codigo_producto`     VARCHAR(50)      NULL DEFAULT NULL,

  -- Cantidades y precios (DECIMAL)
  `cantidad`            DECIMAL(14,4)    NOT NULL DEFAULT 1.0000,
  `precio_unitario`     DECIMAL(14,4)    NOT NULL,
  `descuento`           DECIMAL(14,2)    NOT NULL DEFAULT 0.00,

  -- Clasificación tributaria
  `tipo_item`           TINYINT UNSIGNED NOT NULL DEFAULT 1
                        COMMENT '1=Bien, 2=Servicio, 3=Ambos, 4=Cargo',
  `no_gravado`          TINYINT(1)       NOT NULL DEFAULT 0,
  `exento`              TINYINT(1)       NOT NULL DEFAULT 0,

  -- Subtotales calculados y guardados para inmutabilidad
  `total_gravado`       DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `total_exento`        DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `total_no_sujeto`     DECIMAL(14,2)    NOT NULL DEFAULT 0.00,

  -- Auditoría mínima (hereda created_at de venta)
  `created_at`          DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_vi_venta`  (`venta_id`),
  UNIQUE KEY `uq_vi_orden` (`venta_id`, `numero_item`),

  CONSTRAINT `chk_vi_tipo_item`
    CHECK (`tipo_item` IN (1, 2, 3, 4)),
  CONSTRAINT `chk_vi_cantidad`
    CHECK (`cantidad` > 0),
  CONSTRAINT `chk_vi_precio`
    CHECK (`precio_unitario` >= 0),

  CONSTRAINT `fk_vi_venta`
    FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
