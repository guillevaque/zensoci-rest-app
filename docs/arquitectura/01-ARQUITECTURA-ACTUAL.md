# 01 — Arquitectura Actual

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + TypeScript | React 18.3, TS 5.5 |
| Bundler | Vite + @vitejs/plugin-react-swc | 5.4 |
| Estilos | Tailwind CSS | 3.4 |
| Router | React Router DOM | 7.9 |
| Backend | PHP (sin framework) | PENDIENTE DE CONFIRMAR versión en Hostinger |
| Base de datos | MySQL (InnoDB, utf8mb4_unicode_ci) | PENDIENTE DE CONFIRMAR |
| Servidor | Hostinger | PENDIENTE DE CONFIRMAR tipo de plan |
| Firmador DTE | Docker `svfe/svfe-api-firmador:v20260316` | Solo en máquina local hoy |

---

## Entornos

### Desarrollo local

- Frontend en `http://localhost:5173` (Vite dev server)
- Proxy Vite redirige `/api/*` → `https://app.zensoci.com`
- Firmador Docker en `http://localhost:8113` (solo en máquina del desarrollador)

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'https://app.zensoci.com', changeOrigin: true },
    '/assets/menu': { target: 'https://app.zensoci.com', changeOrigin: true },
  }
}
```

### Producción (Hostinger)

- URL base: `https://app.zensoci.com`
- Frontend: archivos estáticos compilados con `vite build`
- Backend PHP: `https://app.zensoci.com/api/`
- DB: `u485160267_zensoci_db` en MySQL de Hostinger
- Despliegue: `vite build` local → subir `dist/` y PHP por FTP/SSH → migraciones vía phpMyAdmin

---

## Variables de entorno del frontend

| Variable | Uso |
|---|---|
| `VITE_API_ORIGIN` | Origen del backend PHP |
| `VITE_API_BASE` | Base URL de la API |

Variable de entorno crítica del servidor:
- `DTE_FIRMADOR_PASSWORD` — contraseña de la llave privada del Firmador. **Nunca en DB, nunca en Git.**

---

## Clientes HTTP del frontend (deuda técnica)

El proyecto tiene **tres clientes HTTP paralelos**:

| Archivo | Uso actual |
|---|---|
| `src/services/http.ts` | Principal — usado por `auth.service.ts`, `ingredients.service.ts`, `menu.service.ts` |
| `src/api/http.ts` | Secundario — usado por `api/auth.ts`, `api/ingredients.ts`, `api/menu.ts`, `api/costeo.ts`, `api/empaques.ts` |
| `src/lib/api.ts` | Legacy — apunta a `/api` hardcodeado |

**Recomendación:** Consolidar en `src/services/http.ts`. Hacerlo antes de construir nuevos módulos.

---

## Rutas del frontend

| Ruta | Componente | Estado |
|---|---|---|
| `/login` | `pages/Login.jsx` | Funcional (PHP sessions + cookies) |
| `/dashboard` | `pages/Dashboard.tsx` | UI completa, datos hardcodeados |
| `/mesas` | `pages/GestionMesas.tsx` | UI hardcodeada, sin backend |
| `/pedidos` | `pages/Pedidos.tsx` | UI hardcodeada (6 pedidos de ejemplo) |
| `/menu` | `pages/GestionMenu.tsx` | Funcional (DB + PHP + React) |
| `/inventario` | `pages/Inventory.tsx` | Funcional (DB + PHP + React) |
| `/reportes` | `pages/Reports.tsx` | UI básica, datos hardcodeados |
| `/costeo` | `pages/Costeo.tsx` | Funcional (DB + PHP + React) |
| `/personal` | `pages/Personal.tsx` | UI hardcodeada (6 empleados) |
| `/ajustes` | `pages/Settings.tsx` | Prototipo sin backend |
| `/pos` | redirect → `/pedidos` | — |

---

## Endpoints PHP existentes

| Archivo PHP | Método | Función |
|---|---|---|
| `auth/me.php` | GET | Retorna usuario de sesión actual |
| `auth/login.php` | POST | Login por PIN o email+password |
| `auth/logout.php` | POST | Destruye sesión |
| `auth/users.php` | GET | Lista usuarios activos para pantalla de login |
| `ingredients.php` | GET/POST/PUT/DELETE | CRUD ingredientes del inventario |
| `menu.php` | GET/POST/PUT/DELETE | CRUD ítems del menú |
| `costeo.php` | GET/PUT | Consulta y actualización de costeo |
| `empaques.php` | GET/POST/PUT/DELETE | CRUD empaques |
| `upload.php` | POST | Subida de imágenes del menú |

> Los archivos `headers.php` y `config.php` no están en el repositorio Git (posiblemente en `.gitignore`).
> Se asume que existen en Hostinger.

---

## Tablas existentes en DB

### `menu`
Ítems del menú con precio **con IVA** (`price`). No tiene `precio_sin_iva` — se calcula como `price / 1.13` hasta que se agregue la columna.

| Columna | Tipo | Nota |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `name` | VARCHAR | Nombre |
| `category` | VARCHAR | Categoría |
| `price` | DECIMAL | Precio CON IVA |
| `description` | VARCHAR | |
| `image_url` | VARCHAR | URL relativa |
| `active` | TINYINT(1) | |

### `ingredientes`
Tabla dual: catálogo de materias primas (WHERE `costeo_platillo_id IS NULL`) + líneas de receta (WHERE `costeo_platillo_id IS NOT NULL`). 42+ registros reales de proveedores y costos.

### `costeo_platillos`
Resumen financiero por platillo. 20 platillos con costeo completo. Tiene `precio_con_iva` y `precio_sin_iva`.

### `empaques`
Catálogo de materiales de empaque con costo unitario.

### Tabla de usuarios
**PENDIENTE DE CONFIRMAR** nombre exacto (`usuarios` o `users`) y columnas. Se infiere existencia por el comportamiento del login.

### Tablas que no existen (deben crearse)

- `mesas` — Mesa/GestionMesas está hardcodeado en React
- `pedidos`, `pedido_items` — Pedidos está hardcodeado en React
- `ventas`, `venta_items` — No existe ningún registro de ventas
- `pagos` — No existe
- `clientes` — No existe
- `configuracion_fiscal` — No existe
- `dte_documentos`, `dte_correlativos` — No existe

---

## Estado por módulo

### Completo (DB + PHP + React)
- Autenticación (login por PIN y email+password, sesión PHP)
- Menú (CRUD con imágenes)
- Ingredientes / Inventario
- Costeo de platillos
- Empaques

### Solo UI (sin DB ni backend)
- GestionMesas — array hardcodeado
- Pedidos — 6 pedidos de ejemplo hardcodeados
- Dashboard — datos hardcodeados
- Reports — datos hardcodeados
- Personal — 6 empleados hardcodeados

### Prototipo (sin backend funcional)
- Settings — campos hardcodeados, sin persistencia
- Caja — `alert('Cobro simulado')`, sin ruta en el router
- POS — redirige a `/pedidos`

---

## Restricciones de la arquitectura (no modificar)

| Restricción | Razón |
|---|---|
| PHP sin framework | Patrón existente funciona; no migrar |
| React + TypeScript | Stack activo en producción |
| MySQL en Hostinger | Base de datos productiva |
| Docker solo para el Firmador | Único uso justificado |
| Sin microservicios | Hostinger no soporta orquestación de servicios |
| Sin Node.js | No agregar runtimes nuevos |
| Sin Redis/colas | Hostinger shared no lo ofrece |
| Sin JWT | PHP sessions con cookies ya funciona |
| Sin ORM | PDO preparado directo |
