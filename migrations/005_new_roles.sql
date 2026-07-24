-- Migración 005: Nuevos roles (admin, gerente, mesero, cocina, caja)
-- Ejecutar en phpMyAdmin de Hostinger DESPUÉS de 004_role_permissions.sql

-- 1. Ampliar el ENUM de role_permissions para aceptar los nuevos roles
ALTER TABLE role_permissions
  MODIFY COLUMN role ENUM('admin','manager','gerente','mesero','cocina','caja','contador','staff') NOT NULL;

-- 2. Ampliar el ENUM en la tabla users
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','manager','gerente','mesero','cocina','caja','contador','staff') NOT NULL DEFAULT 'staff';

-- 3. Insertar permisos por defecto para los nuevos roles
INSERT INTO role_permissions (role, route, allowed) VALUES
  -- admin: acceso total (igual que manager)
  ('admin', '/dashboard',  1),
  ('admin', '/mesas',      1),
  ('admin', '/pedidos',    1),
  ('admin', '/menu',       1),
  ('admin', '/inventario', 1),
  ('admin', '/reportes',   1),
  ('admin', '/costeo',     1),
  ('admin', '/personal',   1),
  ('admin', '/ajustes',    1),

  -- gerente: todo excepto configuración del sistema
  ('gerente', '/dashboard',  1),
  ('gerente', '/mesas',      1),
  ('gerente', '/pedidos',    1),
  ('gerente', '/menu',       1),
  ('gerente', '/inventario', 1),
  ('gerente', '/reportes',   1),
  ('gerente', '/costeo',     1),
  ('gerente', '/personal',   1),
  ('gerente', '/ajustes',    0),

  -- mesero: operación de sala
  ('mesero', '/dashboard',  1),
  ('mesero', '/mesas',      1),
  ('mesero', '/pedidos',    1),
  ('mesero', '/menu',       1),
  ('mesero', '/inventario', 0),
  ('mesero', '/reportes',   0),
  ('mesero', '/costeo',     0),
  ('mesero', '/personal',   0),
  ('mesero', '/ajustes',    0),

  -- cocina: solo vista de pedidos
  ('cocina', '/dashboard',  1),
  ('cocina', '/mesas',      0),
  ('cocina', '/pedidos',    1),
  ('cocina', '/menu',       0),
  ('cocina', '/inventario', 0),
  ('cocina', '/reportes',   0),
  ('cocina', '/costeo',     0),
  ('cocina', '/personal',   0),
  ('cocina', '/ajustes',    0),

  -- caja: pedidos, mesas y reportes básicos
  ('caja', '/dashboard',  1),
  ('caja', '/mesas',      1),
  ('caja', '/pedidos',    1),
  ('caja', '/menu',       0),
  ('caja', '/inventario', 0),
  ('caja', '/reportes',   1),
  ('caja', '/costeo',     0),
  ('caja', '/personal',   0),
  ('caja', '/ajustes',    0)

ON DUPLICATE KEY UPDATE allowed = VALUES(allowed);
