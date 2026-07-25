-- ============================================================
-- ROLLBACK 008 — Eliminar tabla clientes
-- Ejecutar SÓLO si necesitas deshacer la migración 008.
-- Asegúrate de rollbackear 009 primero (cliente_direcciones).
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `clientes`;
SET FOREIGN_KEY_CHECKS = 1;
