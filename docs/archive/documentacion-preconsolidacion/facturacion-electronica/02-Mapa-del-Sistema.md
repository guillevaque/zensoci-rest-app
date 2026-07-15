# 02 — Mapa del Sistema

## Rutas del frontend (React Router)

| Ruta | Componente | Acceso |
|---|---|---|
| `/login` | `pages/Login.jsx` | Público |
| `/dashboard` | `pages/Dashboard.tsx` | Protegido |
| `/mesas` | `pages/GestionMesas.tsx` | Protegido |
| `/pedidos` | `pages/Pedidos.tsx` | Protegido |
| `/menu` | `pages/GestionMenu.tsx` | Protegido |
| `/inventario` | `pages/Inventory.tsx` | Protegido |
| `/reportes` | `pages/Reports.tsx` | Protegido |
| `/costeo` | `pages/Costeo.tsx` | Protegido |
| `/personal` | `pages/Personal.tsx` | Protegido |
| `/ajustes` | `pages/Settings.tsx` | Protegido |
| `/pos` | redirect → `/pedidos` | — |
| `*` | redirect → `/dashboard` | — |

Todas las rutas protegidas están envueltas en `ProtectedRoute` → `Layout` → `Outlet`.

## Endpoints PHP existentes

| Archivo PHP | Método | Ruta | Función |
|---|---|---|---|
| `auth/me.php` | GET | `/api/auth/me.php` | Retorna usuario de sesión actual |
| `auth/login.php` | POST | `/api/auth/login.php` | Login por PIN o email+password |
| `auth/logout.php` | POST | `/api/auth/logout.php` | Destruye sesión |
| `auth/users.php` | GET | `/api/auth/users.php` | Lista usuarios activos para pantalla login |
| `ingredients.php` | GET/POST/PUT/DELETE | `/api/ingredients.php` | CRUD ingredientes del inventario |
| `menu.php` | GET/POST/PUT/DELETE | `/api/menu.php` | CRUD ítems del menú |
| `costeo.php` | GET/PUT | `/api/costeo.php` | Consulta y actualización de costeo |
| `empaques.php` | GET/POST/PUT/DELETE | `/api/empaques.php` | CRUD empaques |
| `upload.php` | POST | `/api/upload.php` | Subida de imágenes del menú |

> Los archivos de autenticación (`headers.php`, `config.php`) no están en el repositorio Git
> (posiblemente en `.gitignore`). Se asume que existen en Hostinger.

## Clientes HTTP del frontend

El proyecto tiene **dos clientes HTTP paralelos** (legacy y nuevo). Esto es deuda técnica a resolver.

### `src/services/http.ts` (cliente principal — más completo)

```ts
export const API_BASE = origin ? `${origin}/api` : '/api';
// Métodos: get, post, put, delete
```

Usado por: `services/auth.service.ts`, `services/ingredients.service.ts`, `services/menu.service.ts`

### `src/api/http.ts` (cliente secundario — levemente diferente)

```ts
export const http = {
  get, send (POST/PUT/DELETE), upload
}
```

Usado por: `api/auth.ts`, `api/ingredients.ts`, `api/menu.ts`, `api/costeo.ts`, `api/empaques.ts`

## Autenticación

- Sesión basada en cookies PHP (`session_start()` → `$_SESSION['user_id']`)
- Todas las llamadas incluyen `credentials: 'include'` para enviar la cookie de sesión
- Dos flujos de login:
  1. **PIN** — usuario selecciona su tarjeta en pantalla y digita PIN de 4 dígitos
  2. **Email + password** — fallback para administradores

### Tipos de usuario confirmados

```ts
type UserRole = 'admin' | 'manager' | 'staff' | 'member';
```

## Layout del frontend

```
App.tsx
└── AuthProvider (contexto de autenticación)
    ├── /login → Login.jsx (público)
    └── ProtectedRoute
        └── Layout.tsx
            ├── Sidebar.tsx (desktop, fijo a la izquierda, 220px)
            ├── MobileDrawer.tsx (móvil, drawer)
            ├── SubHeader.tsx (top bar móvil + título de sección)
            └── <Outlet> → página activa
```

## Estructura de archivos

```
src/
├── api/            # Clientes API (segundo set, usa src/api/http.ts)
│   ├── http.ts
│   ├── auth.ts
│   ├── users.ts
│   ├── ingredients.ts
│   ├── menu.ts
│   ├── costeo.ts
│   └── empaques.ts
├── auth/
│   ├── AuthContext.jsx
│   └── ProtectedRoute.jsx
├── components/
│   ├── IngredientModal.tsx
│   ├── MenuModal.tsx
│   ├── Navbar.jsx
│   └── Sidebar.tsx
├── lib/
│   ├── api.ts      # Tercer cliente HTTP (legacy, apunta a /api hardcodeado)
│   └── apiMenu.ts
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.tsx
│   ├── GestionMesas.tsx
│   ├── Pedidos.tsx
│   ├── GestionMenu.tsx
│   ├── Inventory.tsx
│   ├── Reports.tsx
│   ├── Costeo.tsx
│   ├── Personal.tsx
│   ├── Settings.tsx
│   ├── Caja.tsx    # Componente existente, no registrado en router
│   ├── POS.tsx
│   └── Empaques.tsx
├── services/       # Servicios (primer set, usa src/services/http.ts)
│   ├── http.ts
│   ├── auth.service.ts
│   ├── ingredients.service.ts
│   └── menu.service.ts
└── ui/             # Componentes de layout global
    ├── App.tsx
    ├── Layout.tsx
    ├── Sidebar.tsx
    ├── MobileDrawer.tsx
    ├── SubHeader.tsx
    └── Topbar.tsx
```
