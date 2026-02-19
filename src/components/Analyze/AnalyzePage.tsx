import { useState } from 'react'
import { useAppStore, FileItem } from '@/stores/appStore'
import { analyzePdf } from '@/api'
import TerminalPanel from '@/components/Terminal'

// 声明 electronAPI 类型
declare global {
  interface Window {
    electronAPI?: {
      selectFiles: () => Promise<FileItem[]>
      scanDirectory: (dirPath: string) => Promise<FileItem[]>
      isDirectory: (filePath: string) => Promise<boolean>
      selectDirectory: () => Promise<string | null>
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

  // 点击选择文件
  const handleClickSelect = () => {
    handleFileSelect()
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
    console.log('[AnalyzePage] handleAnalyze 开始执行')
    console.log('[AnalyzePage] selectedFiles:', selectedFiles)
    console.log('[AnalyzePage] savePath:', savePath)

    if (selectedFiles.length === 0) {
      console.log('[AnalyzePage] 没有选择文件，直接返回')
      return
    }

    setAnalyzing(true)
    setAnalyzeResult(null)

    try {
      const filePaths = selectedFiles.map((f) => f.path)
      console.log('[AnalyzePage] 调用 analyzePdf，filePaths:', filePaths)
      const result = await analyzePdf(filePaths, extractFields, savePath || undefined, saveFormat)
      console.log('[AnalyzePage] analyzePdf 返回结果:', result)
      setAnalyzeResult(result)
    } catch (error) {
      console.error('[AnalyzePage] 解析失败:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // 选择保存目录
  const handleSelectSavePath = () => {
    console.log('点击选择目录按钮', window.electronAPI)

    // 优先使用 Electron API
    if (window.electronAPI && window.electronAPI.selectDirectory) {
      console.log('使用 Electron API')
      window.electronAPI.selectDirectory().then((dirPath: string | null) => {
        console.log('选择的路径:', dirPath)
        if (dirPath) {
          setSavePath(dirPath)
        }
      })
      return
    }

    console.log('使用浏览器降级处理')
    // 降级处理：使用原生 input 元素
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        // 由于浏览器安全限制，无法获取完整路径，这里使用提示
        setSavePath('已选择文件夹（请在保存路径中查看）')
      }
    }
    input.click()
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">文章解析</h2>

      {/* PDF 拖拽/点击选择区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickSelect}
      >
        <div className="text-gray-500">
          <p className="text-4xl mb-2">📄</p>
          <p className="text-lg font-medium">
            拖拽 PDF 文件到此处，或点击选择
          </p>
          <p className="text-sm mt-1">支持 PDF 格式</p>
        </div>
      </div>

      {/* 文件列表展示 */}
      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-700">
              已选择文件 ({selectedFiles.length})
            </h3>
            <button
              onClick={clearFiles}
              className="text-sm text-red-500 hover:text-red-600"
            >
              清空全部
            </button>
          </div>
          <ul className="space-y-2">
            {selectedFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2"
              >
                <span className="text-gray-700 truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-red-500 ml-2"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 提取字段配置 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">提取字段</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {extractFields.map((field) => (
            <span
              key={field}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
            >
              {field}
              <button
                onClick={() => handleRemoveField(field)}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddField()}
            placeholder="添加自定义字段"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddField}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            添加
          </button>
        </div>
      </div>

      {/* 保存路径设置 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">保存路径</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={savePath}
            readOnly
            placeholder="请选择保存目录"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
          <button
            type="button"
            onClick={handleSelectSavePath}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            选择目录
          </button>
        </div>
      </div>

      {/* 保存格式设置 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">保存格式</h3>
        <div className="flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="saveFormat"
              value="json"
              checked={saveFormat === 'json'}
              onChange={(e) => setSaveFormat(e.target.value)}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">JSON</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="saveFormat"
              value="excel"
              checked={saveFormat === 'excel'}
              onChange={(e) => setSaveFormat(e.target.value)}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Excel</span>
          </label>
        </div>
      </div>

      {/* 开始解析按钮 */}
      <button
        onClick={handleAnalyze}
        disabled={selectedFiles.length === 0 || isAnalyzing || !savePath}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          selectedFiles.length === 0 || isAnalyzing || !savePath
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isAnalyzing ? '解析中...' : '开始解析'}
      </button>

      {/* 解析结果提示 */}
      {analyzeResult && analyzeResult.success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">解析完成</p>
          {analyzeResult.message && analyzeResult.message.includes('已保存至') && (
            <p className="text-green-600 text-sm mt-1">{analyzeResult.message}</p>
          )}
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
