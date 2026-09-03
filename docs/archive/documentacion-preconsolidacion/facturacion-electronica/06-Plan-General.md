# 06 — Plan General de Integración DTE

> Este plan es orientativo. Las fases y prioridades deben validarse con el equipo antes de comenzar.
> No implica compromiso de implementación en la fase actual (análisis/documentación).

---

## Principios

1. **No romper lo que funciona.** Cada fase es aditiva. No se modifica lógica existente.
2. **Backend PHP, mismo patrón.** Nuevos archivos PHP siguiendo el patrón de `ingredients.php`.
3. **Frontend React, misma estructura.** Nuevas páginas/componentes, no modificar los existentes.
4. **Primero datos, luego UI.** La DB y el backend deben estar sólidos antes de construir la pantalla.
5. **Pruebas primero en ambiente `00` (modo prueba) del MH.**

---

## Fase 1 — Fundación de datos (sin UI visible)

**Objetivo:** Crear la infraestructura de DB y PHP que soportará el DTE.

### 1.1 Tabla `dte_emisor`

```sql
CREATE TABLE dte_emisor (
  id           INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nit          VARCHAR(17) NOT NULL,
  nrc          VARCHAR(8),
  nombre       VARCHAR(250) NOT NULL,
  nombre_comercial VARCHAR(150),
  cod_actividad VARCHAR(6),   -- CAT-019
  desc_actividad VARCHAR(150),
  tipo_establecimiento CHAR(2), -- CAT-009
  cod_establecimiento  VARCHAR(4),
  cod_punto_venta      VARCHAR(4),
  direccion_departamento CHAR(2),   -- CAT-012
  direccion_municipio   CHAR(2),    -- CAT-013
  direccion_complemento VARCHAR(200),
  telefono     VARCHAR(30),
  email        VARCHAR(100),
  ambiente     CHAR(2) NOT NULL DEFAULT '00',  -- CAT-001
  activo       TINYINT(1) DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Tabla `ventas` (cabecera de ticket)

```sql
CREATE TABLE ventas (
  id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  numero_ticket   INT UNSIGNED NOT NULL,
  fecha           DATE NOT NULL,
  hora            TIME NOT NULL,
  user_id         INT UNSIGNED,           -- cajero
  mesa_id         INT UNSIGNED,           -- referencia a mesas (si existe)
  condicion_pago  TINYINT DEFAULT 1,      -- CAT-016: 1=Contado
  forma_pago      CHAR(2) DEFAULT '01',   -- CAT-017: 01=Efectivo
  subtotal_sin_iva DECIMAL(10,2),
  iva             DECIMAL(10,2),
  total_con_iva   DECIMAL(10,2),
  tipo_receptor   ENUM('consumidor','ccf') DEFAULT 'consumidor',
  receptor_nit    VARCHAR(17),
  receptor_nrc    VARCHAR(8),
  receptor_nombre VARCHAR(250),
  receptor_email  VARCHAR(100),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 Tabla `venta_detalle`

```sql
CREATE TABLE venta_detalle (
  id           INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  venta_id     INT UNSIGNED NOT NULL,
  menu_id      INT UNSIGNED,
  descripcion  VARCHAR(200) NOT NULL,
  cantidad     DECIMAL(8,2) NOT NULL DEFAULT 1,
  precio_unitario_sin_iva DECIMAL(10,4) NOT NULL,
  monto_iva    DECIMAL(10,4) NOT NULL,
  precio_con_iva DECIMAL(10,4) NOT NULL,
  tipo_item    TINYINT DEFAULT 1,         -- CAT-011: 1=Bienes
  unidad_medida CHAR(2) DEFAULT '59',     -- CAT-014: 59=Unidad
  FOREIGN KEY (venta_id) REFERENCES ventas(id)
);
```

### 1.4 Tabla `dte_documentos`

```sql
CREATE TABLE dte_documentos (
  id                  INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  venta_id            INT UNSIGNED,
  tipo_dte            CHAR(2) NOT NULL,   -- CAT-002: 01=Factura, 03=CCF
  ambiente            CHAR(2) NOT NULL,   -- CAT-001
  modelo_facturacion  TINYINT DEFAULT 1,  -- CAT-003
  tipo_transmision    TINYINT DEFAULT 1,  -- CAT-004
  codigo_generacion   CHAR(36) NOT NULL,  -- UUID v4
  numero_control      VARCHAR(31) NOT NULL,
  fec_emi             DATE NOT NULL,
  hor_emi             TIME NOT NULL,
  json_sin_firma      LONGTEXT,
  json_firmado        LONGTEXT,
  sello_recibido      VARCHAR(100),
  estado              ENUM('borrador','firmado','transmitido','aceptado','rechazado','anulado')
                      DEFAULT 'borrador',
  respuesta_mh        TEXT,              -- JSON de respuesta del MH
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_codigo_gen (codigo_generacion),
  UNIQUE KEY uq_num_control (numero_control),
  FOREIGN KEY (venta_id) REFERENCES ventas(id)
);
```

### 1.5 Tabla `dte_correlativos`

```sql
CREATE TABLE dte_correlativos (
  id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tipo_dte        CHAR(2) NOT NULL,
  cod_establecimiento VARCHAR(4),
  cod_punto_venta VARCHAR(4),
  ultimo_correlativo INT UNSIGNED DEFAULT 0,
  UNIQUE KEY uq_tipo_pv (tipo_dte, cod_establecimiento, cod_punto_venta)
);
```

---

## Fase 2 — Configuración del Emisor (UI en Settings)

**Objetivo:** Que el administrador pueda configurar los datos fiscales del emisor desde la app.

- Extender `Settings.tsx` para agregar un grupo "Facturación Electrónica DTE"
- Nuevo endpoint PHP: `dte_emisor.php` (GET / PUT)
- Formulario con todos los campos de `dte_emisor`
- Selects con catálogos del MH (departamento, municipio, tipo establecimiento)

---

## Fase 3 — Flujo de Venta Real (backend PHP)

**Objetivo:** Crear el ciclo de vida de una venta en DB.

- Nuevo `ventas.php` — POST para crear venta + detalle
- Nuevo `venta_detalle.php` o incluido en `ventas.php`
- Integrar precios sin IVA: `menu.price / 1.13` hasta que se agregue columna `price_no_iva`
- Conectar módulo Pedidos con backend real (actualmente datos hardcodeados)

---

## Fase 4 — Generación del JSON del DTE

**Objetivo:** Construir el JSON del DTE conforme al esquema del MH.

- Nuevo `dte_generar.php` — genera el JSON según tipo de documento
- Estructura conforme al Manual Técnico del MH v2.1:
  - `identificacion`: tipo, ambiente, modelo, transmisión, código de generación, número de control, fecha, hora
  - `emisor`: datos de `dte_emisor`
  - `receptor`: datos del receptor de la venta
  - `cuerpoDocumento`: ítems de `venta_detalle`
  - `resumen`: totales, IVA, forma de pago
- Generar UUID v4 para `codigoGeneracion`
- Calcular y asignar `numeroControl`

---

## Fase 5 — Firma del DTE (integración con Firmador)

**Objetivo:** Enviar el JSON al Firmador Docker y recibir el JSON firmado.

**Prerrequisito:** Definir arquitectura de acceso al Firmador desde Hostinger.

- Nuevo `dte_firmar.php` — hace POST al Firmador con el JSON
- Endpoint Firmador: `POST http://<firmador>/firmardocumento/`
- Body: `{ "nit": "...", "activo": true, "passwordPri": "...", "dteJson": "{...}" }`
- Guardar JSON firmado en `dte_documentos.json_firmado`

---

## Fase 6 — Transmisión al MH

**Objetivo:** Enviar el DTE firmado al API del Ministerio de Hacienda.

- Nuevo `dte_transmitir.php` — hace POST al endpoint del MH
- Ambiente prueba: URL del MH (PENDIENTE DE CONFIRMAR desde Manual Técnico)
- Guardar `selloRecibido` y respuesta del MH
- Actualizar estado en `dte_documentos`

---

## Fase 7 — UI de Emisión en Caja

**Objetivo:** Interfaz para que el cajero emita el DTE al cobrar.

- Extender módulo Caja o crear nueva página `/facturacion`
- Flujo: seleccionar ítems → ingresar datos receptor (si aplica) → cobrar → generar DTE → mostrar
  número de control y sello → opción de imprimir / enviar por email
- Manejo de errores: Firmador no disponible, MH rechaza, contingencia

---

## Fase 8 — Reportes DTE

**Objetivo:** Visibilidad de los documentos emitidos.

- Agregar sección en Reportes: DTE emitidos, rechazados, en contingencia
- Filtros por tipo de documento, fecha, estado
- Exportación del libro de ventas a consumidor final (formato CSV/PDF)

---

## Fase 9 — Contingencia

**Objetivo:** Permitir emisión cuando el MH o el internet no están disponibles.

- Detectar falla de transmisión
- Cambiar `tipo_transmision` a `2` (contingencia) con la causal correspondiente (CAT-005)
- Cola de DTE pendientes de retransmitir
- Pantalla de estado de contingencia activa

---

## Consideraciones de seguridad

- Las credenciales del Firmador (contraseña de llave privada) **nunca** deben almacenarse en
  texto plano en la DB. Usar variables de entorno del servidor.
- El NIT y NRC del emisor son datos sensibles; acceso restringido a `role = 'admin'`.
- Los JSON de DTE firmados contienen la firma digital; tratar como documentos legales.

---

## Tipo de DTE prioritario para Zensoci

Para un restaurante con ventas a consumidor final, el documento más utilizado será:

| Tipo | Código | Cuándo |
|---|---|---|
| **Factura** | `01` | Ventas a consumidor final (la mayoría de los casos) |
| Comprobante de Crédito Fiscal | `03` | Solo si el cliente es empresa con NRC y solicita CCF |
| Nota de Crédito | `05` | Anulaciones parciales o devoluciones |

**Se recomienda implementar Factura (01) primero.**
