-- ============================================================
-- ZENSOCI POS — Script B: Datos iniciales
-- Base de datos: u485160167_zensoci_db (Hostinger)
--
-- REQUIERE: haber ejecutado final_A_estructura.sql primero
--
-- QUÉ HACE ESTE SCRIPT:
--   1. Inserta los 20 platillos en costeo_platillos
--   2. Inserta el catálogo de 42 ingredientes en ingredientes
--   3. Inserta la receta completa del Humus Clásico (ejemplo)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- PARTE 1: Platillos con datos financieros del Excel
-- ────────────────────────────────────────────────────────────
INSERT IGNORE INTO `costeo_platillos`
  (numero_menu, nombre, categoria, porciones,
   precio_con_iva, precio_sin_iva,
   costo_porcion, costo_subreceta, costo_empaque, costo_unitario,
   porcentaje_costo, margen_unitario, porcentaje_margen,
   incremento_delivery, precio_delivery, precio_delivery_sin_iva, activo)
VALUES
  (1,  'Humus de zanahoria',                            'Entradas',         4,  8.3828, 7.4184, 1.5424, 0.6321, 0.4219, 2.5965, 0.3500, 4.8220, 0.6500, 0.2712, 10.6563,  9.4303, 1),
  (2,  'Humus de remolacha',                            'Entradas',         4,  7.6839, 6.7999, 1.4007, 0.6321, 0.4219, 2.4548, 0.3610, 4.3451, 0.6390, 0.2712,  9.7678,  8.6440, 1),
  (3,  'Humus clasico',                                 'Entradas',         4,  7.5049, 6.6415, 1.4472, 0.6321, 0.4219, 2.5012, 0.3766, 4.1403, 0.6234, 0.2712,  9.5402,  8.4427, 1),
  (4,  'Humus pesto',                                   'Entradas',         4,  7.6082, 6.7329, 1.9118, 0.6321, 0.4219, 2.9658, 0.4405, 3.7670, 0.5595, 0.2712,  9.6715,  8.5588, 1),
  (5,  'Baba ganush',                                   'Entradas',         4,  8.6353, 7.6418, 1.7620, 0.6321, 0.4219, 2.8160, 0.3685, 4.8258, 0.6315, 0.2712, 10.9771,  9.7143, 1),
  (6,  'Humus de tomates deshidratados',                'Entradas',         4,  8.2542, 7.3046, 1.7729, 0.6321, 0.4219, 2.8269, 0.3870, 4.4777, 0.6130,   NULL,    NULL,    NULL, 1),
  (9,  'Ramen vegano',                                  'Sopas',            4, 12.5812,11.1338, 3.6645, 1.0000, 0.6797, 5.3442, 0.4800, 5.7896, 0.5200, 0.2000, 15.0974, 13.3605, 1),
  (10, 'Sopa de zanahoria',                             'Sopas',            4, 17.7163,15.6781, 1.2466, 6.0196, 0.5525, 7.8187, 0.4987, 7.8594, 0.5013, 0.2000, 21.2595, 18.8137, 1),
  (11, 'Señorita Vitalina (ensalada fresca)',            'Bowls (ensalada)', 4,  8.0570, 7.1301, 1.2031, 1.4967, 0.5095, 3.2093, 0.4501, 3.9208, 0.5499, 0.2000,  9.6684,  8.5561, 1),
  (12, 'Bowl turco',                                    'Bowls (ensalada)', 4,  8.1812, 7.2400, 1.1752, 0.6321, 0.5095, 2.3168, 0.3200, 4.9232, 0.6800, 0.2000,  9.8174,  8.6880, 1),
  (13, 'Green Hulk (Bowl de aguacate)',                 'Bowls (ensalada)', 4,  8.9942, 7.9595, 1.0509, 0.6197, 0.5095, 2.1801, 0.2739, 5.7794, 0.7261, 0.2000, 10.7930,  9.5514, 1),
  (14, 'Curry in a hurry',                              'Especialidades',   4,  8.3707, 7.4077, 1.8072, 0.1851, 0.9656, 2.9579, 0.3993, 4.4498, 0.6007, 0.2000, 10.0449,  8.8893, 1),
  (15, 'Marry Me Chickpeas',                            'Especialidades',   4, 12.7256,11.2616, 3.3681, 0.6321, 0.4684, 4.4686, 0.3968, 6.7930, 0.6032, 0.2000, 15.2707, 13.5139, 1),
  (17, 'Pasta bolognesa vegano',                        'Pasta',            4, 10.3315, 9.1430, 2.3222, 0.0000, 0.4206, 2.7429, 0.3000, 6.4001, 0.7000, 0.2000, 12.3979, 10.9716, 1),
  (18, 'Pad thai chivo',                                'Pasta',            4,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL, 0.2000,   NULL,    NULL, 1),
  (19, 'Sandwich con seitan + hummus de zanahoria',     'Sandwich',         1,  9.5373, 8.4401, 2.1970, 0.3856, 0.3715, 2.9540, 0.3500, 5.4861, 0.6500, 0.2000, 11.4448, 10.1282, 1),
  (20, 'Sandwich con tofu marinado + hummus remolacha', 'Sandwich',         1, 13.1208,11.6113, 1.5043, 3.0439, 0.3715, 4.9197, 0.4237, 6.6916, 0.5763, 0.2000, 15.7449, 13.9336, 1),
  (22, 'Burrito con tofu y repollo morado',             'Sandwich',         1,   NULL,  0.0000,  NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL, 0.2000,  0.0000,  0.0000, 1),
  (45, 'Bolas energéticas',                             'Postres',         22,   NULL,  0.0000,  NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL, 0.2000,  0.0000,  0.0000, 1),
  (47, 'Pastel de dátiles',                             'Postres',          4,   NULL,  0.0000,  NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL, 0.2000,  0.0000,  0.0000, 1);


-- ────────────────────────────────────────────────────────────
-- PARTE 2: Catálogo de ingredientes (del Excel hoja "Ingredientes")
-- ────────────────────────────────────────────────────────────
INSERT INTO `ingredientes`
  (nombre, tipo, unidad, costo_unitario, categoria,
   marca, presentacion_compra, proveedor,
   peso_unitario, unidad_medida_compra,
   precio_compra, precio_compra_sin_iva,
   tipo_envoltorio, temperatura_compra, unidades_por_caja, peso_neto_compra)
VALUES
  ('Harina de trigo integral',          'ingrediente','Gramos',   0.00146325,'Harinas',       'Espiga',           'Saco de 25 libras',           'El Roble Bakery',      11339.80,'Gramos',    18.75, 16.5929,'Saco de papel',     'Ambiente',  1, 11339.80),
  ('Banano maduro',                     'ingrediente','Gramos',   0.00058477,'Frutas',         NULL,              '4 unidades por libra',        'La despensa de Don Juan', 454.00,'Gramos',     0.30,  0.2655, NULL,               'Ambiente',  1,   454.00),
  ('Aceite de coco',                    'ingrediente','Gramos',   0.00807713,'Aceites',        'Members Selection','56 oz / 1587.57 g',           'Pricesmart',            1587.57,'Gramos',    14.49, 12.8230,'Bote de plastico', 'Ambiente',  1,  1587.57),
  ('Sirope de agave',                   'ingrediente','Gramos',   0.01086726,'Endulzantes',    'Members Selection', NULL,                         'Super Selectos',        1250.00,'Gramos',    15.35, 13.5841,'Bote de plastico', 'Ambiente',  1,  1250.00),
  ('Sal Marina',                        'ingrediente','Gramos',   0.03016895,'Condimentos',    'McCormick',        'Frasco 110 g',               'Super Selectos',          110.00,'Gramos',     3.75,  3.3186,'Frasco plastico',  'Ambiente',  1,   110.00),
  ('Curry en polvo',                    'ingrediente','Gramos',   0.03090322,'Especias',       'Badia',            'Botecito de 56.7 g',         'Super Selectos',           56.70,'Gramos',     1.98,  1.7522, NULL,               'Ambiente',  1,    56.70),
  ('Fideos ramen',                      'ingrediente','Gramos',   0.00845588,'Pasta y Granos', NULL,              'HANA UDON NOODLES 3LB',      'Oriental Market',        1360.00,'Gramos',    12.995,11.5000,'Bote plastico',    'Ambiente',  1,  1360.00),
  ('Garbanzos cocidos (netos sin agua)','ingrediente','Gramos',   0.00453326,'Legumbres',      'Calvo',            '4 Latas de 567 g',           'Pricesmart',              306.97,'Gramos',     6.29,  5.5664,'Latas con plastico','Ambiente', 4,  1227.90),
  ('Leche de coco',                     'ingrediente','Mililitro',0.00643771,'Lacteos veg.',   'Thai Kitchen',    '6 unidades de 403 ml',       'Pricesmart',              403.00,'Mililitro', 17.59, 15.5664,'Caja con latas',   'Ambiente',  6,  2418.00),
  ('Tomate triturado',                  'ingrediente','Gramos',   0.00322707,'Vegetales',      'Hunts',            '8 latas de 411 g',           'Pricesmart',              411.00,'Gramos',    11.99, 10.6106,'Caja con latas',   'Ambiente',  8,  3288.00),
  ('Cebolla blanca',                    'ingrediente','Gramos',   0.00179330,'Vegetales',       NULL,              'Por Libra',                  'Super Selectos',          454.00,'Gramos',     0.92,  0.8142, NULL,               'Ambiente',  1,   454.00),
  ('Ajo',                               'ingrediente','Gramos',   0.00613259,'Condimentos',    'Mr. Garlic',       'Red con varios manojos',     'Super Selectos',          456.00,'Gramos',     3.16,  2.7965, NULL,               'Ambiente',  1,   456.00),
  ('Espinacas frescas',                 'ingrediente','Gramos',   0.01795940,'Vegetales',      'Express',         'Clamshell Plastico 170 g',   'Super Selectos',          170.00,'Gramos',     3.45,  3.0531, NULL,               'Ambiente',  1,   170.00),
  ('Pasta de Arroz',                    'ingrediente','Gramos',   0.00913934,'Pasta y Granos', 'Three Ladies',     'Unidad 397 g',               'Super Selectos',          397.00,'Gramos',     4.10,  3.6283,'Paquete plastico', 'Ambiente',  1,   397.00),
  ('Agua purificada',                   'ingrediente','Mililitro',0.00013325,'Bebidas',         NULL,              'Garrafon de 20 litros',       NULL,                    18927.05,'Mililitro',  2.85,  2.5221, NULL,               'Ambiente',  1, 18927.05),
  ('Salsa de soya',                     'ingrediente','Gramos',   0.00463455,'Condimentos',     NULL,              'Bote de 1814 g',             'Super Selectos',         1814.00,'Gramos',     9.50,  8.4071,'Bote de plastico', 'Ambiente',  1,  1814.00),
  ('Ajo en polvo',                      'ingrediente','Gramos',   0.01261062,'Condimentos',    'Badilla',         'Bote de 680 g',              'Pricesmart',              680.00,'Gramos',     9.69,  8.5752,'Bote de plastico', 'Ambiente',  1,   680.00),
  ('Cebolla en polvo',                  'ingrediente','Gramos',   0.01200231,'Condimentos',    'Badilla',         'Bote de 567 g',              'Pricesmart',              567.00,'Gramos',     7.69,  6.8053,'Bote de plastico', 'Ambiente',  1,   567.00),
  ('Tofu firme (neto sin agua)',         'ingrediente','Gramos',   0.01243516,'Proteinas veg.', 'House Food',       'Paquete de 4 x 340 g',       'Pricesmart',              240.01,'Gramos',    13.49, 11.9381,'Caja con paquetes','Refrigerado',4,  960.02),
  ('Limon entero',                      'ingrediente','Unidad',   0.08849558,'Frutas',          NULL,              'Unidad',                     'Super Selectos',            1.00,'Unidad',     0.10,  0.0885, NULL,               'Ambiente',  1,     1.00),
  ('Aceite de oliva',                   'ingrediente','Gramos',   0.00918329,'Aceites',        'Members Selection','2 botes de 1L (1685.44 g)',  'Pricesmart',             1685.44,'Gramos',    17.49, 15.4779,'Bote de plastico', 'Ambiente',  1,  1685.44),
  ('Pimienta',                          'ingrediente','Gramos',   0.02797678,'Especias',       'Badia',            'Frasco 453.6 g',             'Super Selectos',          453.60,'Gramos',    14.34, 12.6903, NULL,               'Ambiente',  1,   453.60),
  ('Jengibre fresco',                   'ingrediente','Gramos',   0.00877159,'Condimentos',     NULL,              'Por libra / 454 g',          'Super Selectos',          454.00,'Gramos',     4.50,  3.9823, NULL,               'Ambiente',  1,   454.00),
  ('Maizena',                           'ingrediente','Gramos',   0.00865290,'Harinas',        'Maizena',         'Cajita de 45 g',             'Super Selectos',           45.00,'Gramos',     0.44,  0.3894,'Caja',             'Ambiente',  1,    45.00),
  ('Vinagre de manzana',                'ingrediente','Mililitro',0.00420494,'Condimentos',    'Vermont Village', '2 x 946 ml',                'Pricesmart',              1892.00,'Mililitro',  8.99,  7.9558,'Bote plastico',    'Ambiente',  1,  1892.00),
  ('Perejil fresco',                    'ingrediente','Gramos',   0.01843658,'Hierbas',         NULL,              'Manojo 60 g',                'Despensa de Don Juan',     60.00,'Gramos',     1.25,  1.1062, NULL,               'Refrigerado',1,   60.00),
  ('Oregano',                           'ingrediente','Gramos',   0.03633967,'Especias',       'McCormick',       'Bote de 141 g',              'Pricesmart',              141.00,'Gramos',     5.79,  5.1239,'Bote plastico',    'Ambiente',  1,   141.00),
  ('Vinagre blanco',                    'ingrediente','Mililitro',0.00072251,'Condimentos',    'Soreli',          'Bote 3650 ml',               'Super Selectos',          3650.00,'Mililitro',  2.98,  2.6372,'Bote plastico',    'Ambiente',  1,  3650.00),
  ('Chile Morron',                      'ingrediente','Gramos',   0.00639351,'Vegetales',       NULL,              'Por Libra',                  'Super Selectos',          454.00,'Gramos',     3.28,  2.9027, NULL,               'Ambiente',  1,   454.00),
  ('Col rizada (kale)',                 'ingrediente','Gramos',   0.01769912,'Vegetales',       NULL,              'Empaque 170 g',              'Super Selectos',          170.00,'Gramos',     3.40,  3.0088, NULL,               'Ambiente',  1,   170.00),
  ('Pepino',                            'ingrediente','Gramos',   0.00135202,'Vegetales',       NULL,              'Unidad 360 g',               'Super Selectos',          360.00,'Gramos',     0.55,  0.4867, NULL,               'Ambiente',  1,   360.00),
  ('Aguacate',                          'ingrediente','Gramos',   0.00263148,'Frutas',          NULL,              'Por libra',                  'Super Selectos',          454.00,'Gramos',     1.35,  1.1947, NULL,               'Ambiente',  1,   454.00),
  ('Levadura nutricional',              'ingrediente','Gramos',   0.06682461,'Condimentos',    'Bragg',           'Bote de 127 g',              'Super Selectos',          127.00,'Gramos',     9.59,  8.4867, NULL,               'Ambiente',  1,   127.00),
  ('Garam Masala',                      'ingrediente','Gramos',   0.07374631,'Especias',        NULL,              'Bote de vidrio 60 g',        'Yek Tunal',                60.00,'Gramos',     5.00,  4.4248, NULL,               'Ambiente',  1,    60.00),
  ('Comino molido',                     'ingrediente','Gramos',   0.06040785,'Especias',       'Badia',           'Bote de 23 g',               'Super Selectos',           23.00,'Gramos',     1.57,  1.3894, NULL,               'Ambiente',  1,    23.00),
  ('Tahini',                            'ingrediente','Gramos',   0.02631476,'Pastas',          NULL,               NULL,                         NULL,                       NULL,'Gramos',      NULL,   NULL,  NULL,               'Ambiente',  1,     NULL),
  ('Paprika en polvo',                  'ingrediente','Gramos',   0.01267851,'Especias',        NULL,               NULL,                         NULL,                       NULL,'Gramos',      NULL,   NULL,  NULL,               'Ambiente',  1,     NULL),
  ('Zanahoria',                         'ingrediente','Gramos',   0.00126701,'Vegetales',       NULL,              'Por libra',                  'Super Selectos',          454.00,'Gramos',     0.65,  0.5752, NULL,               'Ambiente',  1,   454.00),
  ('Aceite de sesamo',                  'ingrediente','Gramos',   0.02989715,'Aceites',         NULL,              'Bote de 185 ml',              NULL,                      185.00,'Gramos',     6.25,  5.5310, NULL,               'Ambiente',  1,   185.00),
  ('Tomate',                            'ingrediente','Gramos',   0.00179330,'Vegetales',       NULL,              'Por libra',                  'Super Selectos',          454.00,'Gramos',     0.65,  0.5752, NULL,               'Ambiente',  1,   454.00),
  ('Pan de masa madre',                 'subreceta',  'Unidad',   0.63211125,'Subrecetas',      NULL,              'Entero (7 porciones)',         NULL,                        7.00,'Unidad',     5.00,  4.4248, NULL,               'Ambiente',  1,     7.00);


-- ────────────────────────────────────────────────────────────
-- PARTE 3: Receta del Humus Clasico (platillo nº 3) — ejemplo completo
-- ────────────────────────────────────────────────────────────
INSERT INTO `ingredientes`
  (nombre, tipo, tipo_receta, costeo_platillo_id,
   cantidad, unidad_medida, porcentaje_merma,
   precio_ref, costo_linea, costo_unitario, unidad)
VALUES
  ('Garbanzos cocidos (netos sin agua)', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   614.0, 'gramos', 0.0, 0.00453326, 2.7834, 0.00453326, 'gramos'),

  ('Tahini', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   70.0, 'gramos', 0.0, 0.02631476, 1.8420, 0.02631476, 'gramos'),

  ('Aceite de oliva', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   8.0, 'gramos', 0.0, 0.00918329, 0.0735, 0.00918329, 'gramos'),

  ('Sal Marina', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   5.0, 'gramos', 0.0, 0.03016895, 0.1508, 0.03016895, 'gramos'),

  ('Comino molido', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   4.0, 'gramos', 0.0, 0.06040785, 0.2416, 0.06040785, 'gramos'),

  ('Paprika en polvo', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   3.0, 'gramos', 0.0, 0.01267851, 0.0380, 0.01267851, 'gramos'),

  ('Pimienta', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   2.0, 'gramos', 0.0, 0.02797678, 0.0560, 0.02797678, 'gramos'),

  ('Sirope de agave', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   4.0, 'gramos', 0.0, 0.01086726, 0.0435, 0.01086726, 'gramos'),

  ('Ajo', 'ingrediente', 'principal',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   9.0, 'gramos', 0.0, 0.00613259, 0.0552, 0.00613259, 'gramos'),

  ('Pan de masa madre', 'subreceta', 'secundario',
   (SELECT id FROM costeo_platillos WHERE numero_menu = 3 LIMIT 1),
   1.0, 'Unidad', 0.0, 0.63211125, 0.6321, 0.63211125, 'Unidad');


-- ── Verificacion final ────────────────────────────────────────────────
-- SELECT COUNT(*) AS platillos FROM costeo_platillos;
-- SELECT COUNT(*) AS ingredientes_catalogo FROM ingredientes WHERE costeo_platillo_id IS NULL;
-- SELECT COUNT(*) AS lineas_receta FROM ingredientes WHERE costeo_platillo_id IS NOT NULL;
