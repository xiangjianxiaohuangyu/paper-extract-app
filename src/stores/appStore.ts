import { create } from 'zustand'

// 文件类型定义
export interface FileItem {
  id: string
  name: string
  path: string
  size?: number
}

// 配置类型定义
export interface AppConfig {
  model_name: string
  api_key: string
}

// 环境检测结果类型
export interface EnvCheckResult {
  python?: {
    version: string
    status: 'ok' | 'warning' | 'error'
    message: string
  }
  dependencies?: {
    [key: string]: {
      installed: boolean
      version?: string
    }
  }
  api_connection?: {
    status: 'ok' | 'warning' | 'error'
    message: string
  }
}

// 模块类型
export type ModuleType = 'analyze' | 'config' | 'env'

// 应用状态
interface AppState {
  // 文章解析相关
  selectedFiles: FileItem[]
  isAnalyzing: boolean
  analyzeResult: any | null
  addFiles: (files: FileItem[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  setAnalyzing: (analyzing: boolean) => void
  setAnalyzeResult: (result: any) => void

  // 配置相关
  config: AppConfig
  setConfig: (config: Partial<AppConfig>) => void

  // 环境检测相关
  envCheckResult: EnvCheckResult | null
  isChecking: boolean
  setEnvCheckResult: (result: EnvCheckResult | null) => void
  setChecking: (checking: boolean) => void

  // 终端日志相关
  terminalLogs: {
    analyze: string[]
    config: string[]
    env: string[]
  }
  appendLog: (module: ModuleType, message: string) => void
  clearLogs: (module: ModuleType) => void
}

export const useAppStore = create<AppState>((set) => ({
  // 文章解析相关状态
  selectedFiles: [],
  isAnalyzing: false,
  analyzeResult: null,

  addFiles: (files) =>
    set((state) => ({
      selectedFiles: [...state.selectedFiles, ...files],
    })),

  removeFile: (id) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.filter((f) => f.id !== id),
    })),

  clearFiles: () => set({ selectedFiles: [] }),

  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  setAnalyzeResult: (result) => set({ analyzeResult: result }),

  // 配置相关状态
  config: {
    model_name: 'qwen-max',
    api_key: '',
  },

  setConfig: (config) =>
    set((state) => ({
      config: { ...state.config, ...config },
    })),

  // 环境检测相关状态
  envCheckResult: null,
  isChecking: false,

  setEnvCheckResult: (result) => set({ envCheckResult: result }),

  setChecking: (checking) => set({ isChecking: checking }),

  // 终端日志相关状态
  terminalLogs: {
    analyze: [],
    config: [],
    env: [],
  },

  appendLog: (module, message) =>
    set((state) => ({
      terminalLogs: {
        ...state.terminalLogs,
        [module]: [...state.terminalLogs[module], message],
      },
    })),

  clearLogs: (module) =>
    set((state) => ({
      terminalLogs: {
        ...state.terminalLogs,
        [module]: [],
      },
    })),
}))
