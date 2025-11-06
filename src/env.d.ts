/// <reference types="vite/client" />

// (opcional) declara tus variables para tener autocompletado/seguridad de tipos
interface ImportMetaEnv {
  readonly VITE_API_ORIGIN?: string; // ej. https://app.zensoci.com
  readonly VITE_API_BASE?: string;   // ej. /api
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
