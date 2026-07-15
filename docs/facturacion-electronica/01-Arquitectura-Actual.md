# 01 — Arquitectura Actual

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + TypeScript | React 18.3, TS 5.5 |
| Bundler | Vite + @vitejs/plugin-react-swc | 5.4 |
| Estilos | Tailwind CSS | 3.4 |
| Router | React Router DOM | 7.9 |
| Backend | PHP (sin framework) | PENDIENTE DE CONFIRMAR |
| Base de datos | MySQL | PENDIENTE DE CONFIRMAR |
| Servidor | Hostinger (shared/VPS) | PENDIENTE DE CONFIRMAR |
| Firmador MH | Docker `svfe/svfe-api-firmador:v20260316` | local únicamente |

## Entornos

### Desarrollo local

- Frontend corre en `http://localhost:5173` (Vite dev server)
- Proxy de Vite redirige `/api/*` → `https://app.zensoci.com` (configurado en `vite.config.ts`)
- El Firmador Docker corre en `http://localhost:8113` (solo en máquina del desarrollador)

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'https://app.zensoci.com', changeOrigin: true },
    '/assets/menu': { target: 'https://app.zensoci.com', changeOrigin: true },
  }
}
```

### Producción / Pruebas (Hostinger)

- URL base: `https://app.zensoci.com`
- Frontend compilado con `vite build` → archivos estáticos en Hostinger
- Backend PHP servido en `https://app.zensoci.com/api/`
- Base de datos: `u485160167_zensoci_db` en MySQL de Hostinger

## Variables de entorno

El frontend usa variables `VITE_*` leídas desde `.env.local`:

| Variable | Uso | Valor en producción |
|---|---|---|
| `VITE_API_ORIGIN` | Origen del backend PHP | `https://app.zensoci.com` |
| `VITE_API_BASE` | Base URL de la API (derivada) | `https://app.zensoci.com/api` |

## Flujo de despliegue

1. Desarrollador hace `vite build` localmente
2. Sube archivos estáticos de `dist/` a Hostinger via FTP/SSH
3. Archivos PHP se suben directamente a la carpeta `/api/` en Hostinger
4. Migraciones SQL se ejecutan manualmente via phpMyAdmin o CLI de Hostinger

## Firmador DTE (Docker)

- Imagen: `svfe/svfe-api-firmador:v20260316`
- Puerto local: `8113`
- Estado confirmado: endpoint `/firmardocumento/status` responde OK
- Error confirmado en prueba: `"No existe llave pública para este NIT"` → indica que el Firmador
  funciona correctamente; solo faltan credenciales reales del emisor
- **Importante:** el Firmador solo existe en la máquina local del desarrollador. El backend PHP en
  Hostinger necesitará una forma de comunicarse con el Firmador (proxy, VPN, o despliegue en nube)
  que deberá definirse en fases posteriores.

## Restricciones confirmadas

- PHP **no** se migra (sin Laravel, sin Symfony, etc.)
- React **no** se migra
- MySQL **no** se migra
- Docker **solo** para el servicio del Firmador del MH
- `package.json` y `composer` no se modifican en esta fase
