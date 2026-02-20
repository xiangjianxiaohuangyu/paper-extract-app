import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { saveConfig, loadConfig, getConfigList, deleteConfig, getLatestConfig, testConnection } from '@/api'
import TerminalPanel from '@/components/Terminal'

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
}

function ConfigPage() {
  const {config, setConfig, terminalLogs, clearLogs } = useAppStore()
  const [provider, setProvider] = useState<'qwen' | 'openai' | 'other' | ''>(config.provider as 'qwen' | 'openai' | 'other' | '' || 'other')
  const [modelName, setModelName] = useState(config.model_name || '')
  const [apiKey, setApiKey] = useState(config.api_key || '')
  const [configName, setConfigName] = useState(config.config_name || '')
  const [baseUrl, setBaseUrl] = useState(config.base_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testMessage, setTestMessage] = useState('')

  // 高级设置状态
  const [temperature, setTemperature] = useState(0.1)
  const [maxTokens, setMaxTokens] = useState(10000)
  const [overlap, setOverlap] = useState(500)

  // 根据供应商获取模型列表
  const getModels = () => {
    if (provider === 'qwen') return QWEN_MODELS
    if (provider === 'openai') return OPENAI_MODELS
    return []  // other 需要手动输入模型名
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
      // 加载已保存的配置列表（用于检测重复）
      fetchSavedConfigs()

      // 优先从后端获取最近配置
      try {
        const result = await getLatestConfig() as { success: boolean; data?: any }
        if (result.success && result.data && isMounted) {
          const data = result.data
          // 从后端加载配置
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

      // 后端没有配置时，使用本地存储或默认值
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

  // 保存配置
  const handleSave = async () => {
    // 验证配置名称
    if (!configName.trim()) {
      setSaveMessage('请输入配置名称')
      return
    }

    // 验证模型名称
    if (!modelName.trim()) {
      setSaveMessage('请输入模型名称')
      return
    }

    // 验证 base url
    if (!baseUrl.trim()) {
      setSaveMessage('请输入 Base Url')
      return
    }

    // 验证 API Key
    if (!apiKey.trim()) {
      setSaveMessage('请输入 API Key')
      return
    }

    // 检查是否存在同名配置
    const configNameTrimmed = configName.trim()
    // console.log('保存配置检查 - 当前配置名:', configNameTrimmed, '已保存列表:', savedConfigs)
    const existingConfig = savedConfigs.find(cfg => cfg.config_name === configNameTrimmed)
    if (existingConfig) {
      console.log('检测到重复配置:', existingConfig)
      // 存在同名配置，弹窗确认
      setShowConfirmModal(true)
      return
    }

    // 不存在同名配置，直接保存
    await doSave(configNameTrimmed)
  }

  // 执行实际保存操作
  const doSave = async (saveConfigName: string) => {
    setShowConfirmModal(false)
    setIsSaving(true)
    setSaveMessage('')

    try {
      const result = await saveConfig(modelName, apiKey, saveConfigName, provider, baseUrl, temperature, maxTokens, overlap) as { success: boolean }
      if (result.success) {
        setSaveMessage('保存成功')
        setConfig({ model_name: modelName, api_key: apiKey, config_name: saveConfigName, provider: provider, base_url: baseUrl, temperature: temperature, max_tokens: maxTokens, overlap: overlap })
        // 刷新配置列表
        fetchSavedConfigs()
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
          setProvider(data.provider as 'qwen' | 'openai' | 'other')
        } else {
          setProvider('other')
        }
        setModelName(data.model_name || '')
        setApiKey(data.api_key || '')
        setBaseUrl(data.base_url || '')
        setConfigName(data.config_name || savedConfig.config_name)
        // 加载高级设置
        if (data.temperature !== undefined) setTemperature(data.temperature)
        if (data.max_tokens !== undefined) setMaxTokens(data.max_tokens)
        if (data.overlap !== undefined) setOverlap(data.overlap)
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

  // 测试连通性
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestMessage('请先输入 API Key')
      return
    }

    if (!baseUrl.trim()) {
      setTestMessage('请先填写 API 端点')
      return
    }

    setIsTesting(true)
    setTestMessage('')

    try {
      const result = await testConnection(modelName, apiKey, provider, baseUrl) as { success: boolean; message: string }
      if (result.success) {
        setTestMessage('✓ 连接成功')
      } else {
        setTestMessage(`✗ ${result.message}`)
      }
    } catch (error) {
      setTestMessage('✗ 测试失败: 网络错误')
    } finally {
      setIsTesting(false)
      setTimeout(() => setTestMessage(''), 5000)
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
          {provider === 'other' ? (
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="请输入模型名称，如 gpt-4o"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
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
          )}
          <p className="mt-1 text-sm text-gray-500">
            {provider === 'other' ? '请输入要使用的模型名称' : '选择具体的模型版本'}
          </p>
        </div>

        {/* Base URL 输入 - 始终显示 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API 端点 (Base URL)
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            {provider === 'other' ? '请输入自定义 API 服务的 base URL 地址' : 'API 端点地址（自动填充）'}
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

        {/* 高级设置 - 滑块样式 */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-medium text-gray-700">高级设置</h3>

          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600">
                Temperature (温度)
              </label>
              <span className="text-sm font-medium text-blue-600">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              越小越保守/确定性越高，越大越随机/创造性越强。影响论文解析结果的一致性。
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600">
                Max Tokens (分块大小)
              </label>
              <span className="text-sm font-medium text-blue-600">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="3000"
              max="30000"
              step="1000"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              越小处理越快但可能遗漏信息，越大信息越完整但处理变慢。影响单次处理的文本长度。
            </p>
          </div>

          {/* Overlap */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600">
                Overlap (重叠 Token)
              </label>
              <span className="text-sm font-medium text-blue-600">{overlap}</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={overlap}
              onChange={(e) => setOverlap(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              越小可能丢失边界信息，越大信息保留越完整但有重复。影响相邻分块之间的重叠区域。
            </p>
          </div>
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
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isTesting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTesting ? '测试中...' : '测试连通性'}
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
          {testMessage && (
            <span
              className={`text-sm ${
                testMessage.includes('✓') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {testMessage}
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

      {/* 确认更新配置弹窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">确认更新</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                配置名称 "{configName}" 已存在，是否确认更新？
              </p>
              <p className="text-sm text-gray-500 mb-4">
                更新后将覆盖原有配置。
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => doSave(configName.trim())}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
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
