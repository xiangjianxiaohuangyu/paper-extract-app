"""
日志服务
负责 WebSocket 连接管理与日志推送
"""
#print(">>> import log_service...")
import asyncio
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
        # 无连接时直接返回
        if not self.active_connections:
            return

        # 复制列表避免遍历时修改
        connections = self.active_connections.copy()

        for connection in connections:
            try:
                # 添加超时，避免无限等待
                await asyncio.wait_for(
                    connection.send_json(message),
                    timeout=1.0
                )
            except asyncio.TimeoutError:
                print("[log_service] 发送超时，断开连接")
                self.disconnect(connection)
            except Exception:
                print("[log_service] 发送失败，断开连接")
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
    try:
        await manager.broadcast({
            "module": module,
            "message": message
        })
    except Exception as e:
        print(f"[log_service] push_log 异常: {e}")


async def push_progress(data: dict) -> None:
    """
    推送解析进度消息

    Args:
        data: 进度数据，包含 currentFile, currentStep, currentFileIndex, totalFiles, progress
    """
    try:
        await manager.broadcast({
            "type": "progress",
            "data": data
        })
    except Exception as e:
        print(f"[log_service] push_progress 异常: {e}")
