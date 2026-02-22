/// <reference types="vite/client" />

declare const __API_BASE_URL__: string

interface ElectronAPI {
  selectFiles: () => Promise<{ name: string; path: string; size: number }[]>
  scanDirectory: (dirPath: string) => { name: string; path: string; size: number }[]
  isDirectory: (filePath: string) => boolean
  selectDirectory: () => Promise<string | null>
  openExternal: (url: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
