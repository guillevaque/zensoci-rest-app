# 17 — Roadmap de Apertura — Septiembre 2024

Roadmap orientado a la apertura del restaurante físico con el sistema completo funcionando.
Dividido en tres etapas que entregan valor real al negocio de forma incremental.

> **Nota:** Las fechas son estimaciones orientativas. Deben ajustarse según la disponibilidad
> del equipo, la resolución de pendientes fiscales y la velocidad de implementación real.
> La apertura en septiembre es un objetivo, no un compromiso.

---

## ETAPA 1 — DTE para PedidosYa (canal actual)

**Estado actual:** Zensoci opera hoy con PedidosYa sin DTE.
**Objetivo de la etapa:** Emitir DTEs válidos para todas las ventas de PedidosYa.

**Duración estimada:** 4-6 semanas desde que se resuelvan M0 y M1

**Entregables:**

### 1.1 — Infraestructura y datos fiscales
- [ ] Resolver acceso del Firmador Docker desde Hostinger (bloqueante más crítico)
- [ ] Obtener NIT real de Zensoci con llaves en el Firmador
- [ ] Confirmar inscripción en el MH como emisor DTE
- [ ] Obtener código de establecimiento y punto de venta del MH
- [ ] Confirmar URL del API del MH en ambiente de pruebas
- [ ] Configurar variable de entorno `DTE_FIRMADOR_PASSWORD` en Hostinger

**Bloqueante principal:** Todo lo anterior. Sin el Firmador accesible y las credenciales reales,
no se puede avanzar en ningún paso de implementación del DTE.

### 1.2 — Tablas en DB
- [ ] Ejecutar migrations 02, 03, 04, 05 en Hostinger (desde M2)
- [ ] Ejecutar migration 06 (precio_sin_iva en menú)
- [ ] Poblar `mesas` con las 11 mesas actuales (Mesa 1-10, Pickup)
- [ ] Poblar `dte_correlativos` con registro inicial para tipo 01

### 1.3 — Backend PHP
- [ ] `pedidos.php` + `pedido_items.php` (M3)
- [ ] `ventas.php` + `ventas_helpers.php` (M4)
- [ ] `pagos.php` (M4)
- [ ] `config_fiscal.php` (M5)
- [ ] `dte_builder.php` + `dte_helpers.php` + `dte_correlativos.php` (M6)
- [ ] `dte_validator.php` (M7)
- [ ] `firmador_client.php` (M8)
- [ ] `mh_client.php` (M9 + M10)
- [ ] `dte.php` (endpoint principal con historial y reintentos) (M11)

### 1.4 — Frontend React mínimo
- [ ] Pantalla "Nuevo Pedido PedidosYa" — registrar pedido externo con referencia
- [ ] Pantalla "Registrar Venta" — confirmar cobro y forma de pago
- [ ] Pantalla "Historial DTE" — ver estado, número de control, sello, reintentar
- [ ] Sección "Configuración Fiscal" en Settings (M5)

### 1.5 — Validación en ambiente de prueba
- [ ] Emitir 10 DTEs de tipo 01 en ambiente 00 (prueba) del MH
- [ ] Verificar que todos son aceptados con sello
- [ ] Probar el flujo de reintento (simular falla del Firmador, simular timeout del MH)
- [ ] Verificar que no hay duplicados (probar idempotencia de pedido y venta)

### 1.6 — Go-live en producción
- [ ] Cambiar `configuracion_fiscal.ambiente` de `00` a `01`
- [ ] Emitir el primer DTE de producción
- [ ] Monitorear los primeros 10 DTEs reales

**Criterio de éxito de la Etapa 1:**
Cada venta de PedidosYa genera un DTE aceptado por el MH. El operador puede ver el número
de control desde la app. Los DTEs fallidos pueden reintentarse sin re-cobrar.

---

## ETAPA 2 — Mesas y flujo presencial (apertura del restaurante)

**Estado objetivo:** El restaurante físico abre con POS, mesas, cocina y caja usando
el mismo motor de DTE de la Etapa 1.

**Duración estimada:** 3-5 semanas después de completar Etapa 1

**Dependencia crítica:** La Etapa 1 debe estar en producción y estable antes de comenzar
la Etapa 2. El motor de DTE no se toca en esta etapa.

**Entregables:**

### 2.1 — Módulo de Mesas
- [ ] `mesas.php` — CRUD y cambio de estado (M13)
- [ ] Reescribir `GestionMesas.tsx` consumiendo API real
- [ ] Estado de cada mesa en tiempo real (polling cada 30 segundos)
- [ ] Indicador de mesa ocupada con tiempo transcurrido

### 2.2 — Módulo de Pedidos presenciales
- [ ] Reescribir `Pedidos.tsx` — flujo real: mesa → ítems → confirmar
- [ ] Pantalla de toma de pedido con buscador de ítems del menú
- [ ] Soporte para notas especiales por ítem
- [ ] Cancelación de ítems con autorización de manager

### 2.3 — Cocina / KDS
- [ ] `cocina.php` — endpoint de cola de cocina (M13)
- [ ] Nueva página `/cocina` sin sidebar, pantalla completa
- [ ] Tarjetas por pedido con ítems y tiempo de espera
- [ ] Polling cada 10 segundos
- [ ] Botón "Listo" por ítem y "Todo el pedido listo"

### 2.4 — POS / Caja
- [ ] Reescribir `POS.tsx` o `Caja.tsx` — flujo real de cobro
- [ ] Selección de tipo DTE (Factura consumidor / CCF empresa)
- [ ] Múltiples formas de pago (efectivo + tarjeta)
- [ ] Cálculo de vuelto para efectivo
- [ ] Mostrar número de control y sello en pantalla post-cobro

### 2.5 — Clientes y CCF
- [ ] `clientes.php` — CRUD de clientes (M14 parcial)
- [ ] Buscador de cliente al cobrar CCF
- [ ] Formulario de datos del receptor (NIT, NRC, nombre)
- [ ] Extender `dte_builder.php` para tipo 03 (CCF)

### 2.6 — Dashboard conectado
- [ ] `dashboard.php` — KPIs del día desde DB real
- [ ] Reemplazar datos hardcodeados en `Dashboard.tsx`
- [ ] Ventas del día, mesas activas, pedidos pendientes, alertas de stock

### 2.7 — Pruebas antes de apertura
- [ ] Simulacro completo del flujo: mesa → pedido → cocina → cobro → DTE
- [ ] Prueba de carga: 10 pedidos simultáneos
- [ ] Prueba de falla del Firmador durante servicio real
- [ ] Prueba de doble cobro (idempotencia de caja)

**Criterio de éxito de la Etapa 2:**
El mesero puede abrir una mesa, tomar el pedido, la cocina lo ve en el KDS, el cajero cobra
y el cliente recibe el número de control del DTE. Todo usando el mismo motor de DTE de la Etapa 1.

---

## ETAPA 3 — Delivery propio con motoristas

**Estado objetivo:** Zensoci puede hacer entregas con su propio personal, con seguimiento
de pedidos y gestión de motoristas.

**Duración estimada:** 3-4 semanas después de la apertura estable

**Dependencia:** La Etapa 2 debe estar funcionando establemente en producción.

**Entregables:**

### 3.1 — Módulo de Clientes y Direcciones
- [ ] `clientes.php` completo — CRUD clientes y direcciones de entrega (M14)
- [ ] Pantalla de gestión de clientes en React
- [ ] Asociar múltiples direcciones a un cliente
- [ ] Mapa o campo de referencia de dirección

### 3.2 — Pedidos de Delivery propio
- [ ] Extender `pedidos.php` para canal DELIVERY_PROPIO
- [ ] Pantalla de nuevo pedido delivery con selección de cliente y dirección
- [ ] Asignación de motorista al pedido
- [ ] Hora estimada de entrega

### 3.3 — Gestión de motoristas
- [ ] Agregar rol `motorista` al sistema de usuarios
- [ ] Vista del motorista: lista de entregas del día
- [ ] Confirmación de entrega desde la app (o mediante el operador)

### 3.4 — Cobro en delivery
- [ ] Soporte para cobro al entregar (efectivo con el motorista)
- [ ] Soporte para cobro previo (transferencia antes de preparar)
- [ ] DTE emitido con datos completos del receptor (cliente registrado)

### 3.5 — Reportes de delivery
- [ ] Reporte de entregas por motorista
- [ ] Reporte de ventas por canal (MESA vs PICKUP vs DELIVERY_PROPIO vs PLATAFORMA_EXTERNA)
- [ ] Conciliación de PedidosYa (ventas vs comisiones vs liquidaciones)

**Criterio de éxito de la Etapa 3:**
Un pedido de delivery propio puede registrarse, prepararse, asignarse a un motorista,
entregarse, cobrarse y generar un DTE válido.

---

## Diagrama de la línea de tiempo

```
Hoy                    Etapa 1              Apertura           Etapa 3
 │                        │                    │                  │
 ├── M0/M1 (prereqs) ─────┤                    │                  │
 │                        │                    │                  │
 ├── Firmador ────────────┤ ← BLOQUEANTE       │                  │
 │                        │                    │                  │
 │   Backend DTE ─────────┤                    │                  │
 │                        │                    │                  │
 │   Pruebas MH ──────────┤                    │                  │
 │                        │                    │                  │
 │   Go-live PedidosYa ───┤                    │                  │
 │                        │                    │                  │
 │                        ├── Etapa 2 ─────────┤                  │
 │                        │   Mesas / KDS      │                  │
 │                        │   POS / Caja       │                  │
 │                        │   CCF              │                  │
 │                        │                    │                  │
 │                        │                    ├── Etapa 3 ───────┤
 │                        │                    │   Clientes       │
 │                        │                    │   Motoristas     │
 │                        │                    │   Delivery       │
 ▼                        ▼                    ▼                  ▼
```

---

## Riesgos del roadmap completo

| Riesgo | Etapa | Impacto | Mitigación |
|---|---|---|---|
| Firmador no accesible desde Hostinger | 1 | **Crítico** | Resolver antes de iniciar cualquier desarrollo DTE |
| Credenciales del Firmador no disponibles | 1 | **Crítico** | El propietario gestiona con el MH |
| MH rechaza DTEs de prueba por error de formato | 1 | Alto | M0 y M7 reducen este riesgo |
| Hostinger no soporta las extensiones PHP necesarias | 1 | Alto | Verificar en M1 |
| La tabla de usuarios tiene estructura diferente a la esperada | 1 | Medio | Verificar en M1 y adaptar |
| Apertura antes de que Etapa 1 esté estable | 2 | **Crítico** | No abrir sin DTE funcionando |
| El KDS necesita websockets (polling insuficiente) | 2 | Medio | Probar con polling; ajustar intervalo |
| Demanda mayor a la esperada al abrir | 2 | Medio | Pruebas de carga antes de apertura |
| Motorista sin app móvil | 3 | Bajo | Operador confirma entrega desde la app web |

---

## Pendientes fiscales que bloquean el roadmap

Todos estos deben resolverse **antes del inicio de la Etapa 1**:

1. NIT real de Zensoci con llaves en el Firmador
2. Inscripción en el MH como emisor DTE
3. Código de establecimiento y punto de venta del MH
4. URL del API del MH (pruebas y producción)
5. Mecanismo de autenticación con el API del MH
6. Catálogos CAT-012 y CAT-013 completos (departamento y municipio de El Salvador)
7. Código de actividad económica de Zensoci (CAT-019)
8. Tratamiento fiscal correcto de la forma de pago de PedidosYa (CAT-017)

**PENDIENTE DE VALIDAR CON FUENTE OFICIAL:** Cada punto de la lista anterior.
