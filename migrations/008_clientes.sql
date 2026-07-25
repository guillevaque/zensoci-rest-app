-- ============================================================
-- MIGRACIÓN 008 — Tabla de Clientes
-- Aplica a: u485160167_zensoci_db (Hostinger)
-- Referencia técnica: fe-f-v2.json (receptor.*)
-- NO ejecutar en producción sin haber probado primero en una copia.
-- ============================================================

-- VERIFICACIÓN PREVIA (ejecutar primero para confirmar):
-- SHOW TABLES LIKE 'clientes';

CREATE TABLE IF NOT EXISTS `clientes` (
  `id`                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,

  -- Tipo de receptor (físico o jurídico)
  `tipo_persona`          CHAR(1)         NOT NULL DEFAULT 'N' COMMENT 'N=Natural, J=Jurídica',

  -- Identificación tributaria
  `tipo_doc_identificacion` VARCHAR(2)    NOT NULL DEFAULT '13'
                          COMMENT 'Catálogo MH CAT-022: 13=DUI,37=NIT,36=Pasaporte,03=Carnet residente,02=Doc extranjero',
  `num_documento`         VARCHAR(20)     DEFAULT NULL COMMENT 'Número de DUI, NIT u otro documento; NULL si es Consumidor Final',
  `nit`                   VARCHAR(14)     DEFAULT NULL COMMENT 'NIT del cliente, conservar ceros a la izquierda',
  `nrc`                   VARCHAR(8)      DEFAULT NULL COMMENT 'NRC del cliente; sólo si es contribuyente',

  -- Nombre
  `nombre`                VARCHAR(250)    NOT NULL COMMENT 'Nombre natural o razón social, min 1',
  `nombre_comercial`      VARCHAR(150)    DEFAULT NULL COMMENT 'Nombre comercial; nullable',

  -- Tipo de contribuyente
  `es_contribuyente`      TINYINT(1)      NOT NULL DEFAULT 0
                          COMMENT '0=No contribuyente / Consumidor Final, 1=Contribuyente con NRC',

  -- Actividad económica (sólo para contribuyentes)
  `codigo_actividad`      VARCHAR(6)      DEFAULT NULL COMMENT 'CIIU 5–6 dígitos; NULL si no aplica',
  `descripcion_actividad` VARCHAR(150)    DEFAULT NULL,

  -- Dirección principal
  `departamento`          VARCHAR(2)      DEFAULT NULL COMMENT 'CAT-012',
  `municipio`             VARCHAR(4)      DEFAULT NULL COMMENT 'CAT-013',
  `complemento`           VARCHAR(200)    DEFAULT NULL COMMENT 'Dirección textual',

  -- Contacto
  `telefono`              VARCHAR(30)     DEFAULT NULL,
  `correo`                VARCHAR(100)    DEFAULT NULL,

  -- Consumidor final implícito: si nombre='Consumidor Final' y num_documento IS NULL
  -- se trata como consumidor final en el DTE

  -- Control
  `activo`                TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by`            INT UNSIGNED    DEFAULT NULL,
  `updated_by`            INT UNSIGNED    DEFAULT NULL,

  PRIMARY KEY (`id`),
  INDEX `idx_clientes_nombre`       (`nombre`),
  INDEX `idx_clientes_nit`          (`nit`),
  INDEX `idx_clientes_nrc`          (`nrc`),
  INDEX `idx_clientes_num_doc`      (`num_documento`),
  INDEX `idx_clientes_activo`       (`activo`),

  CONSTRAINT `chk_cliente_tipo_persona`  CHECK (`tipo_persona` IN ('N','J')),
  CONSTRAINT `fk_clientes_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_clientes_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de clientes / receptores para DTE El Salvador';

-- ── Consumidor Final por defecto ────────────────────────────────────────────
-- Insertar el registro "Consumidor Final" que sirve de receptor genérico
-- cuando el receptor no proporciona sus datos.
INSERT IGNORE INTO `clientes`
  (`id`, `tipo_persona`, `tipo_doc_identificacion`, `num_documento`,
   `nombre`, `es_contribuyente`, `activo`)
VALUES
  (1, 'N', '13', NULL, 'Consumidor Final', 0, 1);

-- ── Script de verificación (ejecutar por separado) ─────────────────────────
-- DESCRIBE clientes;
-- SELECT * FROM clientes WHERE id = 1;
