import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { saveConfig, loadConfig } from '@/api'
import TerminalPanel from '@/components/Terminal'

// 模型选项
const MODEL_OPTIONS = [
  { value: 'qwen-max', label: 'qwen-max (推荐)' },
  { value: 'qwen-plus', label: 'qwen-plus' },
  { value: 'qwen-turbo', label: 'qwen-turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
]

function ConfigPage() {
  const { config, setConfig, terminalLogs, clearLogs } = useAppStore()
  const [modelName, setModelName] = useState(config.model_name)
  const [apiKey, setApiKey] = useState(config.api_key)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // 页面初始化时加载配置
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const result = await loadConfig()
        if (result.success && result.data) {
          setModelName(result.data.model_name || 'qwen-max')
          setApiKey(result.data.api_key || '')
          setConfig(result.data)
        }
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    }
    fetchConfig()
  }, [setConfig])

  // 保存配置
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      const result = await saveConfig(modelName, apiKey)
      if (result.success) {
        setSaveMessage('保存成功')
        setConfig({ model_name: modelName, api_key: apiKey })
      } else {
        setSaveMessage('保存失败')
      }
    } catch (error) {
      setSaveMessage('保存失败')
    } finally {
      setIsSaving(false)

      // 3秒后清除消息
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">基础配置</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* 模型名称选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模型名称
          </label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            选择用于字段提取的大语言模型
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

        {/* 保存按钮 */}
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
          <li>• 模型名称：选择要使用的大语言模型</li>
          <li>• API Key：用于调用模型的密钥，请妥善保管</li>
          <li>• 配置会保存到本地，下次启动时自动加载</li>
        </ul>
      </div>

      {/* 终端输出面板 */}
      <div className="mt-6">
        <TerminalPanel
          logs={terminalLogs.config}
          onClear={() => clearLogs('config')}
        />
      </div>
    </div>
  )
}

export default ConfigPage
