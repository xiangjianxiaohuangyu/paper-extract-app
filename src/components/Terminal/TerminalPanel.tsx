import { useEffect, useRef } from 'react'
import { Terminal as TerminalIcon, Trash2 } from 'lucide-react'

interface TerminalPanelProps {
  logs: string[]
  onClear: () => void
}

function TerminalPanel({ logs, onClear }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="bg-terminal-bg rounded-xl overflow-hidden border border-terminal-border">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-terminal-header border-b border-terminal-border">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-terminal-muted" />
          <span className="text-sm text-terminal-muted">终端输出</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-terminal-muted hover:text-terminal-text px-2 py-1 rounded hover:bg-terminal-border transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          清空
        </button>
      </div>

      {/* 日志内容 */}
      <div
        ref={terminalRef}
        className="h-88 overflow-y-auto p-4 font-mono text-sm"
        style={{ color: '#E2E8F0' }}
      >
        {logs.length === 0 ? (
          <span className="text-terminal-muted">等待日志...</span>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="leading-relaxed whitespace-pre-wrap">
              <span className="text-terminal-muted">› </span>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TerminalPanel
