-- ============================================================
-- MIGRACIÓN 009 — Direcciones adicionales de Clientes
-- Aplica a: u485160167_zensoci_db (Hostinger)
-- Referencia técnica: fe-f-v2.json (receptor.direccion.*)
-- NO ejecutar en producción sin haber probado primero en una copia.
-- ============================================================

-- VERIFICACIÓN PREVIA (ejecutar primero para confirmar):
-- SHOW TABLES LIKE 'cliente_direcciones';

CREATE TABLE IF NOT EXISTS `cliente_direcciones` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `cliente_id`      INT UNSIGNED    NOT NULL,

  -- Etiqueta para distinguir múltiples direcciones
  `etiqueta`        VARCHAR(50)     NOT NULL DEFAULT 'Principal'
                    COMMENT 'Ej: Principal, Sucursal, Bodega',

  -- Dirección (mismo esquema que emisor.direccion)
  `departamento`    VARCHAR(2)      NOT NULL COMMENT 'CAT-012',
  `municipio`       VARCHAR(4)      NOT NULL COMMENT 'CAT-013',
  `distrito`        VARCHAR(10)     DEFAULT NULL COMMENT 'CAT-014; nullable',
  `complemento`     VARCHAR(200)    NOT NULL COMMENT '1–200 chars',

  `es_principal`    TINYINT(1)      NOT NULL DEFAULT 0
                    COMMENT '1 = dirección fiscal principal del cliente',

  -- Control
  `activo`          TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by`      INT UNSIGNED    DEFAULT NULL,
  `updated_by`      INT UNSIGNED    DEFAULT NULL,

  PRIMARY KEY (`id`),
  INDEX `idx_dir_cliente`       (`cliente_id`),
  INDEX `idx_dir_principal`     (`cliente_id`, `es_principal`),

  CONSTRAINT `fk_dir_cliente`
    FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dir_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_dir_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Direcciones adicionales de clientes para DTE';

-- ── Script de verificación (ejecutar por separado) ─────────────────────────
-- DESCRIBE cliente_direcciones;
-- SELECT COUNT(*) FROM cliente_direcciones;
