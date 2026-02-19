import { useAppStore, ModuleType } from '@/stores/appStore'

let ws: WebSocket | null = null
let reconnectTimer: NodeJS.Timeout | null = null
let isConnecting = false

// WebSocket 必须使用绝对地址
// 开发模式下 /api 无法用于 WebSocket，直接使用后端地址
const WS_URL = 'ws://127.0.0.1:8000/ws/logs'

export function connectWebSocket(): void {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return
  }

  isConnecting = true

  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('WebSocket 连接已建立')
      isConnecting = false
      // 清除重连定时器
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { module: ModuleType; message: string }
        useAppStore.getState().appendLog(data.module, data.message)
      } catch (error) {
        console.error('解析 WebSocket 消息失败:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      isConnecting = false
    }

    ws.onclose = () => {
      console.log('WebSocket 连接已关闭')
      isConnecting = false
      ws = null
      // 尝试重连
      scheduleReconnect()
    }
  } catch (error) {
    console.error('创建 WebSocket 连接失败:', error)
    isConnecting = false
    scheduleReconnect()
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) {
    return
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    console.log('尝试重新连接 WebSocket...')
    connectWebSocket()
  }, 3000)
}

export function disconnectWebSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (ws) {
    ws.close()
    ws = null
  }
}

export function sendPing(): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send('ping')
  }
}
