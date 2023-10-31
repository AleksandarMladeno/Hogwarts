/// <reference types="vite/client" />
/// <reference types="@overwolf/types" />

interface ImportMetaEnv {
  readonly VITE_APP_WEB: string;
  readonly VITE_PATREON_BASE_URI: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
