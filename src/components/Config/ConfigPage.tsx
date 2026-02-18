import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { saveConfig, loadConfig, getConfigList, deleteConfig, getLatestConfig } from '@/api'
import TerminalPanel from '@/components/Terminal'

// 模型选项 - 按供应商分组
const PROVIDERS = [
  { value: 'qwen', label: '通义千问 (Qwen)' },
  { value: 'openai', label: 'OpenAI' },
]

const QWEN_MODELS = [
  { value: 'qwen-max', label: 'qwen-max (推荐)' },
  { value: 'qwen-plus', label: 'qwen-plus' },
  { value: 'qwen-turbo', label: 'qwen-turbo' },
  { value: 'qwen-long', label: 'qwen-long' },
]

const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (推荐)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
]

interface SavedConfig {
  config_name: string
  model_name: string
  file_name: string
}

function ConfigPage() {
  const { config, setConfig, terminalLogs, clearLogs } = useAppStore()
  const [provider, setProvider] = useState<'qwen' | 'openai'>(config.provider as 'qwen' | 'openai' || 'qwen')
  const [modelName, setModelName] = useState(config.model_name || 'qwen-max')
  const [apiKey, setApiKey] = useState(config.api_key || '')
  const [configName, setConfigName] = useState(config.config_name || '自定义名称')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // 根据供应商获取模型列表
  const getModels = () => {
    return provider === 'qwen' ? QWEN_MODELS : OPENAI_MODELS
  }

  // 处理供应商变更
  const handleProviderChange = (newProvider: 'qwen' | 'openai') => {
    setProvider(newProvider)
    const models = newProvider === 'qwen' ? QWEN_MODELS : OPENAI_MODELS
    setModelName(models[0].value)
  }

  // 页面初始化时加载配置
  useEffect(() => {
    let isMounted = true
    const fetchConfig = async () => {
      // 如果本地存储已有配置，直接使用
      if (config.api_key) {
        setProvider(config.provider as 'qwen' | 'openai' || 'qwen')
        setModelName(config.model_name || 'qwen-max')
        setApiKey(config.api_key || '')
        setConfigName(config.config_name || '自定义名称')
        setIsInitialized(true)
        return
      }

      // 否则从后端获取最近配置
      try {
        const result = await getLatestConfig() as { success: boolean; data?: any }
        if (result.success && result.data && isMounted) {
          const data = result.data
          // 优先使用 provider 字段，否则通过 model_name 推断
          if (data.provider) {
            setProvider(data.provider as 'qwen' | 'openai')
          } else {
            const model = data.model_name || 'qwen-max'
            setProvider(model.startsWith('qwen') ? 'qwen' : 'openai')
          }
          setModelName(data.model_name || 'qwen-max')
          setApiKey(data.api_key || '')
          setConfigName(data.config_name || '自定义名称')
          setConfig(data)
        }
      } catch (error) {
        console.error('加载配置失败:', error)
      }
      if (isMounted) {
        setIsInitialized(true)
      }
    }
    fetchConfig()
    return () => { isMounted = false }
  }, [])

  // 获取已保存的配置列表
  const fetchSavedConfigs = async () => {
    try {
      const result = await getConfigList() as { success: boolean; data?: SavedConfig[] }
      if (result.success && result.data) {
        setSavedConfigs(result.data)
      }
    } catch (error) {
      console.error('获取配置列表失败:', error)
    }
  }

  // 保存配置
  const handleSave = async () => {
    if (!configName.trim()) {
      setSaveMessage('请输入配置名称')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const result = await saveConfig(modelName, apiKey, configName, provider) as { success: boolean }
      if (result.success) {
        setSaveMessage('保存成功')
        setConfig({ model_name: modelName, api_key: apiKey, config_name: configName, provider: provider })
      } else {
        setSaveMessage('保存失败')
      }
    } catch (error) {
      setSaveMessage('保存失败')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  // 打开导入弹窗
  const handleImportClick = () => {
    fetchSavedConfigs()
    setShowImportModal(true)
  }

  // 选择配置
  const handleSelectConfig = async (savedConfig: SavedConfig) => {
    try {
      const result = await loadConfig(savedConfig.file_name) as { success: boolean; data?: any }
      if (result.success && result.data) {
        const data = result.data
        // 优先使用 provider 字段，否则通过 model_name 推断
        if (data.provider) {
          setProvider(data.provider as 'qwen' | 'openai')
        } else {
          const model = data.model_name || 'qwen-max'
          setProvider(model.startsWith('qwen') ? 'qwen' : 'openai')
        }
        setModelName(data.model_name || 'qwen-max')
        setApiKey(data.api_key || '')
        setConfigName(data.config_name || savedConfig.config_name)
        setConfig(data)
        setSaveMessage(`已加载配置: ${savedConfig.config_name}`)
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
    setShowImportModal(false)
  }

  // 删除配置
  const handleDeleteConfig = async (e: React.MouseEvent, savedConfig: SavedConfig) => {
    e.stopPropagation()
    try {
      const result = await deleteConfig(savedConfig.file_name) as { success: boolean }
      if (result.success) {
        setSaveMessage(`配置 "${savedConfig.config_name}" 已删除`)
        // 刷新配置列表
        fetchSavedConfigs()
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('删除配置失败:', error)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">基础配置</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* 配置名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            配置名称
          </label>
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="输入配置名称"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            用于标识和区分不同的配置方案
          </p>
        </div>

        {/* 供应商选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模型供应商
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as 'qwen' | 'openai')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            选择要使用的大语言模型供应商
          </p>
        </div>

        {/* 模型选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模型名称
          </label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getModels().map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            选择具体的模型版本
          </p>
        </div>

        {/* API Key 输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入 API Key"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            输入用于调用大模型的 API 密钥
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={handleImportClick}
            className="px-6 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            导入配置
          </button>
          {saveMessage && (
            <span
              className={`text-sm ${
                saveMessage.includes('成功') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      {/* 配置说明 */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">配置说明</h3>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• 配置名称：用于标识不同配置方案</li>
          <li>• 模型供应商：选择通义千问 (Qwen) 或 OpenAI</li>
          <li>• 模型名称：选择具体使用的模型版本</li>
          <li>• API Key：用于调用模型的密钥，请妥善保管</li>
          <li>• 配置会保存到本地，下次启动时自动加载</li>
          <li>• 导入配置：从已保存的配置列表中选择</li>
        </ul>
      </div>

      {/* 终端输出面板 */}
      <div className="mt-6">
        <TerminalPanel
          logs={terminalLogs.config}
          onClear={() => clearLogs('config')}
        />
      </div>

      {/* 导入配置弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">选择配置</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {savedConfigs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无保存的配置</p>
              ) : (
                <div className="space-y-2">
                  {savedConfigs.map((cfg) => (
                    <div
                      key={cfg.file_name}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex justify-between items-center"
                    >
                      <div
                        onClick={() => handleSelectConfig(cfg)}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-gray-800">{cfg.config_name}</div>
                        <div className="text-sm text-gray-500">{cfg.model_name}</div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConfig(e, cfg)}
                        className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="删除配置"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigPage
