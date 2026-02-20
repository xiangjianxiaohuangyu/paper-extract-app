const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

// 移除应用程序菜单
Menu.setApplicationMenu(null)

let serverProcess = null

// 注册 IPC 处理器
ipcMain.handle('dialog:openFile', async (event, options) => {
  return await dialog.showOpenDialog(options)
})

ipcMain.handle('dialog:openDirectory', async (event) => {
  return await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
})

// 等待服务就绪
function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    function check() {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - startTime > timeout) {
            reject(new Error('Server timeout'))
          } else {
            setTimeout(check, 500)
          }
        })
    }

    check()
  })
}

// 启动 Python 服务
function startServer() {
  const isDev = !app.isPackaged
  console.log('isDev:', isDev)
  console.log('process.resourcesPath:', process.resourcesPath)

  if (isDev) {
    // 开发模式：使用 python 直接运行
    const serverPath = path.join(__dirname, '../server/run.py')
    console.log('开发模式：启动 Python 服务:', serverPath)
    serverProcess = spawn('python', [serverPath], {
      cwd: path.join(__dirname, '../server'),
      windowsHide: true,
      stdio: 'inherit',
    })
  } else {
    // 生产模式：启动打包后的 server.exe
    const serverExePath = path.join(process.resourcesPath, 'server', 'server.exe')
    console.log('生产模式：启动 server.exe:', serverExePath)

    serverProcess = spawn(serverExePath, [], {
      cwd: path.dirname(serverExePath),
      windowsHide: true,
    })

    // 监听 stdout
    serverProcess.stdout.on('data', (data) => {
      console.log('[SERVER]', data.toString())
    })

    // 监听 stderr
    serverProcess.stderr.on('data', (data) => {
      console.error('[SERVER ERROR]', data.toString())
    })
  }

  serverProcess.on('error', (err) => {
    console.error('启动 Python 服务失败:', err)
  })

  serverProcess.on('close', (code) => {
    console.log('Python 服务已关闭，退出码:', code)
  })
}

function createWindow() {
  const isDev = !app.isPackaged

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


  win.webContents.openDevTools()

  
  // // 开发模式打开 DevTools
  // if (isDev) {
  //   win.webContents.openDevTools()
  // }

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    win.loadURL('http://localhost:5173')
  } else {
    // 生产模式：加载构建后的文件
    const indexPath = path.join(app.getAppPath(), 'dist/index.html')
    console.log('加载页面路径:', indexPath)
    win.loadFile(indexPath)
  }
}

app.whenReady().then(async () => {
  const isDev = !app.isPackaged

  if (!isDev) {
    // 生产模式：先启动 Python 服务
    startServer()

    // 等待服务器就绪
    try {
      console.log('等待 Python 服务启动...')
      await waitForServer('http://localhost:8000')
      console.log('Python 服务已就绪')
    } catch (err) {
      console.error('等待服务器超时:', err)
    }
  } else {
    // 开发模式：启动 Python 服务
    startServer()
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 关闭 Python 服务
    if (serverProcess) {
      // 使用更强制的方式杀死进程
      serverProcess.kill('SIGTERM')
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  // 关闭 Python 服务
  if (serverProcess) {
    // 使用更强制的方式杀死进程
    serverProcess.kill('SIGTERM')
  }
})
