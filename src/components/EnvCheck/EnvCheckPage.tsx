import { useAppStore } from '@/stores/appStore'
import { checkEnv } from '@/api'
import TerminalPanel from '@/components/Terminal'
import { CheckCircle, AlertTriangle, XCircle, CircleDashed, Terminal } from 'lucide-react'

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
        return <CheckCircle className="w-5 h-5 text-state-success" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-state-warning" />
      case 'error':
        return <XCircle className="w-5 h-5 text-state-error" />
      default:
        return <CircleDashed className="w-5 h-5 text-text-muted" />
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">环境检测</h2>

      {/* 检测按钮 */}
      <button
        onClick={handleCheck}
        disabled={isChecking}
        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
          isChecking
            ? 'bg-gray-200 text-text-muted cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {isChecking ? (
          <>
            <CircleDashed className="w-5 h-5 animate-spin" />
            检测中...
          </>
        ) : (
          <>
            <Terminal className="w-5 h-5" />
            检测环境
          </>
        )}
      </button>

      {/* 检测结果展示 */}
      {envCheckResult && (
        <div className="mt-6 space-y-4">
          {/* Python 版本 */}
          {envCheckResult.python && (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-text-secondary">Python 环境</h3>
                {renderStatusIcon(envCheckResult.python.status)}
              </div>
              <div className="mt-2 text-sm text-text-secondary">
                <p>版本: <span className="font-mono text-text-primary">{envCheckResult.python.version}</span></p>
                <p>状态: {envCheckResult.python.message}</p>
              </div>
            </div>
          )}

          {/* 依赖包 */}
          {envCheckResult.dependencies && (
            <div className="card p-4">
              <h3 className="text-base font-medium text-text-secondary mb-3">
                Python 依赖
              </h3>
              <div className="space-y-2">
                {Object.entries(envCheckResult.dependencies).map(
                  ([name, info]: [string, any]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-text-primary font-mono">{name}</span>
                      <div className="flex items-center gap-2">
                        {info.installed ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-state-success" />
                            <span className="text-text-muted">
                              v{info.version || 'unknown'}
                            </span>
                          </>
                        ) : (
                          <span className="text-state-error flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            未安装
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 初始提示 */}
      {!envCheckResult && !isChecking && (
        <div className="mt-6 text-center text-text-muted">
          <Terminal className="w-12 h-12 mx-auto mb-3 opacity-30" />
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
