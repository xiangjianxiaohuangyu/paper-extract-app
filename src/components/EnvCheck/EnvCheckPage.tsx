import { useAppStore } from '@/stores/appStore'
import { checkEnv } from '@/api'
import TerminalPanel from '@/components/Terminal'

function EnvCheckPage() {
  const {
    envCheckResult,
    isChecking,
    setEnvCheckResult,
    setChecking,
    terminalLogs,
    clearLogs,
  } = useAppStore()

  // 检测环境
  const handleCheck = async () => {
    setChecking(true)
    setEnvCheckResult(null)

    try {
      const result = await checkEnv()
      if (result.success) {
        setEnvCheckResult(result.data)
      }
    } catch (error) {
      console.error('检测失败:', error)
    } finally {
      setChecking(false)
    }
  }

  // 渲染状态图标
  const renderStatusIcon = (status?: string) => {
    switch (status) {
      case 'ok':
        return <span className="text-green-500">✓</span>
      case 'warning':
        return <span className="text-yellow-500">⚠</span>
      case 'error':
        return <span className="text-red-500">✗</span>
      default:
        return <span className="text-gray-400">-</span>
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">环境检测</h2>

      {/* 检测按钮 */}
      <button
        onClick={handleCheck}
        disabled={isChecking}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          isChecking
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isChecking ? '检测中...' : '检测环境'}
      </button>

      {/* 检测结果展示 */}
      {envCheckResult && (
        <div className="mt-6 space-y-4">
          {/* Python 版本 */}
          {envCheckResult.python && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Python 环境</h3>
                {renderStatusIcon(envCheckResult.python.status)}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>版本: {envCheckResult.python.version}</p>
                <p>状态: {envCheckResult.python.message}</p>
              </div>
            </div>
          )}

          {/* 依赖包 */}
          {envCheckResult.dependencies && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Python 依赖
              </h3>
              <div className="space-y-2">
                {Object.entries(envCheckResult.dependencies).map(
                  ([name, info]: [string, any]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{name}</span>
                      <div className="flex items-center gap-2">
                        {info.installed ? (
                          <>
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-500">
                              v{info.version || 'unknown'}
                            </span>
                          </>
                        ) : (
                          <span className="text-red-500">✗ 未安装</span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* API 连接 */}
          {envCheckResult.api_connection && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">API 连接</h3>
                {renderStatusIcon(envCheckResult.api_connection.status)}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>状态: {envCheckResult.api_connection.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 初始提示 */}
      {!envCheckResult && !isChecking && (
        <div className="mt-6 text-center text-gray-500">
          <p>点击上方按钮开始检测环境</p>
        </div>
      )}

      {/* 终端输出面板 */}
      <div className="mt-6">
        <TerminalPanel
          logs={terminalLogs.env}
          onClear={() => clearLogs('env')}
        />
      </div>
    </div>
  )
}

export default EnvCheckPage
