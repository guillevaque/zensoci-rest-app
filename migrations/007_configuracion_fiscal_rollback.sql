-- ============================================================
-- ROLLBACK 007 — Eliminar tabla configuracion_fiscal
-- Ejecutar SÓLO si necesitas deshacer la migración 007.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `configuracion_fiscal`;
SET FOREIGN_KEY_CHECKS = 1;
