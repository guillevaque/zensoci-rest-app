-- ============================================================
-- MIGRACIÓN 007 — Configuración Fiscal del Emisor (DTE)
-- Aplica a: u485160167_zensoci_db (Hostinger)
-- Referencia técnica: fe-f-v2.json (tipoDte=01, version=2)
-- NO ejecutar en producción sin haber probado primero en una copia.
-- ============================================================

-- VERIFICACIÓN PREVIA (ejecutar primero para confirmar):
-- SHOW TABLES LIKE 'configuracion_fiscal';

CREATE TABLE IF NOT EXISTS `configuracion_fiscal` (
  `id`                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,

  -- Identificación del emisor (emisor.nit, emisor.nrc, emisor.nombre)
  `nit`                   VARCHAR(14)     NOT NULL COMMENT 'NIT del emisor, máx 14 chars, conservar ceros',
  `nrc`                   VARCHAR(8)      NOT NULL COMMENT 'NRC del emisor, 2–8 chars',
  `nombre_legal`          VARCHAR(250)    NOT NULL COMMENT 'Nombre legal del emisor',
  `nombre_comercial`      VARCHAR(150)    DEFAULT NULL COMMENT 'Nombre comercial, nullable',

  -- Actividad económica (emisor.codActividad, emisor.descActividad)
  `codigo_actividad`      VARCHAR(6)      NOT NULL COMMENT 'Código CIIU 5–6 dígitos',
  `descripcion_actividad` VARCHAR(150)    NOT NULL COMMENT 'Descripción de la actividad económica',

  -- Dirección fiscal (emisor.direccion.*)
  `departamento`          VARCHAR(2)      NOT NULL COMMENT 'Código catálogo MH CAT-012 (ej: 06)',
  `municipio`             VARCHAR(4)      NOT NULL COMMENT 'Código catálogo MH CAT-013 (ej: 0614)',
  `distrito`              VARCHAR(10)     DEFAULT NULL COMMENT 'Código catálogo MH CAT-014',
  `complemento`           VARCHAR(200)    NOT NULL COMMENT 'Dirección textual, 1–200 chars',

  -- Contacto (emisor.telefono, emisor.correo)
  `telefono`              VARCHAR(30)     NOT NULL COMMENT '8–30 chars',
  `correo`                VARCHAR(100)    NOT NULL COMMENT '6–100 chars',

  -- Establecimiento y punto de venta (emisor.codEstable, emisor.codPuntoVenta)
  `codigo_establecimiento` VARCHAR(4)     DEFAULT NULL COMMENT 'Nullable, longitud exacta 4 si se usa',
  `codigo_punto_venta`    VARCHAR(15)     DEFAULT NULL COMMENT 'Nullable, máx 15',

  -- Parámetros operativos DTE
  `ambiente`              CHAR(2)         NOT NULL DEFAULT '00' COMMENT '00=Pruebas, 01=Producción',
  `modelo_facturacion`    TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=Previo, 2=Diferido',

  -- Control
  `activo`                TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by`            INT UNSIGNED    DEFAULT NULL,
  `updated_by`            INT UNSIGNED    DEFAULT NULL,

  PRIMARY KEY (`id`),
  CONSTRAINT `chk_fiscal_ambiente`          CHECK (`ambiente` IN ('00','01')),
  CONSTRAINT `chk_fiscal_modelo`            CHECK (`modelo_facturacion` IN (1,2)),
  CONSTRAINT `fk_fiscal_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_fiscal_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Configuración fiscal del emisor para DTE El Salvador';

-- ── Script de verificación (ejecutar por separado) ─────────────────────────
-- DESCRIBE configuracion_fiscal;
-- SELECT COUNT(*) FROM configuracion_fiscal;
