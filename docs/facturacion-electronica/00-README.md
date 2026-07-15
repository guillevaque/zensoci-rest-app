# Facturación Electrónica DTE — Índice

Documentación específica del módulo de Facturación Electrónica (DTE) de El Salvador
para el ERP Zensoci. El DTE es un módulo dentro del sistema, no un sistema separado.

---

## Documentos

| Archivo | Contenido |
|---|---|
| [01-MVP-DTE-ZENSOCI.md](./01-MVP-DTE-ZENSOCI.md) | Alcance del MVP, supuestos, datos del emisor requeridos |
| [02-FLUJO-TECNICO-DTE.md](./02-FLUJO-TECNICO-DTE.md) | Flujo técnico paso a paso, construcción del JSON, respuestas |
| [03-MODELO-DATOS-DTE.md](./03-MODELO-DATOS-DTE.md) | Entidades, campos, relaciones y diagrama ER |
| [04-ESTADOS-IDEMPOTENCIA-REINTENTOS.md](./04-ESTADOS-IDEMPOTENCIA-REINTENTOS.md) | Máquina de estados, idempotencia por nivel, reintentos |
| [05-FUENTES-OFICIALES.md](./05-FUENTES-OFICIALES.md) | Pendientes fiscales y técnicos a validar con fuente oficial |
| [06-PLAN-IMPLEMENTACION.md](./06-PLAN-IMPLEMENTACION.md) | Milestones M0-M14, roadmap de apertura en 3 etapas |

---

## Bloqueante de infraestructura crítico

El Firmador Docker (`svfe/svfe-api-firmador:v20260316`) solo está accesible en `localhost:8113`
de la máquina del desarrollador. El backend PHP en Hostinger **no puede acceder a él**.

Esta es la brecha de infraestructura más crítica. Ningún avance en implementación DTE
es posible hasta resolver el acceso del Firmador desde Hostinger.

---

## Catálogos del MH utilizados

| Catálogo | Descripción | Estado |
|---|---|---|
| CAT-001 | Ambiente (prueba/producción) | Definido |
| CAT-002 | Tipo de DTE | Definido |
| CAT-003 | Modelo de facturación | Definido |
| CAT-004 | Tipo de transmisión | Definido |
| CAT-005 | Causal de contingencia | Definido |
| CAT-009 | Tipo de establecimiento | Pendiente código exacto |
| CAT-011 | Tipo de ítem | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| CAT-012 | Departamento | Pendiente código exacto |
| CAT-013 | Municipio | Pendiente código exacto |
| CAT-014 | Unidad de medida | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| CAT-015 | Tributos (IVA 13% = código 20) | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| CAT-016 | Condición de operación | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| CAT-017 | Forma de pago | PENDIENTE DE VALIDAR CON FUENTE OFICIAL |
| CAT-019 | Actividad económica | Pendiente código exacto |

---

## Secreto crítico

`passwordPri` (contraseña de la llave privada del Firmador) **NUNCA** va en la DB ni en Git.
Solo en la variable de entorno `DTE_FIRMADOR_PASSWORD` del servidor.

---

## Referencias externas

- Manual Técnico para la Integración Tecnológica del Sistema de Transmisión v2.1 (MH El Salvador)
- Manual Funcional del Sistema de Transmisión v2.0 (MH El Salvador)
- Catálogos Facturación Electrónica v1.1 (MH El Salvador)
- Firmador oficial: imagen Docker `svfe/svfe-api-firmador:v20260316`
