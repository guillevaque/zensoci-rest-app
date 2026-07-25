-- ============================================================
-- ROLLBACK 009 — Eliminar tabla cliente_direcciones
-- Ejecutar SÓLO si necesitas deshacer la migración 009.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `cliente_direcciones`;
SET FOREIGN_KEY_CHECKS = 1;
