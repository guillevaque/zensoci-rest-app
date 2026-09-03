# 15 — Plan de Implementación del MVP

Este documento divide la implementación del MVP en incrementos (M0–M14) ordenados por dependencia.
Cada incremento es una unidad entregable y testeable de forma independiente.

---

## M0 — Validar documentación oficial del MH

**Objetivo:** Antes de escribir una sola línea de código, confirmar todos los datos fiscales
que afectan el formato del JSON del DTE.

**Archivos involucrados:** Ninguno en el repositorio (lectura de fuentes externas)

**Tareas:**
1. Leer el Manual Técnico del MH versión vigente
2. Leer el Manual Funcional del MH versión vigente
3. Descargar y revisar los JSON Schemas oficiales del MH para tipo de DTE 01 (Factura)
4. Revisar el Catálogo PDF y el Excel del MH
5. Confirmar o corregir todos los items marcados `PENDIENTE DE VALIDAR CON FUENTE OFICIAL`
   en los documentos 08, 09, 10, 11 y 12

**Pendientes específicos a resolver:**

| Pendiente | Documento de referencia |
|---|---|
| Versión del JSON Schema (`version` en identificacion) | Manual Técnico del MH |
| Formato exacto del campo receptor para consumidor final | JSON Schema tipo 01 |
| Si `codigo` del cuerpoDocumento es requerido u opcional | JSON Schema tipo 01 |
| Si `ivaItem` va en cuerpoDocumento o solo en resumen | JSON Schema tipo 01 |
| Formato de `tributos` en cuerpoDocumento | JSON Schema tipo 01 |
| Diferencia entre `codEstableMH` y `codEstable` en emisor | Manual Técnico / JSON Schema |
| Formato exacto del número de control | Manual Técnico del MH |
| URL del API del MH en ambiente de pruebas | Manual Técnico del MH |
| URL del API del MH en producción | Manual Técnico del MH |
| Mecanismo de autenticación con el API del MH | Manual Técnico del MH |
| Código de respuesta del MH para documento ya procesado (duplicado) | Manual Técnico del MH |
| Código de forma de pago (CAT-017) para PLATAFORMA_EXTERNA | Catálogo CAT-017 |
| Tratamiento fiscal de comisiones de plataformas digitales | Ley tributaria / contador |

**Dependencias:** Ninguna

**Riesgos:**
- El Manual Técnico puede estar en versión que difiere del esquema real en producción
- Algunos parámetros pueden requerir consulta directa al MH o al contador fiscal

**Criterio de aceptación:** Todos los pendientes marcados en los documentos de arquitectura
tienen una respuesta documentada con la fuente oficial.

---

## M1 — Confirmar esquema actual de MySQL en Hostinger

**Objetivo:** Antes de diseñar las nuevas tablas, confirmar el estado real de la DB en producción.

**Archivos involucrados:** Ninguno en el repositorio (consulta directa a Hostinger)

**Tareas:**
1. Conectar a Hostinger y ejecutar `SHOW TABLES`
2. Para cada tabla existente, ejecutar `DESCRIBE tabla`
3. Confirmar:
   - Nombre exacto y columnas de la tabla de usuarios
   - Si existe tabla `mesas` o solo está en el frontend
   - Si `costeo_detalle_ingredientes` existe o fue reemplazada por `costeo_platillo_id`
   - Versión de MySQL (para confirmar soporte de `DECIMAL`, `FOR UPDATE`, etc.)
   - Versión de PHP (para confirmar `random_bytes()` disponible)
4. Actualizar el doc `03-Analisis-Base-Datos.md` con la información real

**Dependencias:** Acceso a Hostinger y a la DB

**Criterio de aceptación:** Lista completa y actualizada de tablas y columnas en producción.

---

## M2 — Diseño SQL de las nuevas tablas

**Objetivo:** Redactar las sentencias SQL exactas para crear todas las tablas nuevas,
basándose en M0 y M1.

**Archivos a crear:**
- `migrations/02_omnicanal_base.sql` — mesas, clientes, direcciones_entrega, pedidos, pedido_items
- `migrations/03_ventas.sql` — ventas, venta_items, pagos
- `migrations/04_dte.sql` — configuracion_fiscal, dte_documentos, dte_intentos, dte_eventos_estado, dte_correlativos
- `migrations/05_auditoria.sql` — auditoria
- `migrations/06_menu_precio_sin_iva.sql` — ALTER TABLE menu ADD COLUMN precio_sin_iva

**Notas sobre el diseño SQL:**
- Usar `DECIMAL` para todos los montos monetarios; nunca `FLOAT` ni `DOUBLE`
- Todas las tablas con `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- Las tablas de auditoría e historial sin `CASCADE DELETE` en las FK
- Índices en columnas de búsqueda frecuente

**Dependencias:** M0 (para tipos de datos exactos del DTE), M1 (para saber qué ya existe)

**Criterio de aceptación:** Los scripts SQL pueden ejecutarse en un entorno de prueba local
sin errores y con las restricciones UNIQUE e índices correctos.

---

## M3 — Pedido omnicanal (backend PHP)

**Objetivo:** Crear el backend PHP que permite registrar pedidos de cualquier canal.
Primera pieza del flujo operativo.

**Archivos a crear:**
- `api/pedidos/pedidos.php` — GET lista, GET detalle, POST crear, PUT estado
- `api/pedidos/pedido_items.php` — POST agregar ítem, PUT modificar, DELETE cancelar
- `api/pedidos/pedidos_helpers.php` — validaciones por canal, idempotencia

**Dependencias:** M2 (tablas existentes en DB), MOD-01 Seguridad (auth.php existente)

**Riesgos:**
- La lógica de idempotencia por canal es la parte más compleja de este módulo
- El manejo de la mesa (FOR UPDATE) requiere que la tabla `mesas` exista y tenga datos

**Pruebas:**
- POST con canal PLATAFORMA_EXTERNA y misma referencia externa → segundo POST devuelve el existente
- POST con canal MESA y mesa ocupada → error claro
- POST con canal DELIVERY_PROPIO sin cliente_id → error de validación

**Criterio de aceptación:** Un pedido de PedidosYa puede registrarse desde la interfaz y
persiste en la DB con todos los ítems y snapshots de precio.

---

## M4 — Venta y Pagos (backend PHP)

**Objetivo:** Crear el módulo que convierte un pedido en una venta fiscal inmutable.

**Archivos a crear:**
- `api/ventas/ventas.php` — POST crear, GET lista, GET detalle, PUT anular
- `api/ventas/ventas_helpers.php` — construcción del snapshot fiscal, cálculo precio_sin_iva
- `api/pagos/pagos.php` — POST registrar, GET por venta

**Dependencias:** M3 (pedidos existentes), M2 (tablas ventas, venta_items, pagos)

**Riesgos:**
- El cálculo `precio_sin_iva = precio_con_iva / 1.13` introduce error de redondeo
  (ver si menu ya tiene precio_sin_iva en M2)
- La transacción atómica (venta + items + pagos) debe hacer rollback completo si falla

**Pruebas:**
- POST cobrar pedido → crea venta con numero_ticket correcto
- POST cobrar el mismo pedido dos veces → segundo POST devuelve la venta existente
- Suma de pagos < total → error de validación
- Suma de pagos > total → error de validación

**Criterio de aceptación:** Una venta registrada tiene su snapshot de precio sin IVA correcto
y la suma de pagos iguala exactamente el total.

---

## M5 — Configuración fiscal (backend + UI básica)

**Objetivo:** El administrador puede ingresar los datos del emisor DTE desde la app.

**Archivos a crear:**
- `api/configuracion/config_fiscal.php` — GET, PUT
- Extender `src/pages/Settings.tsx` con sección "Facturación Electrónica" (o nueva página)

**Datos requeridos en la UI:**
NIT, NRC, nombre, nombre comercial, código actividad, tipo establecimiento,
código establecimiento, código punto de venta, departamento, municipio, dirección,
teléfono, email, ambiente (prueba/producción)

**Dependencias:** M2 (tabla configuracion_fiscal), M0 (catálogos CAT-012, CAT-013, CAT-009, CAT-019)

**Riesgos:**
- Los selects de departamento y municipio necesitan los catálogos del MH completos
- El campo ambiente (prueba/producción) debe tener advertencia visible cuando se cambia a producción

**Criterio de aceptación:** El administrador puede guardar los datos fiscales y la pantalla
los muestra correctamente al recargar.

---

## M6 — Builder de Factura 01 (dte_builder.php)

**Objetivo:** Construir el JSON del DTE conforme al esquema oficial del MH para tipo 01.

**Archivos a crear:**
- `api/dte/dte_builder.php` — función `buildFactura01(venta_id)` que retorna el JSON
- `api/dte/dte_helpers.php` — función `totalEnLetras(monto)`, `generarUuidV4()`
- `api/dte/dte_correlativos.php` — función `siguienteCorrelativo(tipo, cod_est, cod_pv)`

**Dependencias:** M4 (ventas y venta_items existentes), M5 (config_fiscal disponible), M0 (formato exacto del JSON)

**Riesgos:**
- Cualquier campo mal formateado (decimales, longitud) causa rechazo inmediato del MH
- La función `totalEnLetras()` en español con USD es compleja para montos con centavos

**Pruebas:**
- Generar JSON para una venta de prueba y comparar campo por campo contra el JSON Schema del MH
- Verificar que `codigo_generacion` es un UUID v4 válido
- Verificar que `numero_control` sigue el formato exacto

**Criterio de aceptación:** El JSON generado pasa la validación del JSON Schema oficial del MH
para tipo de DTE 01.

---

## M7 — Validador JSON Schema (dte_validator.php)

**Objetivo:** Validar el JSON del DTE contra el esquema oficial antes de enviarlo al Firmador.

**Archivos a crear:**
- `api/dte/dte_validator.php` — función `validarJsonSchema(json, tipo_dte)` usando
  la librería de validación disponible en PHP o validación manual

**Alternativas de implementación:**
1. PHP puro con validación manual de cada campo requerido (más simple, sin dependencias)
2. Usar `justinrainbow/json-schema` si Composer está disponible en Hostinger
3. Validar externamente antes del MVP usando la herramienta del MH

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si el MH proporciona una herramienta de
validación local de JSON Schemas.

**Dependencias:** M6, M0 (JSON Schema del MH descargado)

**Criterio de aceptación:** Un JSON válido pasa la validación; un JSON con campo faltante
o incorrecto es detectado y el DTE pasa a `error_validacion`.

---

## M8 — Integración con el Firmador Docker

**Objetivo:** PHP puede enviar el JSON al Firmador y recibir el JSON firmado.

**Archivos a crear:**
- `api/firmador/firmador_client.php` — función `firmarDTE(nit, dteJson)` via cURL

**Prerrequisito crítico:** El Firmador Docker debe ser accesible desde el servidor Hostinger.
Esto debe resolverse de infraestructura **antes** de iniciar este milestone.
Opciones (ver doc 05-Brechas-DTE.md):
1. VPS con Docker accesible públicamente (recomendado)
2. Mismo servidor Hostinger si soporta Docker
3. Proxy/túnel (no recomendado para producción)

**Secretos:** `passwordPri` se lee de `$_ENV['DTE_FIRMADOR_PASSWORD']` o `getenv()`.
**Nunca** de la base de datos ni del repositorio.

**Dependencias:** Firmador accesible, M6 (JSON para firmar)

**Riesgos:**
- Sin Firmador accesible, este milestone y todos los siguientes quedan bloqueados
- El NIT de prueba puede no tener llaves en el Firmador (error confirmado en análisis previo)

**Pruebas:**
- Enviar un JSON de prueba al Firmador → recibir JSON firmado
- Simular timeout del Firmador → función lanza excepción correctamente

**Criterio de aceptación:** El Firmador devuelve el JSON firmado correctamente para el NIT real
de Zensoci (o el NIT de prueba si el MH provee uno con llaves).

---

## M9 — Autenticación con el MH

**Objetivo:** PHP puede autenticarse con el API del MH.

**Archivos a crear:**
- `api/mh/mh_client.php` — función `autenticarMH()` y `transmitirDTE(jsonFirmado)`

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** El mecanismo de autenticación exacto del API del MH
(token Bearer, certificado cliente, API key, sesión, etc.).

**Dependencias:** M0 (URL y mecanismo de autenticación confirmados)

**Pruebas:**
- Autenticar con credenciales de prueba del MH → respuesta de autenticación correcta
- Simular credenciales incorrectas → error manejado correctamente

**Criterio de aceptación:** PHP puede autenticarse con el API del MH en ambiente de pruebas.

---

## M10 — Transmisión al MH

**Objetivo:** PHP puede enviar un DTE firmado al MH y recibir el sello.

**Archivos a modif/crear:**
- `api/mh/mh_client.php` (ampliar) — parseo de respuesta, manejo de cada código de respuesta

**Dependencias:** M8 (DTE firmado), M9 (autenticación)

**Pruebas:**
- Transmitir DTE válido → MH devuelve `selloRecibido` → guardado en DB
- Transmitir DTE inválido → MH devuelve rechazo → estado `rechazado`, error registrado
- Simular timeout del MH → estado `error_temporal`

**Criterio de aceptación:**
- Un DTE de tipo 01 en ambiente de pruebas es aceptado por el MH
- El sello queda guardado en `dte_documentos.sello_mh`
- El estado del DTE es `aceptado`

---

## M11 — Historial y reintentos

**Objetivo:** El operador puede ver todos los DTEs con su estado y reintentar los fallidos.

**Archivos a crear:**
- `api/dte/dte.php` — GET lista de DTEs con filtros, GET detalle, POST reintentar
- Extender la interfaz React con una pantalla de historial de DTEs

**Dependencias:** M10, M4 (ventas existentes)

**Pruebas:**
- Un DTE en `error_firma` puede reintentarse desde la UI
- Un DTE en `aceptado` no tiene botón de reintento
- El historial muestra el estado correcto con timestamp

**Criterio de aceptación:** El operador puede ver todos los DTEs del día y reintentar
cualquiera que esté en estado de error.

---

## M12 — Representación gráfica del DTE

**Objetivo:** El operador puede ver y compartir los datos del DTE de forma legible.

**Archivos a crear:**
- Pantalla en React que muestra: número de control, código de generación, sello, fecha, monto

**Nota:** El PDF oficial del DTE requiere generación en el servidor (librería PHP para PDF).
Para el MVP, una representación en pantalla es suficiente. El PDF se implementa en una fase posterior.

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Si el MH tiene requisitos específicos sobre
la representación gráfica del DTE (campos obligatorios, QR de verificación, etc.).

**Criterio de aceptación:** El operador puede mostrar al cliente el número de control y
el sello en pantalla inmediatamente después del cobro.

---

## M13 — Mesas y flujo presencial

**Objetivo:** El restaurante puede atender clientes en mesa con el mismo motor de Venta y DTE.

**Archivos a modif/crear:**
- `api/mesas/mesas.php` — ya diseñado en el monolito modular
- Reescribir `src/pages/GestionMesas.tsx` para consumir datos reales
- Reescribir `src/pages/Pedidos.tsx` para flujo real de pedidos

**Dependencias:** M3 (pedidos omnicanal), M10 (DTE funcionando)

**Riesgos:**
- El frontend de mesas tiene lógica hardcodeada que debe reemplazarse completamente
- El KDS (pantalla de cocina) puede necesitar polling frecuente

**Criterio de aceptación:** El mesero puede abrir una mesa, tomar un pedido, y el cajero
cobra generando un DTE usando el mismo motor que ya funciona para PedidosYa.

---

## M14 — Delivery propio

**Objetivo:** Zensoci puede gestionar pedidos con entrega propia con motorista asignado.

**Archivos a crear:**
- `api/clientes/clientes.php` — CRUD clientes y direcciones
- Pantalla React de gestión de clientes y delivery

**Dependencias:** M3 (pedidos omnicanal), M10 (DTE funcionando)

**Criterio de aceptación:** Un pedido con canal DELIVERY_PROPIO puede registrarse con
dirección de entrega, asignarse a un motorista, y generar una Venta y DTE al confirmar el cobro.

---

## Resumen de dependencias entre milestones

```
M0 → M2 (datos fiscales confirmados)
M1 → M2 (schema real conocido)
M2 → M3, M4, M5 (tablas existentes)
M3 → M4 (pedidos para crear ventas)
M4 → M6 (ventas para construir JSON)
M5 → M6 (emisor para construir JSON)
M0 → M6 (formato exacto del JSON)
M6 → M7 (JSON para validar)
M7 → M8 (JSON válido para firmar)
M8 → M10 (JSON firmado para transmitir)
M0 → M9 (autenticación del MH)
M9 → M10 (autenticación para transmitir)
M10 → M11 (DTEs en DB para historial)
M10 → M12 (DTE aceptado para mostrar)
M3 → M13 (pedidos para mesas)
M10 → M13 (DTE para cobro presencial)
M3 → M14 (pedidos para delivery)
M10 → M14 (DTE para delivery)
```

**Ruta crítica:** M0 → M2 → M3 → M4 → M6 → M7 → M8 → M10 (primer DTE emitido)

**Bloqueante externo más crítico:** La accesibilidad del Firmador Docker desde Hostinger
(prerrequisito de M8). Resolver antes de iniciar cualquier otro milestone del DTE.
