-- ============================================================================
-- ZENSOCI POS — UNIFICACIÓN DE INVENTARIO Y COSTEO  (con tabla `empaques`)
-- ----------------------------------------------------------------------------
-- Catálogos maestros compartidos entre Inventario y Costeo:
--   • ingredients  -> ingredientes y subrecetas (alimentos)
--   • empaques     -> material de empaque (envases, tapas, cubiertos, bolsas…)
--
-- El detalle de costeo (costeo_detalle_ingredientes) enlaza:
--   - líneas 'principal'/'secundario'  -> ingredients.ingredient_id
--   - líneas 'empaque'                 -> empaques.empaque_id
--
-- Cambios ADITIVOS: no se borra ni renombra nada; el inventario actual sigue igual.
-- Base: u485160167_zensoci_db  (MariaDB 11.8 / Hostinger)
-- ============================================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
START TRANSACTION;

-- ----------------------------------------------------------------------------
-- PASO 0 (PRE-VUELO) — Ejecuta por separado. Si devuelve filas, unifica los
-- nombres repetidos ANTES de continuar (el PASO 1 crea UNIQUE sobre `name`).
-- ----------------------------------------------------------------------------
-- SELECT name, COUNT(*) c FROM ingredients GROUP BY name HAVING c > 1;

-- ----------------------------------------------------------------------------
-- PASO 1 — Enriquecer `ingredients` (ingredientes + subrecetas)
-- ----------------------------------------------------------------------------
ALTER TABLE `ingredients`
  ADD COLUMN `tipo` ENUM('ingrediente','subreceta') NOT NULL DEFAULT 'ingrediente' AFTER `name`,
  ADD COLUMN `brand` VARCHAR(120) DEFAULT NULL AFTER `category_label`,
  ADD COLUMN `presentation` VARCHAR(200) DEFAULT NULL AFTER `brand`,
  ADD COLUMN `purchase_price_no_iva` DECIMAL(12,4) DEFAULT NULL COMMENT 'Precio de compra del paquete sin IVA' AFTER `cost`,
  ADD COLUMN `unit_cost` DECIMAL(16,8) DEFAULT NULL COMMENT 'Costo neto unitario sin IVA (por g/ml/unidad). Lo usa el costeo.';

ALTER TABLE `ingredients` ADD UNIQUE KEY `uq_ingredients_name` (`name`);

-- ----------------------------------------------------------------------------
-- PASO 2 — Crear la tabla `empaques` (catálogo de material de empaque)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `empaques` (
  `id`                    INT(11)        NOT NULL AUTO_INCREMENT,
  `name`                  VARCHAR(200)   NOT NULL COMMENT 'Nombre / descripción del empaque',
  `category_label`        VARCHAR(80)    DEFAULT NULL COMMENT 'Envase, Tapa, Cubierto, Bolsa, etc.',
  `brand`                 VARCHAR(120)   DEFAULT NULL,
  `supplier`              VARCHAR(120)   DEFAULT NULL COMMENT 'Proveedor',
  `presentation`          VARCHAR(200)   DEFAULT NULL COMMENT 'Presentación de compra (ej. caja de 24 un)',
  `unit`                  VARCHAR(40)    DEFAULT 'Unidad',
  `units_per_pack`        DECIMAL(10,2)  DEFAULT NULL COMMENT 'Unidades por caja/paquete',
  `purchase_price_no_iva` DECIMAL(12,4)  DEFAULT NULL COMMENT 'Precio del paquete sin IVA',
  `unit_cost`             DECIMAL(16,8)  DEFAULT NULL COMMENT 'Costo unitario sin IVA. Lo usa el costeo.',
  `stock_qty`             DECIMAL(10,2)  DEFAULT 0 COMMENT 'Existencias actuales',
  `min_stock`             DECIMAL(10,2)  DEFAULT 0 COMMENT 'Stock mínimo',
  `activo`                TINYINT(1)     NOT NULL DEFAULT 1,
  `created_at`            TIMESTAMP      NULL DEFAULT current_timestamp(),
  `updated_at`            TIMESTAMP      NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_empaques_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de material de empaque';

-- ----------------------------------------------------------------------------
-- PASO 3 — Vincular el detalle de costeo a AMBOS catálogos
-- ----------------------------------------------------------------------------
ALTER TABLE `costeo_detalle_ingredientes`
  ADD COLUMN `ingredient_id` INT(11) DEFAULT NULL AFTER `costeo_platillo_id`,
  ADD COLUMN `empaque_id`    INT(11) DEFAULT NULL AFTER `ingredient_id`,
  ADD KEY `idx_detalle_ingrediente` (`ingredient_id`),
  ADD KEY `idx_detalle_empaque` (`empaque_id`),
  ADD CONSTRAINT `fk_detalle_ingrediente` FOREIGN KEY (`ingredient_id`)
      REFERENCES `ingredients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalle_empaque` FOREIGN KEY (`empaque_id`)
      REFERENCES `empaques` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- PASO 4 — Poblar `ingredients` (UPSERT por name). No toca stock_qty/min_stock.
-- ----------------------------------------------------------------------------
INSERT INTO `ingredients`
  (`name`,`tipo`,`category_label`,`brand`,`presentation`,`supplier`,`unit`,`cost`,`purchase_price_no_iva`,`unit_cost`)
VALUES
  ('Harina de trigo integral final','ingrediente','Ingrediente','Espiga','Saco de 25 libras','El Roble Bakery','gramos',0.0015,16.59292035,0.00146325),
  ('Banano maduro','ingrediente','Ingrediente',NULL,'4 unidades por libra aproximadamente','La despensa de Don Juan','Libra',0.0006,0.26548673,0.00058477),
  ('Aceite de coco','ingrediente','Ingrediente','Members Selection','56 onzas a gramos son 1587.57','Pricesmart','Gramos',0.0081,12.82300885,0.00807713),
  ('Sirope de agave','ingrediente','Ingrediente','Members Selection',NULL,'Super Selectos','Gramos',0.0109,13.5840708,0.01086726),
  ('Polvo de hornear','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Sal Marina','ingrediente','Ingrediente','McCormick','Frasco','Super Selectos','Gramos',0.0302,3.31858407,0.03016895),
  ('Nuggets Veganos','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Salsa de tomate','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Curry en polvo','ingrediente','Ingrediente','Badia','Botecito de 56.7 g','Super Selectos','Gramos',0.0309,1.75221239,0.03090322),
  ('Fideos ramen','ingrediente','Ingrediente',NULL,'HANA UDON NOODLES (HOSHI MARU) 3LB (08064J)','Oriental Market','Gramos',0.0085,11.5,0.00845588),
  ('Garbanzos cocidos (netos sin agua)','ingrediente','Ingrediente','Calvo','4 Latas de 567 g c/u','Pricesmart','Gramos',0.0045,5.56637168,0.00453326),
  ('Leche de coco','ingrediente','Ingrediente','Thai Kitchen','6 unidades de 403ml c/u','Pricesmart','Mililitro',0.0064,15.56637168,0.00643771),
  ('Tomate triturado','ingrediente','Ingrediente','Hunts','8 latas de 411g c/u','Pricesmart','Gramos',0.0032,10.61061947,0.00322707),
  ('Cebolla blanca','ingrediente','Ingrediente',NULL,'Por Libra','Super Selectos','Gramos',0.0018,0.81415929,0.0017933),
  ('Ajo','ingrediente','Ingrediente','Mr. Garlic','Ajo chino en red con varios manojos de ajo','Super Selectos','Gramos',0.0061,2.79646018,0.00613259),
  ('Espinacas frescas','ingrediente','Ingrediente','Express','Clamshell Plastico','Super Selectos','Gramos',0.018,3.05309735,0.0179594),
  ('Pasta de Arroz','ingrediente','Ingrediente','Three Ladies Brand','Unidad','Super Selectos','Gramos',0.0091,3.62831858,0.00913934),
  ('Agua purificada','ingrediente','Ingrediente','Cristal','Garrafon de 20 litros',NULL,'Mililitro',0.0001,2.52212389,0.00013325),
  ('Salsa de soya','ingrediente','Ingrediente',NULL,'Bote de Plastico de 1814 g','Super Selectos','Gramos',0.0046,8.40707965,0.00463455),
  ('Ajo en polvo','ingrediente','Ingrediente','Badilla','Bote de 680 gramos','Pricemart','Gramos',0.0126,8.57522124,0.01261062),
  ('Cebolla en polvo','ingrediente','Ingrediente','Badilla','Bote de 567 gramos','Pricemart','Gramos',0.012,6.80530973,0.01200231),
  ('Tomillo seco','ingrediente','Ingrediente','Producto Solis','Bolsa de 10 gramos','Super Selectos','Gramos',0.0876,0.87610619,0.08761062),
  ('Tofu firme (neto sin agua)','ingrediente','Ingrediente','House Food','Paquete de 4 unidades de 340 gms c/u','Pricesmart','Gramos',0.0124,11.9380531,0.01243516),
  ('Limón entero','ingrediente','Ingrediente',NULL,'Unidad','Super Selectos','Unidad',0.0885,0.08849558,0.08849558),
  ('Ralladura de limón','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Aceite de oliva','ingrediente','Ingrediente','Members Selection','2 botes de 1 litro c/u (916 gramos c/u). Conv x 0.92','Pricesmart','Gramos',0.0092,15.47787611,0.00918329),
  ('Pimienta','ingrediente','Ingrediente','Badia',NULL,'Super Selectos','Gramos',0.028,12.69026549,0.02797678),
  ('Azúcar morena','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Jengibre fresco','ingrediente','Ingrediente',NULL,'Jengibre lb/454 g','Super Selectos','Gramos',0.0088,3.98230088,0.00877159),
  ('Maizena','ingrediente','Ingrediente','Maizena','Cajita pequeña de 45 gramos','Super Selectos','Gramos',0.0087,0.38938053,0.0086529),
  ('Romero','ingrediente','Ingrediente','Super Selectos','Bolsa de 14 gramos','Super Selectos','Gramos',0.0632,0.88495575,0.06321113),
  ('Vinagre de manzana','ingrediente','Ingrediente','Vermont Village','Paquete de 2 unidades, c/u peso 946ml','Pricesmart','Mililitro',0.0042,7.95575221,0.00420494),
  ('Perejil fresco','ingrediente','Ingrediente',NULL,'Perejil liso manojo','Despensa de Don Juan','Gramos',0.0184,1.10619469,0.01843658),
  ('Orégano','ingrediente','Ingrediente','McCormick','Bote de 141 gramos','Pricesmart','Gramos',0.0363,5.12389381,0.03633967),
  ('Vinagre blanco','ingrediente','Ingrediente','Soreli','Bote Vinagre Puro Soreli 3650 ml','Super Selectos','Mililitro',0.0007,2.63716814,0.00072251),
  ('Ají triturado','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Quinoa cocida','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Chile Morron','ingrediente','Ingrediente',NULL,'Por Libra','Super Selectos','Gramos',0.0064,2.90265487,0.00639351),
  ('Col rizada (kale)','ingrediente','Ingrediente',NULL,'Empaque con 170 gramos','Super Selectos','Gramos',0.0177,3.00884956,0.01769912),
  ('Pepino','ingrediente','Ingrediente',NULL,'Unidad','Super Selectos','Gramos',0.0014,0.48672566,0.00135202),
  ('Aguacate','ingrediente','Ingrediente',NULL,'Precio por libra','Super Selectos','Gramos',0.0026,1.19469027,0.00263148),
  ('Levadura nutricional','ingrediente','Ingrediente','Bragg','Bote de 127 gramos','Super Selectos','Gramos',0.0668,8.48672566,0.06682461),
  ('Masa de maíz nixtamalizado','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Garam Masala','ingrediente','Ingrediente',NULL,'Bote de vidrio','Yek Tunal','Gramos',0.0737,4.42477876,0.07374631),
  ('Comino molido','ingrediente','Ingrediente','Badia','Bote de 23 gramos','Super Selectos','Gramos',0.0604,1.38938053,0.06040785),
  ('Hierbas italianas','ingrediente','Ingrediente','McCormick','Bote de 18 gramos','Super Selectos','Gramos',0.1205,2.16814159,0.12045231),
  ('Albahaca','ingrediente','Ingrediente','Selectos','Medio manojo','Super Selectos','Gramos',0.0081,0.81415929,0.00814159),
  ('Curry pasta','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Zanahoria','ingrediente','Ingrediente',NULL,'Zanahoria por libra','Super Selectos','Gramos',0.0013,0.57522124,0.00126701),
  ('Brócoli','ingrediente','Ingrediente','San Cristobal','454 g','Super Selectos','Gramos',NULL,1.68141593,NULL),
  ('Pimiento','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Tahini','ingrediente','Ingrediente','Ziyad','Bote de 454 gramos','Super Selectos','Gramos',0.0263,11.94690265,0.02631476),
  ('Limón (jugo)','ingrediente','Ingrediente','Subreceta','1 litro de jugo de limón exprimido',NULL,'Gramos',0.0011,1.0619469,0.00106195),
  ('Pasta de tomate','ingrediente','Ingrediente','Hunts','12 latas de 170gms c/u','Pricesmart','Gramos',0.0052,10.61061947,0.00520128),
  ('Zucchini','ingrediente','Ingrediente',NULL,'Por Libra','Super Slectos','Gramos',0.0028,1.2920354,0.00284589),
  ('Apio','ingrediente','Ingrediente',NULL,'Por Libra','Super Selectos','Gramos',NULL,0.69911504,NULL),
  ('Cebolla Morada','ingrediente','Ingrediente',NULL,'Por Libra','Super Selectos','Gramos',0.002,0.90265487,0.00198823),
  ('Arroz','ingrediente','Ingrediente','Alsano','Gramos','Super Selectos','Gramos',0.0017,1.54867257,0.00170559),
  ('Miso Paste','ingrediente','Ingrediente','Gochi','Bote','Super Selectos','Gramos',0.0073,2.07964602,0.007297),
  ('Paprika en polvo','ingrediente','Ingrediente','Members Selection','453 g','Super Selectos','Gramos',0.0127,5.74336283,0.01267851),
  ('Pasta de Tamarindo','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Cebollin','ingrediente','Ingrediente',NULL,'Unidad de 28 g','Super Selectos','Gramos',0.0073,1.22123894,0.00726928),
  ('Cilantro','ingrediente','Ingrediente',NULL,'Cilantro en manojo de 1 libra','Despensa de don juan','Gramos',0.0021,0.97345133,0.00214417),
  ('Mantequilla de Mani','ingrediente','Ingrediente','Members Selection','Bote Plastico de 40 Oz en gramos 1133.98','Pricesmart','Gramos',0.0044,5.03539823,0.00444046),
  ('Mani Tostado','ingrediente','Ingrediente',NULL,'Por Libra','Super Selectos','Gramos',0.0044,1.99115044,0.00438579),
  ('Brotes de Soya','ingrediente','Ingrediente','Selectos','Bolsa Plastica retoño de soya','Super Selectos','Gramos',0.0028,1.2920354,0.00284589),
  ('Aceite de sesamo','ingrediente','Ingrediente','Roland','Bote de 185 ml','Super Selectos','Mililitros',0.0299,5.53097345,0.02989715),
  ('Chile Hojuelas','ingrediente','Ingrediente','Badia','Bote de 340.2 gramos','Despensa de don juan','Gramos',0.026,8.84070796,0.0259868),
  ('Remolacha cocida bolsa','ingrediente','Ingrediente','Lupita','Bolsa de 454 gramos','Despensa de don juan','Gramos',0.0039,1.76106195,0.00387899),
  ('Berenjena','ingrediente','Ingrediente','Selectos','Unidad','Super Selectos','Unidad',0.8407,0.84070796,0.84070796),
  ('Datiles','ingrediente','Ingrediente','Mariani','Bolsa de 1.13 kgs/40 oz','Pricesmart','gramos',0.0102,11.49557522,0.01017308),
  ('Leche de avena','ingrediente','Ingrediente','Members selection','Paquete de 6 unidades 946 ml / 32oz cada una','Pricesmart','mililitro',0.0024,13.7079646,0.00241507),
  ('Baking soda','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Almendras','ingrediente','Ingrediente','Members selection','Bolsa de 907 gramos / 32 onzas','Pricesmart','Gramos',0.0117,10.61061947,0.01169859),
  ('Avena','ingrediente','Ingrediente','Selectos','AVENA MOSH SELECTOS 350G','Super selectos','Gramos',0.0025,0.88495575,0.00252845),
  ('Cacao en polvo','ingrediente','Ingrediente','Hershey''s','Cacao en Polvo Sin Azúcar 2 Unidades (226 g / 8 oz c/u)','Pricesmart','Gramos',0.0215,9.72566372,0.02151696),
  ('Harina de almendra','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Pan de masa madre','ingrediente','Ingrediente','Luma','Bolsa de pan madre entero','Luma','Unidad',4.4248,4.42477876,4.42477876),
  ('Harina de avena','ingrediente','Ingrediente','Taeq','Bolsa de 1,000 gramos',NULL,'gramos',0.0046,4.6460177,0.00464602),
  ('Lechuga','ingrediente','Ingrediente',NULL,'Cabeza de lechuga romana','Despensa de Don Juan','Unidad',0.002,0.79646018,0.00199115),
  ('Tomate','ingrediente','Ingrediente',NULL,'Tomate por libra','Despensa de Don Juan','gramos',0.0022,1.01769912,0.00224163),
  ('Rabanos','ingrediente','Ingrediente',NULL,'Manojo de rabano (8 unidades) peso x rabano 30g','Super Selectos','gramos',0.0031,0.73451327,0.00306047),
  ('Papitas','ingrediente','Ingrediente',NULL,'Precio por libra papitas naturales','Super Selectos','Gramos',0.0024,1.10619469,0.00243655),
  ('Especies italiana','ingrediente','Ingrediente','McCormick','Bote plastico de 177gramos','Pricesmart','Gramos',NULL,7.33628319,NULL),
  ('Manzana','ingrediente','Ingrediente',NULL,'Manzana roja mediana de 150 gramos','Super Selectos','Gramos',0.0025,1.15044248,0.00253401),
  ('Tofu suave (silken tofu)','ingrediente','Ingrediente','Moringa','Tofu Queso Soya Firme Morinaga 307 g','Super Selectos','Gramos',0.0082,2.52212389,0.00821539),
  ('Eneldo','ingrediente','Ingrediente','Selectos','Eneldo Fresco Selectos 21 g Bolsa','Super Selectos','Gramos',0.0948,1.99115044,0.09481669),
  ('Tomate cherry','ingrediente','Ingrediente','Zetas','Tomate Cherry Clamshell 450 g','Super Selectos','Gramos',0.0067,3.00884956,0.00668633),
  ('Repollo morado','ingrediente','Ingrediente',NULL,'Aproximadamente 2 libras por unidad','Super Selectos','Gramos',0.0032,2.90265487,0.00319676),
  ('Mostaza','ingrediente','Ingrediente','Dany','Mostaza Dany bolsa de 880 gramos','Super Selectos','Gramos',0.0012,1.0619469,0.00120676),
  ('Pimenton ahumado','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Canela molida','ingrediente','Ingrediente','Badia','Bote de 454 gramos / 16onzas','Pricesmart','Gramos',0.0123,5.56637168,0.01226073),
  ('Curcuma','ingrediente','Ingrediente',NULL,'Curcuma lb/454 g','Super Selectos','Gramos',0.0079,3.5840708,0.00789443),
  ('Clavo de olor molido','ingrediente','Ingrediente','Mccormick','Bote de 25 gramos','Super Selectos','Gramos',0.0874,2.18584071,0.08743363),
  ('Cebolla dulce','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Tomates deshidratados','ingrediente','Ingrediente','Bella Sun Luci','Bella Sun Luci Tomates Deshidratados 907 g / 32 oz','Pricesamrt','Gramos',0.0146,13.26548673,0.01462567),
  ('Sumac','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Vinagre de vino tinto','ingrediente','Ingrediente','Borges','Vinagre Vino Jerez Borges 250 ml','Super Selectos','Mililitros',0.0094,2.34513274,0.00938053),
  ('Aceite de chile','ingrediente','Ingrediente',NULL,'HUY FONG SAMBAL OELEK(S) 8OZ (03385C)','Oriental Market','Gramos',0.0196,4.42,0.01955752),
  ('Azucar vegana','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Pan artesanal (baguette)','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Lechuga mantequilla','ingrediente','Ingrediente',NULL,'Caja de 150 gramos','Super Selectos','Gramos',0.0168,2.51327434,0.01675516),
  ('Blueberry (arandanos)','ingrediente','Ingrediente',NULL,'Caja plastica con arándanos frescos','Pricesmart','Gramos',0.0234,5.30088496,0.02335192),
  ('Semillas de chia','ingrediente','Ingrediente','Badia','Badia Semillas De Chia Bolsa 42.5 g','Despensa de Don Juna','Gramos',0.026,1.10619469,0.02602811),
  ('Leche de soya','ingrediente','Ingrediente','Silk Soya','Bebida Silk Soya Sin Azucar 946 Ml','Despensa de Don Juna','Mililitros',0.0025,2.38053097,0.00251642),
  ('Hielo en bolsa','ingrediente','Ingrediente','Dany','Hielo en Bolsa de 5 libras','Super Selectos','Gramos',0.0004,1.01769912,0.00044833),
  ('Te Verde','ingrediente','Ingrediente','Mondaisa','Té Verde Mondaisa 40g 20uni (2 gms x sobre)','Super Selectos','Gramos',0.0558,2.2300885,0.05575221),
  ('Piña','ingrediente','Ingrediente',NULL,'PIÑA SWEET BABY UN LA CARRETA','Super Selectos','Gramos',0.0064,2.86725664,0.00637168),
  ('Sinbo dry mushroom (hongos deshidratados)','ingrediente','Ingrediente',NULL,'2.5 onzas (70 gramos)','Mercado Oriental','Gramos',0.0894,6.25663717,0.08938053),
  ('Assi Dried kelp (alga deshidratada)','ingrediente','Ingrediente',NULL,'2 onzas (56 gramos)','Mercado Oriental','Gramos',0.0558,3.12389381,0.05578382),
  ('HANA UDON NOODLES (HOSHI MARU)','ingrediente','Ingrediente',NULL,'3 libras (10 paquetitos)','Mercado Oriental','Gramos',0.0075,10.17699115,0.00748859),
  ('SHIQUAN MISO ORIGINAL','ingrediente','Ingrediente',NULL,'Bote de 500 gramos','Mercado Oriental','Gramos',0.0078,3.91150442,0.00782301),
  ('Espagueti integral','ingrediente','Ingrediente','La Moderna','Bolsa de 200 gramos','Superselectos','Gramos',0.0029,0.5840708,0.00292035),
  ('Chile en polvo','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Proteina de soya','ingrediente','Ingrediente','Promax','Bolsa de 454 gramos','Superselectos','Gramos',0.0077,3.51327434,0.00773849),
  ('Mostaza Dijon Fuerte Roland 198 g','ingrediente','Ingrediente','Roland','Bote de 198 g','Super Selectos','Gramos',0.0185,3.67256637,0.01854832),
  ('Miel de maple','ingrediente','Ingrediente','Members selection','Bote de 500 ml','Pricesmart','Gramos',0.0177,8.84070796,0.01768142),
  ('Sasonador Completo','ingrediente','Ingrediente','Sasson Intercampo','Bote de 500 gramos','Pricesmart','Gramos',0.0079,3.97345133,0.0079469),
  ('Sambaoleck','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Aceite de Soya','ingrediente','Ingrediente','Members selection','Bote de 5 litros o 5000 ml','Pricesmart','Gramos',0.0028,13.08849558,0.00284533),
  ('Quinoa','ingrediente','Ingrediente',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Tofu Limon','subreceta','Subreceta',NULL,NULL,NULL,'Porción',1.0,NULL,1.0),
  ('Tofu Mostaza','subreceta','Subreceta',NULL,NULL,NULL,'Porción',5.3875,NULL,5.38745525),
  ('Arroz cocinado','subreceta','Subreceta',NULL,NULL,NULL,'Porción',0.1851,NULL,0.18508605),
  ('Hummus de zanahoria','subreceta','Subreceta',NULL,NULL,NULL,'Porción',0.3856,NULL,0.38560801),
  ('Hummus tomates deshidratados','subreceta','Subreceta',NULL,NULL,NULL,'Porción',0.3502,NULL,0.35018507),
  ('Dreesing Green Hulk','subreceta','Subreceta',NULL,NULL,NULL,'Porción',0.6197,NULL,0.61971242),
  ('Dressing Mediterraneo Krauter','subreceta','Subreceta',NULL,NULL,NULL,'Porción',0.2324,NULL,0.23242885)
AS x
ON DUPLICATE KEY UPDATE
  `tipo`=x.`tipo`, `brand`=COALESCE(x.`brand`,`ingredients`.`brand`),
  `presentation`=COALESCE(x.`presentation`,`ingredients`.`presentation`),
  `supplier`=COALESCE(`ingredients`.`supplier`,x.`supplier`),
  `unit`=COALESCE(`ingredients`.`unit`,x.`unit`),
  `purchase_price_no_iva`=COALESCE(x.`purchase_price_no_iva`,`ingredients`.`purchase_price_no_iva`),
  `unit_cost`=x.`unit_cost`;

-- ----------------------------------------------------------------------------
-- PASO 5 — Poblar `empaques` (UPSERT por name).
-- ----------------------------------------------------------------------------
INSERT INTO `empaques`
  (`name`,`brand`,`supplier`,`presentation`,`unit`,`units_per_pack`,`purchase_price_no_iva`,`unit_cost`)
VALUES
  ('ENVASE PAPEL KRAFT 16 OZ S/T 24 UN BIO FORM 2864014000',NULL,'Tienda Morena / Empaques Carvajal','24 unidades','Unidad',1.0,3.8,0.15833333),
  ('TAPA PAPEL P/ENV 16/32 OZ 24 UN BIO FORM 2864014002',NULL,'Tienda Morena / Empaques Carvajal','24 unidades','Unidad',1.0,4.24,0.17666667),
  ('ENVASE PAPEL KRAFT 32 OZ S/T 24 UN BIO FORM 2864014001',NULL,'Tienda Morena / Empaques Carvajal','24 unidades','Unidad',1.0,5.22,0.2175),
  ('Cuchara Maderita Compostable Eco','Great Value Eco','Despensa de Don Juan','30 unidades','Unidad',1.0,1.10619469,0.03687316),
  ('Palillo de Bambú Refin Desech Fu Mau',NULL,'Super Selectos','36 unidades','Unidad',1.0,1.7699115,0.04916421),
  ('Bowl para Alimentos 1000 ml Kraft',NULL,'DIASA','300 unidades','Unidad',1.0,54.0,0.18),
  ('Tapa Trans. PP Bowl 500/1000 ml',NULL,'DIASA','300 unidades','Unidad',1.0,39.0,0.13),
  ('Clamshell 9x6',NULL,'DIASA','250 unidades','Unidad',1.0,62.5,0.25),
  ('Pajilla de Papel Diapack',NULL,NULL,'50 unidades','Unidad',1.0,0.75,0.015),
  ('Tenedor de maderita compostable','Temu','Temu','200 unidades','Unidad',1.0,15.61061947,0.0780531),
  ('Bolsa de papel kraft pequeña UBPKFC-8','Diasa','Diasa','250 unidades','Unidad',1.0,25.02,0.05004),
  ('Bolsa de papel kraft grande UBPKFC-20','Diasa','Diasa','250 unidades','Unidad',1.0,30.37,0.12148),
  ('Champack retro kraft 11.1 x 8.9 x 6.4 (cm)',NULL,'Diasa','10 unidades','Unidad',1.0,2.1,0.21)
AS x
ON DUPLICATE KEY UPDATE
  `brand`=COALESCE(x.`brand`,`empaques`.`brand`),
  `supplier`=COALESCE(x.`supplier`,`empaques`.`supplier`),
  `presentation`=COALESCE(x.`presentation`,`empaques`.`presentation`),
  `units_per_pack`=COALESCE(x.`units_per_pack`,`empaques`.`units_per_pack`),
  `purchase_price_no_iva`=COALESCE(x.`purchase_price_no_iva`,`empaques`.`purchase_price_no_iva`),
  `unit_cost`=x.`unit_cost`;

-- ----------------------------------------------------------------------------
-- PASO 6 — Enlazar líneas de receta con su catálogo (por nombre exacto)
-- ----------------------------------------------------------------------------
-- Ingredientes y subrecetas
UPDATE `costeo_detalle_ingredientes` d
JOIN `ingredients` i ON i.`name` = d.`nombre_ingrediente`
SET d.`ingredient_id` = i.`id`
WHERE d.`tipo` IN ('principal','secundario');

-- Empaques
UPDATE `costeo_detalle_ingredientes` d
JOIN `empaques` e ON e.`name` = d.`nombre_ingrediente`
SET d.`empaque_id` = e.`id`
WHERE d.`tipo` = 'empaque';

-- Diagnóstico: líneas sin enlazar (revisar nombres)
-- SELECT tipo, nombre_ingrediente FROM costeo_detalle_ingredientes
--   WHERE ingredient_id IS NULL AND empaque_id IS NULL;

-- ----------------------------------------------------------------------------
-- PASO 7 — Vista de apoyo: costeo con costo VIVO de ambos catálogos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_costeo_ingredientes` AS
SELECT
  d.`id`, d.`costeo_platillo_id`, d.`tipo`,
  d.`ingredient_id`, d.`empaque_id`, d.`nombre_ingrediente`,
  d.`cantidad`, d.`unidad_medida`, d.`porcentaje_merma`,
  d.`precio_unitario`                              AS precio_unitario_snapshot,
  COALESCE(i.`unit_cost`, e.`unit_cost`)           AS precio_unitario_actual,
  d.`costo_ingrediente`                            AS costo_snapshot,
  ROUND(d.`cantidad` * COALESCE(i.`unit_cost`, e.`unit_cost`), 4) AS costo_actual
FROM `costeo_detalle_ingredientes` d
LEFT JOIN `ingredients` i ON i.`id` = d.`ingredient_id`
LEFT JOIN `empaques`    e ON e.`id` = d.`empaque_id`;

COMMIT;

-- ============================================================================
-- Resumen: ingredients += 128 (incl. 7 subrecetas)  |  empaques += 13
-- ============================================================================