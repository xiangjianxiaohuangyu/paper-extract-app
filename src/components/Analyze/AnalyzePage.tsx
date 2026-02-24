import { useState } from 'react'
import { useAppStore, FileItem } from '@/stores/appStore'
import { analyzePdf, testConnection } from '@/api'
import TerminalPanel from '@/components/Terminal'
import AnalyzeProgressPanel from './AnalyzeProgressPanel'
import { Upload, FileText, X, FolderOpen, Play, CheckCircle, Trash2 } from 'lucide-react'

// 声明 electronAPI 类型
declare global {
  interface Window {
    electronAPI?: {
      selectFiles: () => Promise<FileItem[]>
      scanDirectory: (dirPath: string) => Promise<FileItem[]>
      isDirectory: (filePath: string) => Promise<boolean>
      selectDirectory: () => Promise<string | null>
      openExternal: (url: string) => Promise<void>
    }
  }
}

function AnalyzePage() {
  const [isDragging, setIsDragging] = useState(false)
  const [newField, setNewField] = useState('')

  const {
    selectedFiles,
    extractFields,
    setExtractFields,
    savePath,
    setSavePath,
    saveFormat,
    setSaveFormat,
    addFiles,
    removeFile,
    clearFiles,
    isAnalyzing,
    setAnalyzing,
    analyzeResult,
    setAnalyzeResult,
    terminalLogs,
    clearLogs,
    config,
    showToast,
  } = useAppStore()

  // 处理文件选择（使用 Electron API 支持文件夹）
  const handleFileSelect = async () => {
    if (!window.electronAPI) {
      console.error('Electron API 不可用')
      return
    }

    const files = await window.electronAPI.selectFiles()

    if (files.length > 0) {
      const fileItems = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        path: file.path,
        size: file.size,
      }))
      addFiles(fileItems)
    }
  }

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    const fileItems: FileItem[] = []

    // 检查是否支持 Electron API
    if (window.electronAPI) {
      const fileArray = Array.from(files)

      for (const file of fileArray) {
        const filePath = (file as any).path

        if (!filePath) continue

        // 检查是否为文件夹
        const isDir = await window.electronAPI.isDirectory(filePath)

        if (isDir) {
          // 如果是文件夹，递归扫描其中的 PDF
          const pdfFiles = await window.electronAPI.scanDirectory(filePath)
          fileItems.push(
            ...pdfFiles.map((f) => ({
              id: Math.random().toString(36).substring(7),
              name: f.name,
              path: f.path,
              size: f.size,
            }))
          )
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
          // 如果是 PDF 文件
          fileItems.push({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            path: filePath,
            size: file.size,
          })
        }
      }
    } else {
      // 降级处理：不支持文件夹拖拽
      const fallbackItems = Array.from(files)
        .filter((file) => file.name.toLowerCase().endsWith('.pdf'))
        .map((file) => ({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          path: (file as any).path || file.name,
          size: file.size,
        }))
      fileItems.push(...fallbackItems)
    }

    if (fileItems.length > 0) {
      addFiles(fileItems)
    }
  }

  // 添加自定义字段
  const handleAddField = () => {
    if (newField.trim() && !extractFields.includes(newField.trim())) {
      setExtractFields([...extractFields, newField.trim()])
      setNewField('')
    }
  }

  // 移除字段
  const handleRemoveField = (field: string) => {
    setExtractFields(extractFields.filter((f) => f !== field))
  }

  // 开始解析
  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      return
    }

    setAnalyzing(true)
    setAnalyzeResult(null)

    try {
      // 先测试连通性
      const testResult = await testConnection(config.model_name || '', config.api_key || '', config.provider || 'other', config.base_url || '') as { success: boolean; message?: string }
      if (!testResult.success) {
        showToast('API 连接失败，请在-基础配置-中测试连通性', 'error')
        setAnalyzing(false)
        return
      }

      const filePaths = selectedFiles.map((f) => f.path)
      const result = await analyzePdf(filePaths, extractFields, savePath || undefined, saveFormat) as { success: boolean; message?: string }
      setAnalyzeResult(result)
      if (result.success) {
        showToast(result.message || '解析成功', 'success')
      } else {
        showToast(result.message || '解析失败，详情查看日志输出', 'error')
      }
    } catch (error) {
      console.error('[AnalyzePage] 解析失败:', error)
      showToast('解析失败，详情查看日志输出', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  // 选择保存目录
  const handleSelectSavePath = () => {
    if (window.electronAPI && window.electronAPI.selectDirectory) {
      window.electronAPI.selectDirectory().then((dirPath: string | null) => {
        if (dirPath) {
          setSavePath(dirPath)
        }
      })
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        setSavePath('已选择文件夹（请在保存路径中查看）')
      }
    }
    input.click()
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">文章解析</h2>

      {/* PDF 拖拽/点击选择区域 */}
      <div
        className={`card p-8 mb-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-accent-primary bg-accent-light'
            : 'border-dashed border-gray-200 hover:border-accent-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <div className="text-text-secondary">
          <Upload className="w-10 h-10 mx-auto mb-3 text-accent-primary" />
          <p className="font-medium">
            拖拽 PDF 文件到此处，或点击选择
          </p>
          <p className="text-sm mt-1 text-text-muted">支持 PDF 格式</p>
        </div>
      </div>

      {/* 文件列表展示 */}
      {selectedFiles.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-text-secondary">
              已选择文件 ({selectedFiles.length})
            </h3>
            <button
              onClick={clearFiles}
              className="text-xs text-state-error hover:text-state-error/80 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              清空全部
            </button>
          </div>
          <ul className="space-y-2">
            {selectedFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between px-3 py-2 bg-bg-primary rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="text-text-primary truncate text-sm">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-text-muted hover:text-state-error ml-2 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 提取字段配置 */}
      <div className="card p-4 mb-6">
        <h3 className="text-sm font-medium text-text-secondary mb-3">提取字段</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {extractFields.map((field) => (
            <span
              key={field}
              className="tag"
            >
              {field}
              <button
                onClick={() => handleRemoveField(field)}
                className="hover:text-accent-hover ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
            placeholder="添加自定义字段"
            className="input"
          />
          <button
            onClick={handleAddField}
            className="btn-secondary"
          >
            添加
          </button>
        </div>
      </div>

      {/* 保存路径设置 */}
      <div className="card p-4 mb-6">
        <h3 className="text-sm font-medium text-text-secondary mb-3">保存路径</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={savePath}
            readOnly
            placeholder="请选择保存目录"
            className="input bg-bg-primary"
          />
          <button
            type="button"
            onClick={handleSelectSavePath}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
            <FolderOpen className="w-4 h-4" />
            选择目录
          </button>
        </div>
      </div>

      {/* 保存格式 */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">保存格式</h3>
        <div className="flex gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="saveFormat"
              value="json"
              checked={saveFormat === 'json'}
              onChange={(e) => setSaveFormat(e.target.value)}
              className="w-4 h-4 text-accent-primary"
            />
            <span className="text-text-primary text-sm">JSON</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="saveFormat"
              value="excel"
              checked={saveFormat === 'excel'}
              onChange={(e) => setSaveFormat(e.target.value)}
              className="w-4 h-4 text-accent-primary"
            />
            <span className="text-text-primary text-sm">Excel</span>
          </label>
        </div>
      </div>

      {/* 当前配置 */}
      <div className="card p-4 mb-6">
        <h3 className="text-sm font-medium text-text-secondary mb-3">当前配置</h3>
        <div className="text-xs text-text-muted space-y-0.5">
          <p>配置名称: {config.config_name || '未设置'}</p>
          <p>模型: {config.model_name || '未设置'}</p>
          <p>提供商: {config.provider || '未设置'}</p>
          <p>API 端点: {config.base_url || '未设置'}</p>
          <p>Temperature: {config.temperature ?? '未设置'}</p>
          <p>Max Tokens: {config.max_tokens ?? '未设置'}</p>
          <p>Overlap: {config.overlap ?? '未设置'}</p>
        </div>
      </div>

      {/* 开始解析按钮 */}
      <button
        onClick={handleAnalyze}
        disabled={selectedFiles.length === 0 || isAnalyzing || !savePath}
        className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          selectedFiles.length === 0 || isAnalyzing || !savePath
            ? 'bg-gray-200 text-text-muted cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            解析中...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            开始解析
          </>
        )}
      </button>

      {/* 解析进度面板 */}
      <AnalyzeProgressPanel />

      {/* 解析结果提示 - 成功 */}
      {analyzeResult && analyzeResult.success && (
        <div className="mt-4 p-4 bg-state-success/10 border border-state-success/20 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-state-success" />
          <div>
            <p className="text-state-success font-medium">解析完成</p>
            {analyzeResult.message && analyzeResult.message.includes('已保存至') && (
              <p className="text-state-success/80 text-sm mt-0.5">{analyzeResult.message}</p>
            )}
          </div>
        </div>
      )}

      {/* 终端输出面板 */}
      <div className="mt-6">
        <TerminalPanel
          logs={terminalLogs.analyze}
          onClear={() => clearLogs('analyze')}
        />
      </div>
    </div>
  )
}

export default AnalyzePage
