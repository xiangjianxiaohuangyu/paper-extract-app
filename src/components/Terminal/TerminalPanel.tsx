import { useEffect, useRef } from 'react'

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
    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
        <span className="text-sm text-gray-400">终端输出</span>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-[#3d3d3d] transition-colors"
        >
          清空
        </button>
      </div>

      {/* 日志内容 */}
      <div
        ref={terminalRef}
        className="h-48 overflow-y-auto p-4 font-mono text-sm"
        style={{ color: '#e5e5e5' }}
      >
        {logs.length === 0 ? (
          <span className="text-gray-500">等待日志...</span>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="leading-relaxed">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TerminalPanel
