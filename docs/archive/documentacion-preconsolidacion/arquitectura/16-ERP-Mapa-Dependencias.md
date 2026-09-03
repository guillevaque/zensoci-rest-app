# 16 — ERP Zensoci: Mapa de Dependencias entre Módulos

Este documento muestra qué módulos dependen de cuáles, qué puede construirse en paralelo,
qué bloquea a otros, y el orden de construcción recomendado.

---

## Grafo de dependencias

Las flechas indican "depende de" (→ = requiere que exista).

```
MOD-21 Config General ──────────────────────────────────────┐
MOD-01 Seguridad ────────────────────────────────────────┐  │
                                                         │  │
                    ┌────────────────────────────────────▼──▼───────┐
                    │ MOD-02 Usuarios                                │
                    └────────────────────────┬───────────────────────┘
                                             │
                    ┌────────────────────────▼───────────────────────┐
                    │ MOD-04 Mesas    MOD-14 Menú    MOD-03 Clientes │
                    └──────┬──────────────┬──────────────────────────┘
                           │              │
                    ┌──────▼──────────────▼──────────────────────────┐
                    │ MOD-05 Pedidos                                  │
                    └──────┬─────────────────────────────────────────┘
                           │
               ┌───────────┼──────────────────┐
               │           │                  │
         ┌─────▼────┐  ┌───▼──────┐    ┌──────▼─────────────────────┐
         │ MOD-06   │  │ MOD-08   │    │ MOD-07 POS/Caja            │
         │  KDS     │  │ Ventas   │    └──────┬─────────────────────┘
         └──────────┘  └───┬──────┘           │
                           │                  │
                    ┌──────▼──────┐           │
                    │ MOD-09 Pagos│◄──────────┘
                    └──────┬──────┘
                           │
                    ┌──────▼──────────────────────────────────────┐
                    │ MOD-10 DTE                                   │
                    │   (requiere también MOD-22 Config Fiscal)   │
                    └──────┬────────────┬───────────────────────┘
                           │            │
                    ┌──────▼────┐  ┌────▼──────────┐
                    │ MOD-11 NC │  │ MOD-13        │
                    │ MOD-12 ND │  │ Contingencia  │
                    └───────────┘  └───────────────┘

MOD-16 Ingredientes ──► MOD-15 Costeo ──► MOD-14 Menú
MOD-17 Empaques ──────► MOD-15 Costeo
MOD-20 Proveedores ───► MOD-19 Compras ──► MOD-16, MOD-17

MOD-25 Turnos ──► MOD-26 Cortes de Caja
MOD-08 Ventas ──► MOD-23 Dashboard ──► (lee de todos)
MOD-08 Ventas ──► MOD-24 Reportes ──► (lee de todos)
MOD-01 Seguridad ──► MOD-27 Auditoría ──► (recibe eventos de todos)
MOD-28 Logs del Sistema ──► (es escrito por todos, sin dependencias)
```

---

## Tabla de dependencias directas

| Módulo | Depende directamente de |
|---|---|
| MOD-01 Seguridad | Ninguno |
| MOD-02 Usuarios | MOD-01 |
| MOD-03 Clientes | MOD-01 |
| MOD-04 Mesas | MOD-01, MOD-02 |
| MOD-05 Pedidos | MOD-01, MOD-02, MOD-04, MOD-14 |
| MOD-06 KDS | MOD-05 |
| MOD-07 POS/Caja | MOD-01, MOD-05, MOD-08, MOD-09, MOD-10 |
| MOD-08 Ventas | MOD-05, MOD-03, MOD-14 |
| MOD-09 Pagos | MOD-08 |
| MOD-10 DTE | MOD-08, MOD-09, MOD-03, MOD-22 |
| MOD-11 Notas de Crédito | MOD-10, MOD-08 |
| MOD-12 Notas de Débito | MOD-10 |
| MOD-13 Contingencia | MOD-10 |
| MOD-14 Menú | MOD-01 |
| MOD-15 Costeo | MOD-14, MOD-16, MOD-17 |
| MOD-16 Ingredientes | MOD-01 |
| MOD-17 Empaques | MOD-01 |
| MOD-18 Recetas | MOD-14, MOD-16, MOD-17 |
| MOD-19 Compras | MOD-20, MOD-16, MOD-17 |
| MOD-20 Proveedores | MOD-01 |
| MOD-21 Config General | MOD-01 |
| MOD-22 Config Fiscal | MOD-01, MOD-21 |
| MOD-23 Dashboard | MOD-08, MOD-05, MOD-04, MOD-16, MOD-17 |
| MOD-24 Reportes | MOD-08, MOD-09, MOD-10, MOD-25, MOD-16 |
| MOD-25 Turnos | MOD-02, MOD-08 |
| MOD-26 Cortes de Caja | MOD-25, MOD-08, MOD-09 |
| MOD-27 Auditoría | MOD-01, MOD-02 |
| MOD-28 Logs Sistema | Ninguno (solo escribe, no lee) |

---

## Análisis de criticidad (ruta crítica)

La ruta crítica es la cadena de dependencias más larga que bloquea el objetivo principal:
**emitir el primer DTE real de producción**.

```
MOD-01 Seguridad
  └─► MOD-21 Config General
        └─► MOD-22 Config Fiscal (Emisor DTE)
MOD-01 Seguridad
  └─► MOD-02 Usuarios
        └─► MOD-04 Mesas
              └─► MOD-05 Pedidos
                    └─► MOD-08 Ventas
                          └─► MOD-09 Pagos
                                └─► MOD-10 DTE ◄── MOD-22 Config Fiscal
                                      └─► PRIMER DTE REAL
```

**Profundidad de la ruta crítica:** 8 niveles

**Módulos bloqueantes (que nada puede saltarse):**
1. MOD-01 Seguridad — todo lo demás lo necesita
2. MOD-05 Pedidos — sin pedidos no hay ventas
3. MOD-08 Ventas — sin ventas no hay DTE
4. MOD-09 Pagos — sin pagos la venta no está completa
5. MOD-10 DTE — el objetivo final

---

## Módulos que pueden construirse en paralelo

### Grupo A — Independientes entre sí (después de MOD-01)
Los siguientes módulos solo dependen de MOD-01 y pueden desarrollarse simultáneamente:

- MOD-02 Usuarios
- MOD-14 Menú *(ya existe)*
- MOD-16 Ingredientes *(ya existe)*
- MOD-17 Empaques *(ya existe)*
- MOD-20 Proveedores
- MOD-21 Config General
- MOD-28 Logs

### Grupo B — Paralelos entre sí (después del Grupo A)
- MOD-03 Clientes (depende de MOD-01)
- MOD-04 Mesas (depende de MOD-01, MOD-02)
- MOD-15 Costeo *(ya existe)* (depende de MOD-14, MOD-16, MOD-17)
- MOD-22 Config Fiscal (depende de MOD-01, MOD-21)

### Grupo C — Paralelos entre sí (después del Grupo B)
- MOD-05 Pedidos (depende de MOD-04, MOD-14)
- MOD-19 Compras (depende de MOD-20, MOD-16, MOD-17)
- MOD-27 Auditoría (depende de MOD-01, MOD-02)

### Grupo D — Paralelos entre sí (después del Grupo C)
- MOD-06 KDS (depende de MOD-05)
- MOD-08 Ventas (depende de MOD-05, MOD-03, MOD-14)

### Grupo E — Después del Grupo D
- MOD-09 Pagos (depende de MOD-08)
- MOD-25 Turnos (depende de MOD-08)

### Grupo F — Después del Grupo E
- MOD-10 DTE (depende de MOD-08, MOD-09, MOD-22)
- MOD-26 Cortes de Caja (depende de MOD-25, MOD-09)

### Grupo G — Después del Grupo F
- MOD-07 POS/Caja (depende de MOD-05, MOD-08, MOD-09, MOD-10)
- MOD-11 Notas de Crédito (depende de MOD-10)
- MOD-13 Contingencia (depende de MOD-10)
- MOD-23 Dashboard (depende de MOD-08, MOD-05, MOD-04)
- MOD-24 Reportes (depende de MOD-08, MOD-10, MOD-25)

### Grupo H — Después del Grupo G
- MOD-12 Notas de Débito (depende de MOD-10)

---

## Qué bloquea a qué (vista inversa)

| Si este módulo no existe... | Estos módulos quedan bloqueados |
|---|---|
| MOD-01 Seguridad | TODO el sistema |
| MOD-04 Mesas | MOD-05 Pedidos → toda la cadena |
| MOD-05 Pedidos | MOD-06, MOD-07, MOD-08 → toda la cadena |
| MOD-08 Ventas | MOD-09, MOD-10, MOD-23, MOD-24 |
| MOD-09 Pagos | MOD-10 DTE, MOD-26 Cortes |
| MOD-10 DTE | MOD-11, MOD-12, MOD-13, MOD-07 (completo) |
| MOD-22 Config Fiscal | MOD-10 DTE |
| MOD-14 Menú | MOD-05 Pedidos, MOD-08 Ventas |

---

## Módulos que YA EXISTEN (no construir desde cero)

| Módulo | Estado actual | Qué falta |
|---|---|---|
| MOD-14 Menú | Completo (DB + PHP + React) | Agregar `precio_sin_iva` |
| MOD-15 Costeo | Completo | Mantener tal cual |
| MOD-16 Ingredientes | Completo | Separar tabla dual purpose (futuro) |
| MOD-17 Empaques | Completo | Nada |
| MOD-01 Seguridad | Parcial (auth funciona) | Tabla `usuarios` confirmada, mejorar permisos |
| MOD-02 Usuarios | Parcial (hardcodeado en Login.jsx) | Backend CRUD completo |
| MOD-23 Dashboard | Parcial (datos hardcodeados) | Conectar a DB real |
| MOD-21 Config General | Parcial (Settings.tsx sin DB) | Persistencia en DB |

---

## Módulos que existen solo en UI (sin backend real)

| Módulo | Estado actual | Acción requerida |
|---|---|---|
| MOD-04 Mesas | UI hardcodeada (GestionMesas.tsx) | Crear tabla + PHP + conectar React |
| MOD-05 Pedidos | UI hardcodeada (Pedidos.tsx) | Crear tabla + PHP + reescribir React |
| MOD-07 POS/Caja | Prototipo (alert simulado) | Conectar a Ventas, Pagos, DTE |

---

## Módulos que no existen en ninguna capa

| Módulo | Prioridad | Orden de construcción |
|---|---|---|
| MOD-08 Ventas | P1 | 5° (después de Pedidos) |
| MOD-09 Pagos | P1 | 6° (después de Ventas) |
| MOD-10 DTE | P2 | 7° (después de Pagos y Config Fiscal) |
| MOD-22 Config Fiscal | P2 | 4° (paralelo a Mesas/Pedidos) |
| MOD-03 Clientes | P2 | 3° (paralelo a Mesas) |
| MOD-06 KDS | P2 | Paralelo a Ventas |
| MOD-11 Notas de Crédito | P3 | 8° (después de DTE) |
| MOD-13 Contingencia | P3 | 8° (después de DTE) |
| MOD-25 Turnos | P3 | 7° (paralelo a DTE) |
| MOD-26 Cortes de Caja | P3 | 8° (después de Turnos) |
| MOD-19 Compras | P3 | Paralelo a Pedidos |
| MOD-20 Proveedores | P3 | Antes de Compras |
| MOD-27 Auditoría | P2 | 3° (paralelo a Mesas) |
| MOD-28 Logs | P2 | 1° (independiente) |
