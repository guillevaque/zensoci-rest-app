import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

/**
 * Dev:  "npm run dev"   → proxy reenvía /api y /assets/menu a Hostinger
 *                         .env.local debe tener VITE_API_ORIGIN= (vacío)
 * Prod: "npm run build" → usa .env.production (VITE_API_ORIGIN=https://app.zensoci.com)
 *                         el proxy no aplica en el build, las llamadas van directo
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://app.zensoci.com',
        changeOrigin: true,
        secure: true,
      },
      '/assets/menu': {
        target: 'https://app.zensoci.com',
        changeOrigin: true,
        secure: true,
      },
      // Proxy temporal para probar el Firmador Docker directo desde el browser.
      // Solo aplica en "npm run dev". No existe en el build de producción.
      // Revertir cuando no se necesite: eliminar este bloque.
      '/firmador-local': {
        target: 'http://localhost:8113',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/firmador-local/, ''),
      },
    },
  },
})
