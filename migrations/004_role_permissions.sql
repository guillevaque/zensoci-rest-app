-- Tabla de permisos configurables por rol
-- Ejecutar en phpMyAdmin o cliente SQL de Hostinger

CREATE TABLE IF NOT EXISTS role_permissions (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role      ENUM('manager', 'staff', 'contador') NOT NULL,
  route     VARCHAR(100)                          NOT NULL,
  allowed   TINYINT(1)                            NOT NULL DEFAULT 1,
  UNIQUE KEY uq_role_route (role, route)
);

-- Datos iniciales: permisos por defecto
INSERT INTO role_permissions (role, route, allowed) VALUES
  -- manager: acceso total
  ('manager', '/dashboard',  1),
  ('manager', '/mesas',      1),
  ('manager', '/pedidos',    1),
  ('manager', '/menu',       1),
  ('manager', '/inventario', 1),
  ('manager', '/reportes',   1),
  ('manager', '/costeo',     1),
  ('manager', '/personal',   1),
  ('manager', '/ajustes',    1),

  -- staff: solo operación
  ('staff', '/dashboard',  1),
  ('staff', '/mesas',      1),
  ('staff', '/pedidos',    1),
  ('staff', '/menu',       1),
  ('staff', '/inventario', 0),
  ('staff', '/reportes',   0),
  ('staff', '/costeo',     0),
  ('staff', '/personal',   0),
  ('staff', '/ajustes',    0),

  -- contador: reportes y finanzas
  ('contador', '/dashboard',  1),
  ('contador', '/mesas',      0),
  ('contador', '/pedidos',    0),
  ('contador', '/menu',       0),
  ('contador', '/inventario', 1),
  ('contador', '/reportes',   1),
  ('contador', '/costeo',     1),
  ('contador', '/personal',   0),
  ('contador', '/ajustes',    0)

ON DUPLICATE KEY UPDATE allowed = VALUES(allowed);

-- Agregar 'contador' al ENUM de users si aún no está
ALTER TABLE users
  MODIFY COLUMN role ENUM('manager', 'staff', 'contador') NOT NULL DEFAULT 'staff';
