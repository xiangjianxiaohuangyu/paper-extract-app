"""
日志服务
负责 WebSocket 连接管理与日志推送
"""
from fastapi import WebSocket
from typing import List


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """接受 WebSocket 连接"""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """断开 WebSocket 连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """广播消息到所有连接"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # 连接已断开，移除
                self.disconnect(connection)


# 全局连接管理器实例
manager = ConnectionManager()


async def push_log(module: str, message: str) -> None:
    """
    统一日志输出函数

    Args:
        module: 模块名称 ("analyze" | "config" | "env")
        message: 日志消息
    """
    await manager.broadcast({
        "module": module,
        "message": message
    })
