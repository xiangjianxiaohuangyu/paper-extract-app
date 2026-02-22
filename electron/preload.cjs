const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')

// 递归扫描目录中的所有 PDF 文件
function scanDirectory(dirPath) {
  const results = []

  function scan(currentPath) {
    const items = fs.readdirSync(currentPath)

    for (const item of items) {
      const fullPath = path.join(currentPath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scan(fullPath) // 递归扫描子目录
      } else if (stat.isFile() && item.toLowerCase().endsWith('.pdf')) {
        results.push({
          name: item,
          path: fullPath,
          size: stat.size,
        })
      }
    }
  }

  scan(dirPath)
  return results
}

// 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 打开文件/文件夹选择对话框
  selectFiles: async () => {
    const result = await ipcRenderer.invoke('dialog:openFile', {
      properties: [
        'openFile',
        'openDirectory',
        'multiSelections',
      ],
      filters: [
        { name: 'PDF 文件', extensions: ['pdf'] },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return []
    }

    const files = []

    for (const filePath of result.filePaths) {
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        // 如果是文件夹，递归扫描其中的 PDF
        const pdfFiles = scanDirectory(filePath)
        files.push(...pdfFiles)
      } else if (stat.isFile() && filePath.toLowerCase().endsWith('.pdf')) {
        files.push({
          name: path.basename(filePath),
          path: filePath,
          size: stat.size,
        })
      }
    }

    return files
  },

  // 递归扫描目录中的所有 PDF 文件（供拖拽文件夹使用）
  scanDirectory: (dirPath) => {
    return scanDirectory(dirPath)
  },

  // 检查路径是否为目录
  isDirectory: (filePath) => {
    try {
      return fs.statSync(filePath).isDirectory()
    } catch {
      return false
    }
  },

  // 选择目录
  selectDirectory: async () => {
    const result = await ipcRenderer.invoke('dialog:openDirectory')

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  },

  // 在浏览器中打开外部链接
  openExternal: async (url) => {
    return await ipcRenderer.invoke('shell:openExternal', url)
  },
})
