import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
export default defineConfig({ plugins:[react()], server:{proxy: {
    '/api': {
      target: 'https://app.zensoci.com', // tu Hostinger (ej. https://app.zensoci.com)
      changeOrigin: true,
      secure: true,
    },
  },host:true, port:5173} })
