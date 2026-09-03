-- ============================================================
-- 012_pagos.sql
-- Pagos registrados contra una venta COMPLETADA
-- Múltiples pagos pueden cubrir una sola venta (split payment)
-- ============================================================

CREATE TABLE IF NOT EXISTS `pagos` (
  `id`              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `venta_id`        INT UNSIGNED     NOT NULL,

  -- Forma de pago (CAT-017 DTE El Salvador — subset relevante)
  `forma_pago`      VARCHAR(10)      NOT NULL DEFAULT '01'
                    COMMENT '01=Efectivo 02=Tarjeta 03=Transferencia 04=Cheque 99=Otro',

  `referencia`      VARCHAR(100)     NULL DEFAULT NULL
                    COMMENT 'Nº autorización tarjeta, Nº cheque, Nº transferencia, etc.',

  `monto`           DECIMAL(14,2)    NOT NULL,

  -- Auditoría
  `created_by`      INT UNSIGNED     NOT NULL,
  `created_at`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_pago_venta`    (`venta_id`),
  INDEX `idx_pago_forma`    (`forma_pago`),

  CONSTRAINT `chk_pago_forma`
    CHECK (`forma_pago` IN ('01','02','03','04','99')),
  CONSTRAINT `chk_pago_monto`
    CHECK (`monto` > 0),

  CONSTRAINT `fk_pago_venta`
    FOREIGN KEY (`venta_id`)    REFERENCES `ventas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_pago_created`
    FOREIGN KEY (`created_by`)  REFERENCES `users`  (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
