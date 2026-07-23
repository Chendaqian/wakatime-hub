/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIST_IDS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
