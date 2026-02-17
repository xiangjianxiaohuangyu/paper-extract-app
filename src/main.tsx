import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { connectWebSocket } from './api/websocket'

function Root() {
  useEffect(() => {
    // 页面加载时连接 WebSocket
    connectWebSocket()

    return () => {
      // 组件卸载时断开连接
      import('./api/websocket').then(({ disconnectWebSocket }) => {
        disconnectWebSocket()
      })
    }
  }, [])

  return (
    <HashRouter>
      <App />
    </HashRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
