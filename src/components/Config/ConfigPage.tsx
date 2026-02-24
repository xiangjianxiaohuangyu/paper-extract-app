import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { saveConfig, loadConfig, getConfigList, deleteConfig, getLatestConfig, testConnection } from '@/api'
import TerminalPanel from '@/components/Terminal'
import { Settings, Upload, Trash2, X, Plug, Save } from 'lucide-react'

// 模型选项 - 按供应商分组
const PROVIDERS = [
  { value: 'qwen', label: '通义千问 (Qwen)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'other', label: '其他 (自定义 API)' },
]

const QWEN_MODELS = [
  { value: 'qwen-max', label: 'qwen-max (推荐)' },
  { value: 'qwen-plus', label: 'qwen-plus' },
  { value: 'qwen-turbo', label: 'qwen-turbo' },
  { value: 'qwen-long', label: 'qwen-long' },
  { value: 'qwen1.5-110b-chat', label: 'qwen1.5-110b-chat' },
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
  provider?: string
  base_url?: string
  temperature?: number
  max_tokens?: number
  overlap?: number
  updated_at?: string
}

function ConfigPage() {
  const {config, setConfig, terminalLogs, clearLogs, showToast } = useAppStore()
  const [provider, setProvider] = useState<'qwen' | 'openai' | 'other' | ''>(config.provider as 'qwen' | 'openai' | 'other' | '' || 'other')
  const [modelName, setModelName] = useState(config.model_name || '')
  const [apiKey, setApiKey] = useState(config.api_key || '')
  const [configName, setConfigName] = useState(config.config_name || '')
  const [baseUrl, setBaseUrl] = useState(config.base_url || '')
  const [isSaving, setIsSaving] = useState(false)
  // 使用全局 toast 替代本地 saveMessage
  const [showImportModal, setShowImportModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // 高级设置状态
  const [temperature, setTemperature] = useState(0.1)
  const [maxTokens, setMaxTokens] = useState(10000)
  const [overlap, setOverlap] = useState(500)

  // 根据供应商获取模型列表
  const getModels = () => {
    if (provider === 'qwen') return QWEN_MODELS
    if (provider === 'openai') return OPENAI_MODELS
    return []
  }

  // 处理供应商变更
  const handleProviderChange = (newProvider: 'qwen' | 'openai' | 'other') => {
    setProvider(newProvider)
    if (newProvider === 'qwen') {
      setModelName(QWEN_MODELS[0].value)
      setBaseUrl('https://dashscope.aliyuncs.com/compatible-mode/v1')
    } else if (newProvider === 'openai') {
      setModelName(OPENAI_MODELS[0].value)
      setBaseUrl('https://api.openai.com/v1')
    } else {
      setModelName('')
      setBaseUrl('')
    }
  }

  // 页面初始化时加载配置
  useEffect(() => {
    let isMounted = true
    const fetchConfig = async () => {
      fetchSavedConfigs()

      try {
        const result = await getLatestConfig() as { success: boolean; data?: any }
        if (result.success && result.data && isMounted) {
          const data = result.data
          if (data.provider) {
            setProvider(data.provider as 'qwen' | 'openai' | 'other')
          } else {
            setProvider('other')
          }
          setModelName(data.model_name || '')
          setApiKey(data.api_key || '')
          setConfigName(data.config_name || '')
          setBaseUrl(data.base_url || '')
          setTemperature(data.temperature || 0.1)
          setMaxTokens(data.max_tokens || 10000)
          setOverlap(data.overlap || 500)
          setConfig(data)
          setIsInitialized(true)
          return
        }
      } catch (error) {
        console.error('加载配置失败:', error)
      }

      if (config.api_key) {
        setProvider(config.provider as 'qwen' | 'openai' | 'other' || 'other')
        setModelName(config.model_name)
        setApiKey(config.api_key)
        setConfigName(config.config_name || '')
        setBaseUrl(config.base_url || '')
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

  // 处理配置名称输入，禁止输入空格和特殊字符
  const handleConfigNameChange = (value: string) => {
    // 过滤非法字符，保留字母、数字和 - _ .
    const safeValue = value
    setConfigName(safeValue)
  }

  // 保存配置
  // 验证必填字段
  const validateRequiredFields = (includeConfigName: boolean = true): boolean => {
    if (includeConfigName && !configName.trim()) {
      showToast('请输入配置名称', 'error')
      return false
    }
    if (!modelName.trim()) {
      showToast('请输入模型名称', 'error')
      return false
    }
    if (!baseUrl.trim()) {
      showToast('请输入 Base Url', 'error')
      return false
    }
    if (!apiKey.trim()) {
      showToast('请输入 API Key', 'error')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateRequiredFields(true)) {
      return
    }

    const configNameTrimmed = configName.trim()
    const existingConfig = savedConfigs.find(cfg => cfg.config_name === configNameTrimmed)
    if (existingConfig) {
      setShowConfirmModal(true)
      return
    }

    await doSave(configNameTrimmed)
  }

  // 执行实际保存操作
  const doSave = async (saveConfigName: string, showToastOnSuccess: boolean = true) => {
    setShowConfirmModal(false)
    setIsSaving(true)

    try {
      const result = await saveConfig(modelName, apiKey, saveConfigName, provider, baseUrl, temperature, maxTokens, overlap) as { success: boolean }
      if (result.success) {
        if (showToastOnSuccess) {
          showToast('保存成功', 'success')
        }
        setConfig({ model_name: modelName, api_key: apiKey, config_name: saveConfigName, provider: provider, base_url: baseUrl, temperature: temperature, max_tokens: maxTokens, overlap: overlap })
        fetchSavedConfigs()
      } else {
        showToast('保存失败', 'error')
      }
    } catch (error) {
      showToast('保存失败', 'error')
    } finally {
      setIsSaving(false)
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
        if (data.provider) {
          setProvider(data.provider as 'qwen' | 'openai' | 'other')
        } else {
          setProvider('other')
        }
        setModelName(data.model_name || '')
        setApiKey(data.api_key || '')
        setBaseUrl(data.base_url || '')
        setConfigName(data.config_name || savedConfig.config_name)
        if (data.temperature !== undefined) setTemperature(data.temperature)
        if (data.max_tokens !== undefined) setMaxTokens(data.max_tokens)
        if (data.overlap !== undefined) setOverlap(data.overlap)
        setConfig(data)
        showToast(`已加载配置: ${savedConfig.config_name}`, 'success')
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
        showToast(`配置 "${savedConfig.config_name}" 已删除`, 'success')
        fetchSavedConfigs()
      }
    } catch (error) {
      console.error('删除配置失败:', error)
    }
  }

  // 测试连通性
  const handleTestConnection = async () => {
    if (!validateRequiredFields(true)) {
      return
    }

    setIsTesting(true)

    try {
      const result = await testConnection(modelName, apiKey, provider, baseUrl) as { success: boolean; message: string }
      if (result.success) {
        // 测试成功后自动保存配置（不显示保存成功的toast）
        await doSave(configName.trim(), false)
        showToast('连接成功，已自动保存配置', 'success')
      } else {
        showToast('测试失败，详情查看日志输出', 'error')
      }
    } catch (error) {
      showToast('测试失败，详情查看日志输出', 'error')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">基础配置</h2>

      <div className="card p-6 space-y-6">
        {/* 配置名称 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            配置名称
          </label>
          <input
            type="text"
            value={configName}
            onKeyDown={(e) => {
              // 禁止输入空格
              if (e.key === ' ') {
                e.preventDefault()
                showToast('配置名称不能包含空格', 'error')
              }
            }}
            onChange={(e) => handleConfigNameChange(e.target.value)}
            placeholder="输入配置名称（仅支持字母、数字、-、_、.）"
            className="input"
          />
          <p className="mt-1 text-sm text-text-muted">
            用于标识和区分不同的配置方案
          </p>
        </div>

        {/* 供应商选择 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            模型供应商
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as 'qwen' | 'openai')}
            className="input"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-text-muted">
            选择要使用的大语言模型供应商
          </p>
        </div>

        {/* 模型选择 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            模型名称
          </label>
          {provider === 'other' ? (
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="请输入模型名称，如 gpt-4o"
              className="input"
            />
          ) : (
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="input"
            >
              {getModels().map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-sm text-text-muted">
            {provider === 'other' ? '请输入要使用的模型名称' : '选择具体的模型版本'}
          </p>
        </div>

        {/* Base URL 输入 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            API 端点 (Base URL)
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="input"
          />
          <p className="mt-1 text-sm text-text-muted">
            {provider === 'other' ? '请输入自定义 API 服务的 base URL 地址' : 'API 端点地址（自动填充）'}
          </p>
        </div>

        {/* API Key 输入 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入 API Key"
            className="input"
          />
          <p className="mt-1 text-sm text-text-muted">
            输入用于调用大模型的 API 密钥
          </p>
        </div>

        {/* 高级设置 */}
        <div className="bg-bg-primary p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-medium text-text-secondary">高级设置</h3>

          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-text-secondary">
                Temperature (温度)
              </label>
              <span className="text-sm font-medium text-accent-primary">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <p className="text-xs text-text-muted mt-1">
              越小越保守/确定性越高，越大越随机/创造性越强。
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-text-secondary">
                Max Tokens (分块大小)
              </label>
              <span className="text-sm font-medium text-accent-primary">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="3000"
              max="30000"
              step="1000"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <p className="text-xs text-text-muted mt-1">
              影响单次处理的文本长度。
            </p>
          </div>

          {/* Overlap */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-text-secondary">
                Overlap (重叠 Token)
              </label>
              <span className="text-sm font-medium text-accent-primary">{overlap}</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={overlap}
              onChange={(e) => setOverlap(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <p className="text-xs text-text-muted mt-1">
              影响相邻分块之间的重叠区域。
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={handleImportClick}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            导入配置
          </button>
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isTesting
                ? 'bg-gray-200 text-text-muted cursor-not-allowed'
                : 'bg-state-success text-white hover:bg-state-success/90'
            }`}
          >
            <Plug className="w-4 h-4" />
            {isTesting ? '测试中...' : '测试连通性'}
          </button>
        </div>
      </div>

      {/* 配置说明 */}
      <div className="card p-4 mt-6">
        <h3 className="text-sm font-medium text-text-secondary mb-2">配置说明</h3>
        <ul className="text-sm text-text-muted space-y-1">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-xl shadow-xl w-96 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                <Settings className="w-5 h-5" />
                导入配置
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {savedConfigs.length === 0 ? (
                <p className="text-text-muted text-center py-4">暂无保存的配置</p>
              ) : (
                <div className="space-y-2">
                  {savedConfigs.map((cfg) => (
                    <div
                      key={cfg.file_name}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-accent-light hover:border-accent-primary/30 transition-colors flex justify-between items-center"
                    >
                      <div
                        onClick={() => handleSelectConfig(cfg)}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-text-primary">{cfg.config_name}</div>
                        <div className="text-xs text-text-muted space-y-0.5">
                          <div>模型: {cfg.model_name}</div>
                          <div>Temperature: {cfg.temperature} | Max Tokens: {cfg.max_tokens} | Overlap: {cfg.overlap}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConfig(e, cfg)}
                        className="ml-2 p-1 text-text-muted hover:text-state-error hover:bg-state-error/10 rounded transition-colors"
                        title="删除配置"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 确认更新配置弹窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-xl shadow-xl w-96 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-medium text-text-primary">确认更新</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-text-secondary mb-4">
                配置名称 "{configName}" 已存在，是否确认更新？
              </p>
              <p className="text-sm text-text-muted mb-4">
                更新后将覆盖原有配置。
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-text-secondary hover:bg-bg-primary"
                >
                  取消
                </button>
                <button
                  onClick={() => doSave(configName.trim())}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? '保存中...' : '确认更新'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigPage
