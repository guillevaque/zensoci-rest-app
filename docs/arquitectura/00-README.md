# Arquitectura Zensoci — Índice

Documentación de arquitectura del ERP Zensoci. La Facturación Electrónica (DTE) es un módulo
dentro del sistema, no un sistema separado.

---

## Documentos

| Archivo | Contenido |
|---|---|
| [01-ARQUITECTURA-ACTUAL.md](./01-ARQUITECTURA-ACTUAL.md) | Stack tecnológico, estado actual de módulos, mapa del sistema |
| [02-MODELO-OMNICANAL.md](./02-MODELO-OMNICANAL.md) | Los 4 canales de venta y cómo convergen en un único núcleo |
| [03-FLUJOS-POR-MODALIDAD.md](./03-FLUJOS-POR-MODALIDAD.md) | Flujos completos por canal y flujos de negocio transversales |
| [04-MODELO-DOMINIO.md](./04-MODELO-DOMINIO.md) | Entidades, bounded contexts, agregados y eventos de dominio |
| [05-ROADMAP.md](./05-ROADMAP.md) | 28 módulos, dependencias, fases de construcción |

---

## Los 5 Bounded Contexts

```
BC-1: Identidad y Acceso      → Usuario, Rol, Sesión, Turno
BC-2: Operación de Sala       → Mesa, Pedido, DetallePedido
BC-3: Ventas y Cobro          → Venta, ItemVenta, Pago, Cliente
BC-4: Facturación Electrónica → DocumentoDTE, EmisorDTE, NC, ND
BC-5: Catálogo y Producción   → MenuItem, Receta, Ingrediente, Empaque
```

---

## Ruta crítica para el primer DTE

```
MOD-01 → MOD-02 → MOD-04 → MOD-05 → MOD-08 → MOD-09 → MOD-10
MOD-01 → MOD-21 → MOD-22 ─────────────────────────────────────┘
```

8 niveles de dependencia. **Bloqueante de infraestructura crítico:** el Firmador Docker debe ser
accesible desde Hostinger — hoy solo está disponible en la máquina local del desarrollador.

---

## Documentación de Facturación Electrónica

Ver [`../facturacion-electronica/`](../facturacion-electronica/) para la documentación
específica del módulo DTE: modelo de datos, flujo técnico, estados, idempotencia y plan de implementación.
