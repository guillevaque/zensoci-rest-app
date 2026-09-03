-- ============================================================
-- 010_ventas.sql
-- Tabla principal de ventas (cabecera del DTE tipoDte=01)
-- Estado: BORRADOR → COMPLETADA (inmutable) | ANULADA
-- NO almacena JSON DTE, JWT, certificados ni credenciales MH
-- ============================================================

CREATE TABLE IF NOT EXISTS `ventas` (
  `id`                        INT UNSIGNED     NOT NULL AUTO_INCREMENT,

  -- Receptor
  `cliente_id`                INT UNSIGNED     NOT NULL DEFAULT 1
                              COMMENT 'FK clientes; id=1 = Consumidor Final',

  -- Identificación del canal de origen
  `canal`                     VARCHAR(30)      NOT NULL DEFAULT 'MANUAL'
                              COMMENT 'MANUAL | PEDIDOS_YA | WEB | etc.',
  `referencia_externa`        VARCHAR(100)     NULL     DEFAULT NULL
                              COMMENT 'ID de pedido en plataforma externa',

  -- Correlativo interno (auto, no es el correlativo DTE)
  `numero`                    INT UNSIGNED     NOT NULL,

  -- Fechas
  `fecha_venta`               DATE             NOT NULL,
  `fecha_hora_emision`        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at`              DATETIME         NULL     DEFAULT NULL,

  -- ── Montos (DECIMAL para precisión monetaria) ─────────────────
  `total_no_sujeto`           DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `total_exento`              DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `total_gravado`             DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `subtotal_ventas`           DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `total_descuento`           DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `iva_total`                 DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `costo_envio`               DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `propina`                   DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `monto_total_operacion`     DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
  `total_pagar`               DECIMAL(14,2)    NOT NULL DEFAULT 0.00,

  -- Estado del documento
  `estado`                    VARCHAR(20)      NOT NULL DEFAULT 'BORRADOR',

  -- Idempotencia (frontend genera UUID v4 antes de enviar)
  `idempotency_key`           VARCHAR(64)      NULL     DEFAULT NULL,

  -- Observaciones libres
  `observaciones`             VARCHAR(500)     NULL     DEFAULT NULL,

  -- Auditoría
  `created_by`                INT UNSIGNED     NOT NULL,
  `updated_by`                INT UNSIGNED     NULL     DEFAULT NULL,
  `created_at`                DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_idempotency`       (`idempotency_key`),
  UNIQUE KEY `uq_canal_referencia`  (`canal`, `referencia_externa`),
  UNIQUE KEY `uq_numero`            (`numero`),
  INDEX  `idx_cliente`              (`cliente_id`),
  INDEX  `idx_fecha_venta`          (`fecha_venta`),
  INDEX  `idx_estado`               (`estado`),
  INDEX  `idx_canal`                (`canal`),
  INDEX  `idx_created_by`           (`created_by`),

  CONSTRAINT `chk_ventas_estado`
    CHECK (`estado` IN ('BORRADOR','COMPLETADA','ANULADA')),
  CONSTRAINT `chk_ventas_canal`
    CHECK (`canal` IN ('MANUAL','PEDIDOS_YA','WEB','APP','OTRO')),

  CONSTRAINT `fk_ventas_cliente`
    FOREIGN KEY (`cliente_id`)  REFERENCES `clientes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_ventas_created_by`
    FOREIGN KEY (`created_by`)  REFERENCES `users`    (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_ventas_updated_by`
    FOREIGN KEY (`updated_by`)  REFERENCES `users`    (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Secuencia de números de venta (1 fila, se incrementa con UPDATE)
CREATE TABLE IF NOT EXISTS `ventas_secuencia` (
  `id`              TINYINT UNSIGNED  NOT NULL DEFAULT 1,
  `ultimo_numero`   INT UNSIGNED      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `ventas_secuencia` (`id`, `ultimo_numero`) VALUES (1, 0);
