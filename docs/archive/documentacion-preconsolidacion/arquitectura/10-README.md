# Arquitectura ERP — Índice

Este directorio contiene la documentación de arquitectura del ERP Zensoci.
La Facturación Electrónica (DTE) es un módulo dentro de un sistema ERP completo.

---

## Documentos

| Archivo | Contenido |
|---|---|
| [11-Flujo-Negocio-Zensoci.md](./11-Flujo-Negocio-Zensoci.md) | Análisis funcional del sistema actual + flujo de negocio propuesto |
| [12-Mapa-Entidades.md](./12-Mapa-Entidades.md) | Entidades de negocio, atributos y relaciones |
| [13-ERP-Catalogo-Modulos.md](./13-ERP-Catalogo-Modulos.md) | Los 28 módulos del ERP: responsabilidad, APIs, dependencias, eventos, riesgos |
| [14-ERP-Flujos-Negocio.md](./14-ERP-Flujos-Negocio.md) | 21 flujos de negocio completos: principal, especiales, fiscales |
| [15-ERP-Modelo-Dominio.md](./15-ERP-Modelo-Dominio.md) | Bounded contexts, entidades, agregados, objetos de valor, eventos de dominio |
| [16-ERP-Mapa-Dependencias.md](./16-ERP-Mapa-Dependencias.md) | Grafo de dependencias entre módulos, ruta crítica, qué puede ir en paralelo |
| [17-ERP-Roadmap-Tecnico.md](./17-ERP-Roadmap-Tecnico.md) | 13 fases de construcción con criterios de éxito y estimación de complejidad |

---

## Los 5 Bounded Contexts

```
BC-1: Identidad y Acceso     → Usuario, Rol, Sesión, Turno
BC-2: Operación de Sala      → Mesa, Pedido, DetallePedido
BC-3: Ventas y Cobro         → Venta, ItemVenta, Pago, Cliente
BC-4: Facturación Electrónica → DocumentoDTE, EmisorDTE, NC, ND
BC-5: Catálogo y Producción   → MenuItem, Receta, Ingrediente, Empaque
```

---

## Los 28 Módulos

| # | Módulo | Dominio | Prioridad |
|---|---|---|---|
| MOD-01 | Seguridad (Auth) | Seguridad | P1 |
| MOD-02 | Usuarios | Seguridad | P1 |
| MOD-03 | Clientes (Receptores) | Sala / Fiscal | P2 |
| MOD-04 | Mesas | Sala | P1 |
| MOD-05 | Pedidos | Sala | P1 |
| MOD-06 | Cocina / KDS | Sala / Producción | P2 |
| MOD-07 | POS / Caja | Cobro | P1 |
| MOD-08 | Ventas | Cobro / Fiscal | P1 |
| MOD-09 | Pagos | Cobro / Fiscal | P1 |
| MOD-10 | DTE | Facturación | P2 |
| MOD-11 | Notas de Crédito | Facturación | P3 |
| MOD-12 | Notas de Débito | Facturación | P4 |
| MOD-13 | Contingencia | Facturación | P3 |
| MOD-14 | Menú | Catálogo | P1 (existe) |
| MOD-15 | Costeo | Catálogo | P1 (existe) |
| MOD-16 | Ingredientes | Inventario | P1 (existe) |
| MOD-17 | Empaques | Inventario | P1 (existe) |
| MOD-18 | Recetas | Producción | P3 |
| MOD-19 | Compras | Abastecimiento | P3 |
| MOD-20 | Proveedores | Abastecimiento | P3 |
| MOD-21 | Config General | Configuración | P1 |
| MOD-22 | Config Fiscal (Emisor DTE) | Configuración | P2 |
| MOD-23 | Dashboard | Analítica | P2 |
| MOD-24 | Reportes | Analítica | P2 |
| MOD-25 | Turnos | Operación | P3 |
| MOD-26 | Cortes de Caja | Operación | P3 |
| MOD-27 | Auditoría | Trazabilidad | P2 |
| MOD-28 | Logs del Sistema | Trazabilidad | P2 |

---

## Ruta crítica para el primer DTE

```
MOD-01 → MOD-04 → MOD-05 → MOD-08 → MOD-09 → MOD-10
          MOD-21 → MOD-22 ──────────────────────────┘
```

8 niveles de dependencia. **El Firmador Docker accesible desde Hostinger es el bloqueante
de infraestructura más crítico** (ver doc 05-Brechas-DTE.md en facturacion-electronica/).
