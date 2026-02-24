import { useAppStore } from '@/stores/appStore'

export default function AnalyzeProgressPanel() {
  const analyzeProgress = useAppStore((state) => state.analyzeProgress)
  const isAnalyzing = useAppStore((state) => state.isAnalyzing)

  // 非解析状态且没有进度时不显示
  if (!isAnalyzing && !analyzeProgress) {
    return null
  }

  // 解析已完成且进度为100%时隐藏
  if (!isAnalyzing && analyzeProgress?.progress === 100) {
    return null
  }

  const stepLabels: Record<string, string> = {
    starting: '准备开始...',
    parsing: '解析 PDF',
    estimating: '预估 Token',
    chunking: '分块处理',
    extracting: '提取字段',
    merging: '合并结果',
    saving: '保存结果',
    complete: '文件完成',
    finished: '解析完成',
    error: '解析失败',
  }

  const currentStep = analyzeProgress?.currentStep || 'starting'
  const progress = parseFloat(((analyzeProgress?.progress) || 0).toFixed(1))

  return (
    <div className="mt-4 p-4 bg-bg-secondary rounded-lg border border-border">
      {/* 文件名和进度 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-secondary">
          {analyzeProgress?.currentFile
            ? `正在解析: ${analyzeProgress.currentFile}`
            : '准备解析...'}
        </span>
        {analyzeProgress && analyzeProgress.totalFiles > 0 && (
          <span className="text-xs text-text-muted">
            已完成 {analyzeProgress.currentFileIndex-1}/{analyzeProgress.totalFiles} 个 PDF
          </span>
        )}
      </div>

      {/* 当前步骤 */}
      <div className="text-sm text-text-primary mb-3">
        {stepLabels[currentStep] || currentStep}
      </div>

      {/* 进度条 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 百分比 */}
      <div className="text-right text-xs text-text-muted mt-1">
        {progress}%
      </div>
    </div>
  )
}
