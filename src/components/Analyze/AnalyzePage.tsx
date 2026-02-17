import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/appStore'
import { analyzePdf } from '@/api'
import TerminalPanel from '@/components/Terminal'

// 默认提取字段
const DEFAULT_FIELDS = ['title', 'authors', 'abstract', 'keywords']

function AnalyzePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [extractFields, setExtractFields] = useState<string[]>(DEFAULT_FIELDS)
  const [newField, setNewField] = useState('')

  const {
    selectedFiles,
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

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileItems = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      path: (file as any).path || file.name,
      size: file.size,
    }))

    addFiles(fileItems)

    // 清空 input 以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    const fileItems = Array.from(files)
      .filter((file) => file.name.toLowerCase().endsWith('.pdf'))
      .map((file) => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        path: (file as any).path || file.name,
        size: file.size,
      }))

    if (fileItems.length > 0) {
      addFiles(fileItems)
    }
  }

  // 点击选择文件
  const handleClickSelect = () => {
    fileInputRef.current?.click()
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
    if (selectedFiles.length === 0) return

    setAnalyzing(true)
    setAnalyzeResult(null)

    try {
      const filePaths = selectedFiles.map((f) => f.path)
      const result = await analyzePdf(filePaths, extractFields)
      setAnalyzeResult(result)
    } catch (error) {
      console.error('解析失败:', error)
    } finally {
      setAnalyzing(false)
    }
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
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

      {/* 开始解析按钮 */}
      <button
        onClick={handleAnalyze}
        disabled={selectedFiles.length === 0 || isAnalyzing}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          selectedFiles.length === 0 || isAnalyzing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isAnalyzing ? '解析中...' : '开始解析'}
      </button>

      {/* 解析结果展示 */}
      {analyzeResult && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-3">解析结果</h3>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(analyzeResult, null, 2)}
          </pre>
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
