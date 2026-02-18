const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

// 移除应用程序菜单
Menu.setApplicationMenu(null)

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs')
  console.log('Preload 路径:', preloadPath)

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: preloadPath,
    },
  })

  // 默认打开 DevTools
  win.webContents.openDevTools()

  // 加载 Vite 开发服务器或生产构建
  const isDev = process.env.NODE_ENV !== 'production'

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    win.loadURL('http://localhost:5173')
  } else {
    // 生产模式：加载构建后的文件
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
