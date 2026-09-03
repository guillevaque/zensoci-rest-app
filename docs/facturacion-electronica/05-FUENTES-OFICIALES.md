# 05 — Fuentes Oficiales y Pendientes de Validación

Toda la información marcada `PENDIENTE DE VALIDAR CON FUENTE OFICIAL` en esta documentación,
organizada por área. **No implementar ningún campo marcado como pendiente sin confirmar con
el Manual Técnico del MH, los catálogos oficiales, o el contador fiscal.**

---

## Sobre el Emisor (datos fiscales de Zensoci)

1. **¿Cuál es el NIT de Zensoci?**
   Requerido para todos los documentos DTE. Formato: XXXX-XXXXXX-XXX-X.

2. **¿Cuál es el NRC de Zensoci?**
   Requerido para emitir DTE como contribuyente registrado.

3. **¿Cuál es el código de Actividad Económica (CAT-019)?**
   Para un restaurante vegano posiblemente `56101` (Restaurantes) o similar.
   Confirmar con el MH o con el contador.

4. **¿Cuál es el código de Establecimiento y Punto de Venta asignado por el MH?**
   El MH asigna estos códigos al momento de inscribir el sistema.
   Formato esperado: `0001` para establecimiento y `0001` para punto de venta.

5. **¿Cuál es la dirección fiscal exacta?**
   Departamento (CAT-012), Municipio (CAT-013), y complemento de dirección.
   "Col. Escalón, San Salvador" es referencial. Se necesita código de departamento `06`
   (San Salvador) y código de municipio exacto.

6. **¿Cuál es el teléfono y correo electrónico fiscal del emisor?**

7. **¿El restaurante ya está inscrito en el sistema del MH para emitir DTE?**
   Si no, debe inscribirse antes de poder generar documentos válidos.

---

## Sobre el Firmador

8. **¿Ya se cuenta con las credenciales reales del Firmador?**
   El error `"No existe llave pública para este NIT"` confirma que el NIT de prueba no tiene
   llaves. Se necesita el archivo `.jks` o `.p12` con las llaves del NIT real de Zensoci.

9. **¿Cómo se desplegará el Firmador para que el backend en Hostinger pueda acceder a él?**
   Opciones:
   - VPS/nube propio con Docker
   - Mismo servidor Hostinger (si soporta Docker)
   - Proxy/túnel desde Hostinger hacia máquina local (no recomendado para producción)

10. **¿Cuál es la contraseña de la llave privada (`passwordPri`) para el NIT de Zensoci?**
    Esta credencial es altamente sensible. **Nunca** va en DB ni en Git.
    Solo en variable de entorno `DTE_FIRMADOR_PASSWORD` del servidor.

---

## Sobre el API del MH

11. **¿Cuál es la URL del ambiente de pruebas del API del MH?**
    El Manual Técnico v2.1 define los endpoints. Confirmar si está disponible y si Zensoci
    ya tiene acceso (usuario y contraseña para el ambiente `00`).

12. **¿Se tiene usuario y contraseña para el portal del MH (ambiente de pruebas)?**

13. **¿Cuál es el mecanismo de autenticación exacto con el API del MH?**
    Token Bearer, certificado cliente, API key, sesión — pendiente de confirmar en el
    Manual Técnico vigente.

14. **¿El MH provee endpoint de consulta de estado por `codigo_generacion`?**
    Necesario para resolver estados huérfanos en `transmitiendo`.

15. **¿Cuál es el código de respuesta del MH cuando recibe un `codigo_generacion` ya procesado?**
    Necesario para el manejo de transmisiones duplicadas.

---

## Sobre la base de datos y el servidor

16. **¿Existe tabla de usuarios en la DB? ¿Cómo se llama?**
    Se infiere su existencia pero no se encontró en el repositorio.
    Confirmar nombre exacto (`usuarios` o `users`) y columnas.

17. **¿Existe tabla de mesas en la DB?**
    `GestionMesas.tsx` existe en el frontend pero no se encontró PHP ni tabla en DB.

18. **¿La tabla `costeo_detalle_ingredientes` existe en producción?**
    O fue reemplazada completamente por el campo `costeo_platillo_id` en `ingredientes`.

19. **¿Cuál es la versión exacta de PHP en Hostinger?**
    Para confirmar que `random_bytes()` está disponible (requiere PHP 7.0+).

20. **¿Cuál es la versión exacta de MySQL en Hostinger?**
    Para confirmar soporte de `DECIMAL`, `SELECT ... FOR UPDATE`, etc.

21. **¿El plan de Hostinger permite extensiones PHP adicionales?**
    Necesario si se usa `justinrainbow/json-schema` para validación del JSON Schema.

---

## Sobre catálogos del MH (todos PENDIENTE DE VALIDAR)

| Catálogo | Campo en duda | Referencia |
|---|---|---|
| CAT-011 Tipo de ítem | ¿Los platillos de Zensoci son Bienes (1) o Servicios (2)? | JSON Schema tipo 01 + contador |
| CAT-014 Unidad de medida | ¿Todos los ítems se venden por Unidad (59)? | JSON Schema tipo 01 |
| CAT-015 Tributos | ¿IVA 13% = código 20 en El Salvador? | Catálogo CAT-015 oficial |
| CAT-016 Condición operación | ¿Contado = código 1? | Catálogo CAT-016 oficial |
| CAT-017 Forma de pago | Código exacto para PedidosYa y cada forma de pago | Catálogo CAT-017 oficial |

---

## Sobre el formato del JSON del DTE (tipo 01)

| Campo | Duda específica |
|---|---|
| `version` en `identificacion` | Número de versión del esquema según Manual Técnico vigente |
| `tipoModelo` | ¿Previo = 1? Confirmar en CAT-003 |
| `tipoOperacion` | ¿Normal = 1? Confirmar en CAT-004 |
| `tipoMoneda` | ¿`"USD"` es el valor correcto? |
| Campo `receptor` consumidor final | Valores exactos (null, `""`, omitir) según JSON Schema tipo 01 |
| `codigo` en `cuerpoDocumento` | ¿Es requerido u opcional? |
| `ivaItem` en `cuerpoDocumento` | ¿Va en el cuerpo o solo en `resumen`? |
| Formato de `tributos` en `cuerpoDocumento` | Array de strings `["20"]` o array de objetos |
| `codEstableMH` vs `codEstable` | ¿Son el mismo valor o diferentes? |
| `codPuntoVentaMH` vs `codPuntoVenta` | ¿Son el mismo valor o diferentes? |
| Formato exacto de `numeroControl` | Longitud total del campo y separadores |
| Función `totalEnLetras` | Formato exacto esperado por el MH |

---

## Sobre el negocio y flujos

22. **¿Los clientes solicitan principalmente Facturas (consumidor final) o también CCF?**
    Determina qué tipo de DTE implementar primero.

23. **¿Se planea facturar delivery con alguna plataforma externa adicional a PedidosYa?**
    Puede requerir tipos de DTE adicionales.

24. **¿Cómo se maneja actualmente el cobro? ¿Hay terminal física?**
    Si los pagos ya se procesan con hardware específico, hay que alinear el flujo.

25. **¿Se requiere enviar el DTE al correo del cliente?**
    Si sí, se necesita configurar SMTP en Hostinger.

26. **¿Se imprimirán tickets físicos con el número de control del DTE?**
    Define si se necesita integración con impresoras térmicas.

27. **¿Cuál es el tratamiento fiscal de las comisiones de PedidosYa?**
    La comisión no entra en el DTE (es un costo operativo de Zensoci), pero confirmar si
    El Salvador requiere algún tratamiento fiscal específico para plataformas digitales.

---

## Sobre retención de datos

28. **¿Cuál es el período mínimo de retención de registros contables y fiscales en El Salvador?**
    Afecta la política de retención de la tabla `auditoria` y los DTEs.

---

## Sobre la deuda técnica a resolver antes del DTE

29. **¿Se puede consolidar los tres clientes HTTP del frontend?**
    `src/api/http.ts`, `src/services/http.ts` y `src/lib/api.ts` — hay duplicación.
    Para DTE conviene tener un solo cliente HTTP.

30. **¿El módulo `Pedidos.tsx` (datos hardcodeados) tiene fecha estimada para conectarse al backend?**
    La emisión del DTE depende de que haya pedidos reales en DB.

---

## Referencias externas requeridas

| Documento | Propósito |
|---|---|
| Manual Técnico para la Integración Tecnológica del Sistema de Transmisión (versión vigente) | URLs, autenticación, formato de respuestas |
| Manual Funcional del Sistema de Transmisión (versión vigente) | Reglas de negocio DTE |
| JSON Schema oficial del MH para tipo de DTE 01 (Factura) | Estructura exacta del JSON |
| Catálogos Facturación Electrónica (versión vigente) | Todos los códigos CAT-001 a CAT-019+ |
| Ley de Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (IVA) | Tasa y reglas del IVA |
| Ley tributaria de El Salvador vigente | Período de retención de registros fiscales |
