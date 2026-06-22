-- ============================================================
-- ZENSOCI POS — Migración 002: Datos iniciales de Costeo
-- REQUIERE: haber ejecutado 001_costeo_tables.sql primero
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Platillos con sus datos financieros (fuente: Excel "Precios Menu")
-- ────────────────────────────────────────────────────────────
INSERT INTO `costeo_platillos`
  (numero_menu, nombre, categoria, porciones,
   precio_con_iva, precio_sin_iva,
   costo_porcion, costo_subreceta, costo_empaque, costo_unitario,
   porcentaje_costo, margen_unitario, porcentaje_margen,
   incremento_delivery, precio_delivery, precio_delivery_sin_iva, activo)
VALUES
  (1,  'Humus de zanahoria',                              'Entradas',         4, 8.382845, 7.418447, 1.542432, 0.632111, 0.421913, 2.596456, 0.3500, 4.821991, 0.6500, 0.2712, 10.656273, 9.430330, 1),
  (2,  'Humus de remolacha',                              'Entradas',         4, 7.683890, 6.799902, 1.400740, 0.632111, 0.421913, 2.454765, 0.3610, 4.345138, 0.6390, 0.2712,  9.767760, 8.644036, 1),
  (3,  'Humus clasico',                                   'Entradas',         4, 7.504906, 6.641509, 1.447168, 0.632111, 0.421913, 2.501192, 0.3766, 4.140317, 0.6234, 0.2712,  9.540236, 8.442687, 1),
  (4,  'Humus pesto',                                     'Entradas',         4, 7.608154, 6.732879, 1.911809, 0.632111, 0.421913, 2.965833, 0.4405, 3.767046, 0.5595, 0.2712,  9.671485, 8.558836, 1),
  (5,  'Baba ganush',                                     'Entradas',         4, 8.635265, 7.641828, 1.761989, 0.632111, 0.421913, 2.816014, 0.3685, 4.825814, 0.6315, 0.2712, 10.977149, 9.714291, 1),
  (6,  'Humus de tomates deshidratados',                  'Entradas',         4, 8.254232, 7.304630, 1.772867, 0.632111, 0.421913, 2.826892, 0.3870, 4.477738, 0.6130,   NULL,      NULL,      NULL, 1),
  (9,  'Ramen vegano',                                    'Sopas',            4,12.581161,11.133770, 3.664473, 1.000000, 0.679737, 5.344210, 0.4800, 5.789561, 0.5200, 0.2000, 15.097393,13.360525, 1),
  (10, 'Sopa de zanahoria',                               'Sopas',            4,17.716267,15.678113, 1.246588, 6.019566, 0.552520, 7.818675, 0.4987, 7.859438, 0.5013, 0.2000, 21.259521,18.813735, 1),
  (11, 'Señorita Vitalina (ensalada fresca)',              'Bowls (ensalada)', 4, 8.057028, 7.130113, 1.203079, 1.496651, 0.509533, 3.209264, 0.4501, 3.920849, 0.5499, 0.2000,  9.668433, 8.556136, 1),
  (12, 'Bowl turco',                                      'Bowls (ensalada)', 4, 8.181180, 7.239983, 1.175150, 0.632111, 0.509533, 2.316794, 0.3200, 4.923188, 0.6800, 0.2000,  9.817416, 8.687979, 1),
  (13, 'Green Hulk (Bowl de aguacate)',                   'Bowls (ensalada)', 4, 8.994205, 7.959473, 1.050854, 0.619712, 0.509533, 2.180100, 0.2739, 5.779374, 0.7261, 0.2000, 10.793046, 9.551368, 1),
  (14, 'Curry in a hurry',                                'Especialidades',   4, 8.370714, 7.407712, 1.807240, 0.185086, 0.965573, 2.957899, 0.3993, 4.449812, 0.6007, 0.2000, 10.044857, 8.889254, 1),
  (15, 'Marry Me Chickpeas',                              'Especialidades',   4,12.725576,11.261572, 3.368127, 0.632111, 0.468353, 4.468592, 0.3968, 6.792980, 0.6032, 0.2000, 15.270691,13.513886, 1),
  (17, 'Pasta bolognesa vegano',                          'Pasta',            4,10.331548, 9.142962, 2.322245, 0.000000, 0.420644, 2.742889, 0.3000, 6.400074, 0.7000, 0.2000, 12.397857,10.971555, 1),
  (18, 'Pad thai chivo',                                  'Pasta',            4,     NULL,     NULL,     NULL,     NULL,     NULL,     NULL,   NULL,     NULL,   NULL, 0.2000,      NULL,      NULL, 1),
  (19, 'Sandwich con seitan + hummus de zanahoria',       'Sandwich',         1, 9.537347, 8.440130, 2.196957, 0.385608, 0.371480, 2.954045, 0.3500, 5.486084, 0.6500, 0.2000, 11.444816,10.128156, 1),
  (20, 'Sandwich con tofu marinado + hummus remolacha',   'Sandwich',         1,13.120771,11.611301, 1.504316, 3.043913, 0.371480, 4.919708, 0.4237, 6.691593, 0.5763, 0.2000, 15.744925,13.933562, 1),
  (22, 'Burrito con tofu y repollo morado',               'Sandwich',         1,     NULL,  0.000000,     NULL,     NULL,     NULL,     NULL,   NULL,     NULL,   NULL, 0.2000,   0.000000,  0.000000, 1),
  (45, 'Bolas energéticas',                               'Postres',         22,     NULL,  0.000000,     NULL,     NULL,     NULL,     NULL,   NULL,     NULL,   NULL, 0.2000,   0.000000,  0.000000, 1),
  (47, 'Pastel de dátiles',                               'Postres',          4,     NULL,  0.000000,     NULL,     NULL,     NULL,     NULL,   NULL,     NULL,   NULL, 0.2000,   0.000000,  0.000000, 1)
ON DUPLICATE KEY UPDATE
  nombre               = VALUES(nombre),
  categoria            = VALUES(categoria),
  precio_con_iva       = VALUES(precio_con_iva),
  precio_sin_iva       = VALUES(precio_sin_iva),
  costo_porcion        = VALUES(costo_porcion),
  costo_subreceta      = VALUES(costo_subreceta),
  costo_empaque        = VALUES(costo_empaque),
  costo_unitario       = VALUES(costo_unitario),
  porcentaje_costo     = VALUES(porcentaje_costo),
  margen_unitario      = VALUES(margen_unitario),
  porcentaje_margen    = VALUES(porcentaje_margen),
  incremento_delivery  = VALUES(incremento_delivery),
  precio_delivery      = VALUES(precio_delivery),
  precio_delivery_sin_iva = VALUES(precio_delivery_sin_iva);


-- ────────────────────────────────────────────────────────────
-- Catálogo de ingredientes (filas CON NULL en costeo_platillo_id)
-- Fuente: Excel hoja "Ingredientes" — costo unitario sin IVA
-- ────────────────────────────────────────────────────────────
INSERT INTO `ingredientes`
  (nombre, tipo, unidad, costo_unitario, categoria,
   marca, presentacion_compra, proveedor,
   peso_unitario, unidad_medida_compra,
   precio_compra, precio_compra_sin_iva,
   tipo_envoltorio, temperatura_compra,
   unidades_por_caja, peso_neto_compra)
VALUES
  ('Harina de trigo integral',        'ingrediente', 'Gramos',   0.00146325, 'Harinas',       'Espiga',          'Saco de 25 libras',                  'El Roble Bakery',     11339.80, 'Gramos',   18.75, 16.5929, 'Saco de papel',      'Ambiente',    1, 11339.80),
  ('Banano maduro',                   'ingrediente', 'Gramos',   0.00058477, 'Frutas',        NULL,              '4 unidades por libra aproximadamente','La despensa de Don Juan', 454.00, 'Gramos',   0.30,  0.2655, NULL,                 'Ambiente',    1,   454.00),
  ('Aceite de coco',                  'ingrediente', 'Gramos',   0.00807713, 'Aceites',       'Members Selection','56 oz / 1587.57 g',                  'Pricesmart',           1587.57, 'Gramos',  14.49, 12.8230, 'Bote de plástico',   'Ambiente',    1,  1587.57),
  ('Sirope de agave',                 'ingrediente', 'Gramos',   0.01086726, 'Endulzantes',   'Members Selection', NULL,                                'Super Selectos',       1250.00, 'Gramos',  15.35, 13.5841, 'Bote de plástico',   'Ambiente',    1,  1250.00),
  ('Sal Marina',                      'ingrediente', 'Gramos',   0.03016895, 'Condimentos',   'McCormick',       'Frasco',                             'Super Selectos',        110.00, 'Gramos',   3.75,  3.3186, 'Frasco plástico',    'Ambiente',    1,   110.00),
  ('Curry en polvo',                  'ingrediente', 'Gramos',   0.03090322, 'Especias',      'Badia',           'Botecito de 56.7 g',                 'Super Selectos',         56.70, 'Gramos',   1.98,  1.7522, NULL,                 'Ambiente',    1,    56.70),
  ('Fideos ramen',                    'ingrediente', 'Gramos',   0.00845588, 'Pasta/Granos',  NULL,              'HANA UDON NOODLES 3LB',              'Oriental Market',      1360.00, 'Gramos',  12.995,11.5000, 'Bote plástico',      'Ambiente',    1,  1360.00),
  ('Garbanzos cocidos (netos sin agua)','ingrediente','Gramos',  0.00453326, 'Legumbres',     'Calvo',           '4 Latas de 567 g c/u',               'Pricesmart',            306.97, 'Gramos',   6.29,  5.5664, 'Latas con plástico', 'Ambiente',    4,  1227.90),
  ('Leche de coco',                   'ingrediente', 'Mililitro',0.00643771, 'Lácteos veg.',  'Thai Kitchen',    '6 unidades de 403ml c/u',            'Pricesmart',            403.00, 'Mililitro',17.59, 15.5664, 'Caja con latas',     'Ambiente',    6,  2418.00),
  ('Tomate triturado',                'ingrediente', 'Gramos',   0.00322707, 'Vegetales',     'Hunts',           '8 latas de 411g c/u',                'Pricesmart',            411.00, 'Gramos',  11.99, 10.6106, 'Caja con latas',     'Ambiente',    8,  3288.00),
  ('Cebolla blanca',                  'ingrediente', 'Gramos',   0.00179330, 'Vegetales',     NULL,              'Por Libra',                          'Super Selectos',        454.00, 'Gramos',   0.92,  0.8142, NULL,                 'Ambiente',    1,   454.00),
  ('Ajo',                             'ingrediente', 'Gramos',   0.00613259, 'Condimentos',   'Mr. Garlic',      'Red con varios manojos',             'Super Selectos',        456.00, 'Gramos',   3.16,  2.7965, NULL,                 'Ambiente',    1,   456.00),
  ('Espinacas frescas',               'ingrediente', 'Gramos',   0.01795940, 'Vegetales',     'Express',         'Clamshell Plástico',                 'Super Selectos',        170.00, 'Gramos',   3.45,  3.0531, NULL,                 'Ambiente',    1,   170.00),
  ('Pasta de Arroz',                  'ingrediente', 'Gramos',   0.00913934, 'Pasta/Granos',  'Three Ladies Brand','Unidad',                           'Super Selectos',        397.00, 'Gramos',   4.10,  3.6283, 'Paquete de plástico','Ambiente',    1,   397.00),
  ('Agua purificada',                 'ingrediente', 'Mililitro',0.00013325, 'Bebidas',       'Cristal',         'Garrafón de 20 litros',              NULL,                  18927.05, 'Mililitro', 2.85,  2.5221, NULL,                 'Ambiente',    1, 18927.05),
  ('Salsa de soya',                   'ingrediente', 'Gramos',   0.00463455, 'Condimentos',   NULL,              'Bote de 1814 g',                     'Super Selectos',       1814.00, 'Gramos',   9.50,  8.4071, 'Bote de plástico',   'Ambiente',    1,  1814.00),
  ('Ajo en polvo',                    'ingrediente', 'Gramos',   0.01261062, 'Condimentos',   'Badilla',         'Bote de 680 gramos',                 'Pricesmart',            680.00, 'Gramos',   9.69,  8.5752, 'Bote de plástico',   'Ambiente',    1,   680.00),
  ('Cebolla en polvo',                'ingrediente', 'Gramos',   0.01200231, 'Condimentos',   'Badilla',         'Bote de 567 gramos',                 'Pricesmart',            567.00, 'Gramos',   7.69,  6.8053, 'Bote de plástico',   'Ambiente',    1,   567.00),
  ('Tomillo seco',                    'ingrediente', 'Gramos',   0.08761062, 'Especias',      'Producto Solis',  'Bolsa de 10 gramos',                 'Super Selectos',         10.00, 'Gramos',   0.99,  0.8761, 'Bolsa plástica',     'Ambiente',    1,    10.00),
  ('Tofu firme (neto sin agua)',       'ingrediente', 'Gramos',   0.01243516, 'Proteínas veg.','House Food',      'Paquete de 4 x 340 g',              'Pricesmart',            240.01, 'Gramos',  13.49, 11.9381, 'Caja con paquetes',  'Refrigerado', 4,   960.02),
  ('Limón entero',                    'ingrediente', 'Unidad',   0.08849558, 'Frutas',        NULL,              'Unidad',                             'Super Selectos',          1.00, 'Unidad',   0.10,  0.0885, NULL,                 'Ambiente',    1,     1.00),
  ('Aceite de oliva',                 'ingrediente', 'Gramos',   0.00918329, 'Aceites',       'Members Selection','2 botes de 1L c/u (1685.44 g)',     'Pricesmart',           1685.44, 'Gramos',  17.49, 15.4779, 'Bote de plástico',   'Ambiente',    1,  1685.44),
  ('Pimienta',                        'ingrediente', 'Gramos',   0.02797678, 'Especias',      'Badia',           NULL,                                 'Super Selectos',        453.60, 'Gramos',  14.34, 12.6903, NULL,                 'Ambiente',    1,   453.60),
  ('Jengibre fresco',                 'ingrediente', 'Gramos',   0.00877159, 'Condimentos',   NULL,              'Por libra / 454 g',                  'Super Selectos',        454.00, 'Gramos',   4.50,  3.9823, NULL,                 'Ambiente',    1,   454.00),
  ('Maizena',                         'ingrediente', 'Gramos',   0.00865290, 'Harinas',       'Maizena',         'Cajita de 45 gramos',                'Super Selectos',         45.00, 'Gramos',   0.44,  0.3894, 'Caja',               'Ambiente',    1,    45.00),
  ('Romero',                          'ingrediente', 'Gramos',   0.06321113, 'Especias',      'Super Selectos',  'Bolsa de 14 gramos',                 'Super Selectos',         14.00, 'Gramos',   1.00,  0.8850, 'Bolsa plástica',     'Ambiente',    1,    14.00),
  ('Vinagre de manzana',              'ingrediente', 'Mililitro',0.00420494, 'Condimentos',   'Vermont Village', '2 x 946ml',                          'Pricesmart',           1892.00, 'Mililitro', 8.99,  7.9558, 'Bote plástico',      'Ambiente',    1,  1892.00),
  ('Perejil fresco',                  'ingrediente', 'Gramos',   0.01843658, 'Hierbas',       NULL,              'Manojo',                             'Despensa de Don Juan',   60.00, 'Gramos',   1.25,  1.1062, NULL,                 'Refrigerado', 1,    60.00),
  ('Orégano',                         'ingrediente', 'Gramos',   0.03633967, 'Especias',      'McCormick',       'Bote de 141 gramos',                 'Pricesmart',            141.00, 'Gramos',   5.79,  5.1239, 'Bote plástico',      'Ambiente',    1,   141.00),
  ('Vinagre blanco',                  'ingrediente', 'Mililitro',0.00072251, 'Condimentos',   'Soreli',          'Bote 3650 ml',                       'Super Selectos',       3650.00, 'Mililitro', 2.98,  2.6372, 'Bote plástico',      'Ambiente',    1,  3650.00),
  ('Chile Morron',                    'ingrediente', 'Gramos',   0.00639351, 'Vegetales',     NULL,              'Por Libra',                          'Super Selectos',        454.00, 'Gramos',   3.28,  2.9027, NULL,                 'Ambiente',    1,   454.00),
  ('Col rizada (kale)',               'ingrediente', 'Gramos',   0.01769912, 'Vegetales',     NULL,              'Empaque 170 gramos',                 'Super Selectos',        170.00, 'Gramos',   3.40,  3.0088, NULL,                 'Ambiente',    1,   170.00),
  ('Pepino',                          'ingrediente', 'Gramos',   0.00135202, 'Vegetales',     NULL,              'Unidad',                             'Super Selectos',        360.00, 'Gramos',   0.55,  0.4867, NULL,                 'Ambiente',    1,   360.00),
  ('Aguacate',                        'ingrediente', 'Gramos',   0.00263148, 'Frutas',        NULL,              'Por libra',                          'Super Selectos',        454.00, 'Gramos',   1.35,  1.1947, NULL,                 'Ambiente',    1,   454.00),
  ('Levadura nutricional',            'ingrediente', 'Gramos',   0.06682461, 'Condimentos',   'Bragg',           'Bote de 127 gramos',                 'Super Selectos',        127.00, 'Gramos',   9.59,  8.4867, NULL,                 'Ambiente',    1,   127.00),
  ('Garam Masala',                    'ingrediente', 'Gramos',   0.07374631, 'Especias',      NULL,              'Bote de vidrio 60 g',                'Yek Tunal',              60.00, 'Gramos',   5.00,  4.4248, NULL,                 'Ambiente',    1,    60.00),
  ('Comino molido',                   'ingrediente', 'Gramos',   0.06040785, 'Especias',      'Badia',           'Bote de 23 gramos',                  'Super Selectos',         23.00, 'Gramos',   1.57,  1.3894, NULL,                 'Ambiente',    1,    23.00),
  ('Tahini',                          'ingrediente', 'Gramos',   0.02631476, 'Pastas',        NULL,              NULL,                                 NULL,                      NULL, 'Gramos',   NULL,   NULL, NULL,                 'Ambiente',    1,     NULL),
  ('Paprika en polvo',                'ingrediente', 'Gramos',   0.01267851, 'Especias',      NULL,              NULL,                                 NULL,                      NULL, 'Gramos',   NULL,   NULL, NULL,                 'Ambiente',    1,     NULL),
  ('Zanahoria',                       'ingrediente', 'Gramos',   0.00126701, 'Vegetales',     NULL,              'Por libra',                          'Super Selectos',        454.00, 'Gramos',   0.65,  0.5752, NULL,                 'Ambiente',    1,   454.00),
  ('Aceite de sesamo',                'ingrediente', 'Gramos',   0.02989715, 'Aceites',       NULL,              'Bote de 185 ml',                     NULL,                    185.00, 'Gramos',   6.25,  5.5310, NULL,                 'Ambiente',    1,   185.00),
  ('Pan de masa madre',               'subreceta',   'Unidad',   0.63211125, 'Subrecetas',    NULL,              'Entero (7 porciones)',                NULL,                      7.00, 'Unidad',   5.00,  4.4248, NULL,                 'Ambiente',    1,     7.00)
ON DUPLICATE KEY UPDATE
  costo_unitario        = VALUES(costo_unitario),
  marca                 = VALUES(marca),
  presentacion_compra   = VALUES(presentacion_compra),
  proveedor             = VALUES(proveedor),
  precio_compra         = VALUES(precio_compra),
  precio_compra_sin_iva = VALUES(precio_compra_sin_iva);


-- ────────────────────────────────────────────────────────────
-- Líneas de receta para Humus Clásico (platillo nº3)
-- Fuente: Excel hoja "Humus clasico" (sheet12)
-- ────────────────────────────────────────────────────────────
INSERT INTO `ingredientes`
  (nombre, tipo, tipo_receta, costeo_platillo_id,
   cantidad, unidad_medida, porcentaje_merma,
   precio_ref, costo_linea, costo_unitario, unidad)
SELECT
  v.nombre, 'ingrediente', v.tipo_receta,
  cp.id,
  v.cantidad, v.unidad_medida, v.merma,
  v.precio_ref, v.costo_linea, v.precio_ref, v.unidad_medida
FROM (VALUES
  ROW('Garbanzos cocidos (netos sin agua)', 'principal', 614.0, 'gramos', 0.0, 0.00453326, 2.783423),
  ROW('Tahini',                             'principal',  70.0, 'gramos', 0.0, 0.02631476, 1.842033),
  ROW('Aceite de oliva',                    'principal',   8.0, 'gramos', 0.0, 0.00918329, 0.073466),
  ROW('Sal Marina',                         'principal',   5.0, 'gramos', 0.0, 0.03016895, 0.150845),
  ROW('Comino molido',                      'principal',   4.0, 'gramos', 0.0, 0.06040785, 0.241631),
  ROW('Paprika en polvo',                   'principal',   3.0, 'gramos', 0.0, 0.01267851, 0.038036),
  ROW('Pimienta',                           'principal',   2.0, 'gramos', 0.0, 0.02797678, 0.055954),
  ROW('Sirope de agave',                    'principal',   4.0, 'gramos', 0.0, 0.01086726, 0.043469),
  ROW('Ajo',                                'principal',   9.0, 'gramos', 0.0, 0.00613259, 0.055193),
  ROW('Pan de masa madre',                  'secundario',  1.0, 'Unidad', 0.0, 0.63211125, 0.632111)
) AS v(nombre, tipo_receta, cantidad, unidad_medida, merma, precio_ref, costo_linea)
CROSS JOIN `costeo_platillos` cp
WHERE cp.numero_menu = 3;
