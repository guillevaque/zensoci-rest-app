-- Agrega las rutas de Facturación / Contabilidad a role_permissions
-- Ejecutar en phpMyAdmin o MySQL CLI

INSERT IGNORE INTO role_permissions (role, route, allowed) VALUES
-- /facturacion/clientes
('admin',    '/facturacion/clientes', 1),
('manager',  '/facturacion/clientes', 1),
('gerente',  '/facturacion/clientes', 1),
('contador', '/facturacion/clientes', 1),
('mesero',   '/facturacion/clientes', 0),
('cocina',   '/facturacion/clientes', 0),
('caja',     '/facturacion/clientes', 0),
('staff',    '/facturacion/clientes', 0),
-- /facturacion/proveedores
('admin',    '/facturacion/proveedores', 1),
('manager',  '/facturacion/proveedores', 1),
('gerente',  '/facturacion/proveedores', 1),
('contador', '/facturacion/proveedores', 1),
('mesero',   '/facturacion/proveedores', 0),
('cocina',   '/facturacion/proveedores', 0),
('caja',     '/facturacion/proveedores', 0),
('staff',    '/facturacion/proveedores', 0),
-- /facturacion/informes
('admin',    '/facturacion/informes', 1),
('manager',  '/facturacion/informes', 1),
('gerente',  '/facturacion/informes', 1),
('contador', '/facturacion/informes', 1),
('mesero',   '/facturacion/informes', 0),
('cocina',   '/facturacion/informes', 0),
('caja',     '/facturacion/informes', 0),
('staff',    '/facturacion/informes', 0);
