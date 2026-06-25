-- ============================================================
-- ZENSOCI POS — Recuperación: crear tabla ingredientes desde cero
-- Ejecutar en phpMyAdmin sobre u485160167_zensoci_db
-- ============================================================

CREATE TABLE `ingredientes` (
  `id`                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `nombre`                VARCHAR(200)    NOT NULL,
  `tipo`                  ENUM('ingrediente','subreceta','empaque') NOT NULL DEFAULT 'ingrediente',
  `categoria`             VARCHAR(80)     DEFAULT NULL,
  `marca`                 VARCHAR(100)    DEFAULT NULL,
  `proveedor`             VARCHAR(150)    DEFAULT NULL,
  `presentacion_compra`   VARCHAR(250)    DEFAULT NULL,
  `peso_unitario`         DECIMAL(14,4)   DEFAULT NULL,
  `unidad_medida_compra`  VARCHAR(40)     DEFAULT NULL,
  `unidad`                VARCHAR(40)     DEFAULT NULL,
  `precio_compra`         DECIMAL(10,4)   DEFAULT NULL,
  `precio_compra_sin_iva` DECIMAL(10,4)   DEFAULT NULL,
  `tipo_envoltorio`       VARCHAR(100)    DEFAULT NULL,
  `temperatura_compra`    VARCHAR(50)     DEFAULT NULL,
  `unidades_por_caja`     DECIMAL(8,2)    NOT NULL DEFAULT 1,
  `peso_neto_compra`      DECIMAL(14,4)   DEFAULT NULL,
  `costo_unitario`        DECIMAL(14,8)   DEFAULT NULL,
  `stock`                 DECIMAL(12,4)   NOT NULL DEFAULT 0,
  `stock_minimo`          DECIMAL(12,4)   NOT NULL DEFAULT 0,
  `costeo_platillo_id`    INT UNSIGNED    DEFAULT NULL,
  `tipo_receta`           ENUM('principal','secundario','empaque') DEFAULT NULL,
  `cantidad`              DECIMAL(12,4)   DEFAULT NULL,
  `unidad_medida`         VARCHAR(40)     DEFAULT NULL,
  `porcentaje_merma`      DECIMAL(6,4)    NOT NULL DEFAULT 0,
  `precio_ref`            DECIMAL(14,8)   DEFAULT NULL,
  `costo_linea`           DECIMAL(10,4)   DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_nombre`         (`nombre`),
  INDEX `idx_costeo_platillo`(`costeo_platillo_id`),
  CONSTRAINT `fk_ing_costeo`
    FOREIGN KEY (`costeo_platillo_id`) REFERENCES `costeo_platillos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Insertar los ingredientes del catálogo (del Excel)
INSERT INTO `ingredientes` (nombre, tipo, categoria, proveedor, presentacion_compra, peso_unitario, unidad_medida_compra, unidad, precio_compra, unidades_por_caja, peso_neto_compra, costo_unitario) VALUES
('Garbanzos cocidos',      'ingrediente', 'Legumbres',       'Super Selectos', 'Bolsa de 907 g',            907.0000, 'Gramos',    'Gramos',    2.0400, 1, 907.0000,   0.00224917),
('Tahini',                 'ingrediente', 'Condimentos',     'Super Selectos', 'Frasco de 454 g',           454.0000, 'Gramos',    'Gramos',    4.2500, 1, 454.0000,   0.00935860),
('Limón (jugo)',           'ingrediente', 'Frutas',          'Super Selectos', 'Unidad aprox 50 ml jugo',    50.0000, 'Mililitro', 'Mililitro', 0.2500, 1,  50.0000,   0.00500000),
('Ajo fresco',             'ingrediente', 'Condimentos',     'Super Selectos', 'Cabeza aprox 40 g',          40.0000, 'Gramos',    'Gramos',    0.5000, 1,  40.0000,   0.01250000),
('Aceite de oliva',        'ingrediente', 'Aceites',         'Super Selectos', 'Botella de 500 ml',         500.0000, 'Mililitro', 'Mililitro', 5.9900, 1, 500.0000,   0.01198000),
('Sal',                    'ingrediente', 'Condimentos',     'Super Selectos', 'Bolsa de 2000 g',          2000.0000, 'Gramos',    'Gramos',    0.7500, 1,2000.0000,   0.00037500),
('Comino molido',          'ingrediente', 'Condimentos',     'Super Selectos', 'Frasco de 70 g',             70.0000, 'Gramos',    'Gramos',    1.2500, 1,  70.0000,   0.01785714),
('Pimentón ahumado',       'ingrediente', 'Condimentos',     'Super Selectos', 'Frasco de 50 g',             50.0000, 'Gramos',    'Gramos',    1.5000, 1,  50.0000,   0.03000000),
('Remolacha',              'ingrediente', 'Vegetales',       'Super Selectos', 'Unidad aprox 200 g',        200.0000, 'Gramos',    'Gramos',    0.6000, 1, 200.0000,   0.00300000),
('Zanahoria',              'ingrediente', 'Vegetales',       'Super Selectos', 'Unidad aprox 120 g',        120.0000, 'Gramos',    'Gramos',    0.3000, 1, 120.0000,   0.00250000),
('Tomate',                 'ingrediente', 'Vegetales',       'Hunts',          'Lata de 411 g',             411.0000, 'Gramos',    'Gramos',    0.7500, 1, 411.0000,   0.00179330),
('Garbanzos',              'ingrediente', 'Legumbres',       'Super Selectos', 'Bolsa de 907 g',            907.0000, 'Gramos',    'Gramos',    2.0400, 1, 907.0000,   0.00453326),
('Mantequilla de Maní',    'ingrediente', 'Proteinas veg.',  'Super Selectos', 'Frasco de 454 g',           454.0000, 'Gramos',    'Gramos',    2.0000, 1, 454.0000,   0.00440039),
('Tofu',                   'ingrediente', 'Proteinas veg.',  'House Food',     'Paquete de 4 x 340 g',      340.0000, 'Gramos',    'Gramos',    4.2300, 1, 340.0000,   0.01243516),
('Leche de coco',          'ingrediente', 'Lacteos veg.',    'Thai Kitchen',   '6 unidades de 403 ml',      403.0000, 'Mililitro', 'Mililitro', 2.1500, 1, 403.0000,   0.00533499),
('Tomate triturado',       'ingrediente', 'Vegetales',       'Hunts',          '8 latas de 411 g',          411.0000, 'Gramos',    'Gramos',    0.7500, 1, 411.0000,   0.00179330),
('Cebolla blanca',         'ingrediente', 'Vegetales',       NULL,             'Por Libra',                 454.0000, 'Gramos',    'Gramos',    0.6000, 1, 454.0000,   0.00132159),
('Ajo',                    'ingrediente', 'Condimentos',     'Mr. Garlic',     'Red con varios manojos',    456.0000, 'Gramos',    'Gramos',    1.5000, 1, 456.0000,   0.00328947),
('Espinacas frescas',      'ingrediente', 'Vegetales',       'Express',        'Clamshell Plastico 170 g',  170.0000, 'Gramos',    'Gramos',    2.5000, 1, 170.0000,   0.01470588),
('Pasta de Arroz',         'ingrediente', 'Pasta y Granos',  'Three Ladies',   'Unidad 397 g',              397.0000, 'Gramos',    'Gramos',    2.1500, 1, 397.0000,   0.00541561),
('Agua purificada',        'ingrediente', 'Bebidas',         NULL,             'Garrafon de 20 litros',   18927.0500, 'Mililitro', 'Mililitro', 2.0000, 1,18927.0500,  0.00010567),
('Salsa de soya',          'ingrediente', 'Condimentos',     NULL,             'Bote de 1814 g',           1814.0000, 'Gramos',    'Gramos',    3.5000, 1,1814.0000,   0.00192943),
('Ajo en polvo',           'ingrediente', 'Condimentos',     'Badilla',        'Bote de 680 g',             680.0000, 'Gramos',    'Gramos',    2.5000, 1, 680.0000,   0.00367647),
('Cebolla en polvo',       'ingrediente', 'Condimentos',     'Badilla',        'Bote de 567 g',             567.0000, 'Gramos',    'Gramos',    2.1500, 1, 567.0000,   0.00379189),
('Tofu firme (neto sin agua)', 'ingrediente','Proteinas veg.','House Food',    'Paquete de 4 x 340 g',      240.0100, 'Gramos',    'Gramos',    4.2300, 1, 240.0100,   0.01762432),
('Limon entero',           'ingrediente', 'Frutas',          NULL,             'Unidad',                      1.0000, 'Unidad',    'Unidad',    0.2500, 1,   1.0000,   0.25000000),
('Aguacate',               'ingrediente', 'Frutas',          'Super Selectos', 'Unidad aprox 200 g',        200.0000, 'Gramos',    'Gramos',    1.2500, 1, 200.0000,   0.00625000),
('Curry en polvo',         'ingrediente', 'Condimentos',     'Super Selectos', 'Frasco de 60 g',             60.0000, 'Gramos',    'Gramos',    1.7500, 1,  60.0000,   0.02916667),
('Cúrcuma',                'ingrediente', 'Condimentos',     'Super Selectos', 'Frasco de 50 g',             50.0000, 'Gramos',    'Gramos',    1.5000, 1,  50.0000,   0.03000000),
('Jengibre fresco',        'ingrediente', 'Condimentos',     'Super Selectos', 'Trozo aprox 100 g',         100.0000, 'Gramos',    'Gramos',    0.8000, 1, 100.0000,   0.00800000),
('Chickpeas (garbanzos)',   'ingrediente', 'Legumbres',      'Super Selectos', 'Bolsa de 907 g',            907.0000, 'Gramos',    'Gramos',    2.0400, 1, 907.0000,   0.00224917),
('Tomates cherry',         'ingrediente', 'Vegetales',       'Super Selectos', 'Bandeja 250 g',             250.0000, 'Gramos',    'Gramos',    2.5000, 1, 250.0000,   0.01000000),
('Pepino',                 'ingrediente', 'Vegetales',       'Super Selectos', 'Unidad aprox 300 g',        300.0000, 'Gramos',    'Gramos',    0.5000, 1, 300.0000,   0.00166667),
('Cebolla morada',         'ingrediente', 'Vegetales',       'Super Selectos', 'Unidad aprox 150 g',        150.0000, 'Gramos',    'Gramos',    0.4000, 1, 150.0000,   0.00266667),
('Seitan',                 'ingrediente', 'Proteinas veg.',  'Super Selectos', 'Paquete 200 g',             200.0000, 'Gramos',    'Gramos',    3.5000, 1, 200.0000,   0.01750000),
('Pan de sandwich vegano', 'ingrediente', 'Panaderia',       'Super Selectos', 'Bolsa 8 unidades',            1.0000, 'Unidad',    'Unidad',    2.5000, 8,   1.0000,   0.31250000),
('Mayonesa vegana',        'ingrediente', 'Condimentos',     'Super Selectos', 'Frasco 250 g',              250.0000, 'Gramos',    'Gramos',    3.2000, 1, 250.0000,   0.01280000),
('Mostaza',                'ingrediente', 'Condimentos',     'Super Selectos', 'Frasco 250 g',              250.0000, 'Gramos',    'Gramos',    1.5000, 1, 250.0000,   0.00600000),
('Lechuga romana',         'ingrediente', 'Vegetales',       'Super Selectos', 'Unidad aprox 400 g',        400.0000, 'Gramos',    'Gramos',    1.2000, 1, 400.0000,   0.00300000),
('Arroz integral',         'ingrediente', 'Pasta y Granos',  'Super Selectos', 'Bolsa 900 g',               900.0000, 'Gramos',    'Gramos',    1.8000, 1, 900.0000,   0.00200000),
('Quinoa',                 'ingrediente', 'Pasta y Granos',  'Super Selectos', 'Bolsa 500 g',               500.0000, 'Gramos',    'Gramos',    4.5000, 1, 500.0000,   0.00900000),
('Pasta integral',         'ingrediente', 'Pasta y Granos',  'Super Selectos', 'Bolsa 500 g',               500.0000, 'Gramos',    'Gramos',    1.8000, 1, 500.0000,   0.00360000);


-- Verificación
-- SELECT id, nombre, tipo, categoria, costo_unitario, stock FROM ingredientes ORDER BY nombre;
