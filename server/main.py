"""
FastAPI 主入口文件
提供三个 API 端点：/api/analyze, /api/config/save, /api/env/check
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional

from services import pipeline, config_service, env_service
from services.log_service import manager

app = FastAPI(title="论文提取 API")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 数据模型
class AnalyzeRequest(BaseModel):
    file_paths: List[str]
    fields: List[str]


class ConfigRequest(BaseModel):
    model_name: str
    api_key: str


class AnalyzeResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class ConfigResponse(BaseModel):
    success: bool
    message: str


class EnvCheckResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


@app.get("/")
async def root():
    """根路径健康检查"""
    return {"status": "ok", "message": "论文提取 API 服务运行中"}


@app.head("/")
async def root_head():
    """根路径健康检查（HEAD 方法，用于 wait-on 检测）"""
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    文章解析接口
    调用 pipeline.run_pipeline() 执行完整的解析流水线
    """
    try:
        result = await pipeline.run_pipeline(
            file_paths=request.file_paths,
            fields=request.fields
        )
        return AnalyzeResponse(
            success=True,
            message="解析完成",
            data=result
        )
    except Exception as e:
        return AnalyzeResponse(
            success=False,
            message=f"解析失败: {str(e)}"
        )


@app.post("/api/config/save", response_model=ConfigResponse)
async def save_config(request: ConfigRequest):
    """
    保存配置接口
    调用 config_service.save_config() 保存模型配置
    """
    try:
        success = await config_service.save_config(
            model_name=request.model_name,
            api_key=request.api_key
        )
        if success:
            return ConfigResponse(
                success=True,
                message="配置保存成功"
            )
        else:
            return ConfigResponse(
                success=False,
                message="配置保存失败"
            )
    except Exception as e:
        return ConfigResponse(
            success=False,
            message=f"保存失败: {str(e)}"
        )


@app.get("/api/config/load")
async def load_config():
    """
    加载配置接口
    调用 config_service.load_config() 加载已有配置
    """
    try:
        config = await config_service.load_config()
        return {
            "success": True,
            "data": config
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"加载失败: {str(e)}"
        }


@app.get("/api/env/check", response_model=EnvCheckResponse)
async def check_env():
    """
    环境检测接口
    调用 env_service.run_all_checks() 执行完整的环境检测
    """
    try:
        result = await env_service.run_all_checks()
        return EnvCheckResponse(
            success=True,
            message="检测完成",
            data=result
        )
    except Exception as e:
        return EnvCheckResponse(
            success=False,
            message=f"检测失败: {str(e)}"
        )


@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    """WebSocket 日志推送端点"""
    await manager.connect(websocket)
    try:
        while True:
            # 保持连接，客户端可以发送心跳
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
