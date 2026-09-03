# 01 — MVP DTE Zensoci

Definición del Producto Mínimo Viable para la emisión de Documentos Tributarios Electrónicos
en Zensoci, enfocado en el canal activo hoy (PedidosYa) y en la apertura presencial próxima.

---

## Qué incluye el MVP

| Componente | Incluido | Descripción |
|---|---|---|
| Factura consumidor final (tipo 01) | **Sí** | El documento más frecuente para Zensoci |
| CCF (tipo 03) | **No** (Fase 2) | Se implementa cuando haya clientes empresa |
| Nota de Crédito (tipo 05) | **No** (Fase 3) | Se implementa al necesitar anular |
| Nota de Débito (tipo 06) | **No** (Fase 4) | Raro en restaurante |
| Ambiente de pruebas (00) | **Sí** | Para validar integración antes de producción |
| Ambiente de producción (01) | **Sí** | Una vez validado en pruebas |
| Historial de DTEs | **Sí** | Listar, ver estado, reintentar |
| Reimpresión | **Sí** | Ver número de control y sello desde la app |
| Envío por email | **No** (Fase 2) | Requiere SMTP configurado |
| Representación gráfica PDF | **No** (Fase 2) | El número de control en pantalla es suficiente para el MVP |
| Contingencia | **No** (Fase 3) | Se implementa en la siguiente fase |

---

## Canal inicial del MVP

**PLATAFORMA_EXTERNA (PedidosYa)** es el canal del MVP porque:
- Ya está operando
- No requiere mesas, cocina ni POS físico
- El flujo es simple: pedido recibido → ítems preparados → venta registrada → DTE emitido
- Permite validar todo el stack DTE antes de abrir el restaurante físico

---

## Receptor en el MVP

Para el MVP, Zensoci emite únicamente Facturas a **consumidor final anónimo**.

El campo `receptor` del DTE tiene:

```
tipoDocumento:     null
numDocumento:      null
nombre:            "Consumidor Final"
correoElectronico: null
telefono:          null
```

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Los valores exactos del campo `receptor` para
consumidor final anónimo según el JSON Schema oficial del MH para tipo de DTE 01.

---

## Supuestos del MVP

| Supuesto | Base | Estado |
|---|---|---|
| Todos los ítems son Bienes (CAT-011: código 1) | Lógico para restaurante vegano | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| Todos los ítems se venden por Unidad (CAT-014: código 59) | Lógico para platos individuales | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| IVA aplicable: 13% (CAT-015: código 20) | Standard El Salvador | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| Condición de operación: Contado (CAT-016: código 1) | Cobro al entregar o al retirar | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| Modelo de facturación: Previo (CAT-003: código 1) | Normal para restaurante | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| Tipo de transmisión inicial: Normal (CAT-004: código 1) | Sin contingencia en el MVP | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |

---

## Datos del emisor requeridos para el MVP

Los siguientes datos deben obtenerse antes de implementar:

| Dato | Campo en DB | Cómo obtenerlo |
|---|---|---|
| NIT del restaurante | `config_fiscal.nit` | El propietario / contador |
| NRC del restaurante | `config_fiscal.nrc` | El propietario / contador |
| Código de actividad económica | `config_fiscal.cod_actividad` | Catálogo CAT-019 del MH |
| Código de establecimiento | `config_fiscal.cod_establecimiento` | MH (al inscribirse como emisor DTE) |
| Código de punto de venta | `config_fiscal.cod_punto_venta` | MH (al inscribirse) |
| Departamento (CAT-012) | `config_fiscal.dir_departamento` | Catálogo CAT-012 del MH |
| Municipio (CAT-013) | `config_fiscal.dir_municipio` | Catálogo CAT-013 del MH |
| Dirección fiscal complemento | `config_fiscal.dir_complemento` | El propietario |
| Teléfono | `config_fiscal.telefono` | El propietario |
| Email fiscal | `config_fiscal.email` | El propietario |
| Credenciales del Firmador (llave privada) | Variable de entorno del servidor | MH / archivo .jks del NIT real |
| URL del API del MH (pruebas) | Constante en `mh_client.php` | Manual Técnico del MH vigente |
| URL del API del MH (producción) | Constante en `mh_client.php` | Manual Técnico del MH vigente |

---

## Criterio de éxito del MVP

1. Se emite una Factura en ambiente de pruebas (00) y el MH devuelve `selloRecibido`
2. El DTE se guarda en DB con estado `aceptado` y el sello almacenado
3. El cajero/operador puede ver el número de control en la pantalla de la app
4. El historial de DTEs muestra los últimos documentos con su estado
5. Si el MH rechaza, el DTE queda en estado `rechazado` con el error registrado
6. Si el Firmador falla, el DTE queda en `error_firma` y puede reintentarse
7. Un DTE no puede emitirse dos veces para la misma venta (idempotencia)

---

## Lo que no es el MVP

- No es el sistema completo de mesas, cocina y POS (eso es Etapa 2)
- No incluye reportes avanzados
- No incluye envío automático por email al cliente
- No incluye generación de PDF del DTE
- No incluye contingencia automática
- No reemplaza el sistema manual actual de PedidosYa

El MVP agrega el DTE al proceso existente. No cambia el proceso.
