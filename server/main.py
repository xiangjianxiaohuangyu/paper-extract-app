"""
FastAPI 主入口文件
提供三个 API 端点：/api/analyze, /api/config/save, /api/env/check
"""
# Windows 下设置 stdout 编码为 UTF-8
import sys
import io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import time
start = time.time()
print("========== FastAPI start ==========")
print("测试中文输出是否正常")
print("start import module...")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime
import pandas as pd

from services import pipeline, config_service, env_service
from services.log_service import manager

print(f"import module finish, use time: {time.time() - start:.2f}s")

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
    save_path: Optional[str] = None
    save_format: Optional[str] = "json"


class ConfigRequest(BaseModel):
    model_name: str
    api_key: str
    config_name: str = "default"
    provider: str = "qwen"


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

        # 如果指定了保存路径，保存文件
        if request.save_path and result:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            save_format = request.save_format or "json"

            if save_format == "excel":
                # 保存为 Excel 文件
                file_name = f"extract_result_{timestamp}.xlsx"
                full_path = os.path.join(request.save_path, file_name)

                # 转换为 DataFrame
                rows = []
                for item in result.get("results", []):
                    row = {"文件名": os.path.basename(item.get("file", ""))}
                    for field in result.get("fields", []):
                        row[field] = item.get("extracted", {}).get(field, "")
                    rows.append(row)

                df = pd.DataFrame(rows)
                df.to_excel(full_path, index=False, engine='openpyxl')
            else:
                # 保存为 JSON 文件
                file_name = f"extract_result_{timestamp}.json"
                full_path = os.path.join(request.save_path, file_name)

                with open(full_path, 'w', encoding='utf-8') as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)

            return AnalyzeResponse(
                success=True,
                message=f"解析完成，已保存至: {full_path}",
                data=result
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
            api_key=request.api_key,
            config_name=request.config_name,
            provider=request.provider
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
async def load_config(config_name: str = "default"):
    """
    加载配置接口
    调用 config_service.load_config() 加载已有配置
    """
    try:
        config = await config_service.load_config(config_name)
        return {
            "success": True,
            "data": config
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"加载失败: {str(e)}"
        }


@app.get("/api/config/list")
async def list_configs():
    """
    获取配置列表接口
    调用 config_service.get_all_configs() 获取所有已保存的配置
    """
    try:
        configs = await config_service.get_all_configs()
        return {
            "success": True,
            "data": configs
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"获取配置列表失败: {str(e)}"
        }


@app.get("/api/config/latest")
async def get_latest_config():
    """
    获取最近使用的配置接口
    调用 config_service.get_latest_config() 获取最近更新的配置
    """
    try:
        config = await config_service.get_latest_config()
        return {
            "success": True,
            "data": config
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"获取最近配置失败: {str(e)}"
        }


class DeleteConfigRequest(BaseModel):
    config_name: str


class DeleteConfigResponse(BaseModel):
    success: bool
    message: str = ""


@app.post("/api/config/delete", response_model=DeleteConfigResponse)
async def delete_config(request: DeleteConfigRequest):
    """
    删除配置接口
    调用 config_service.delete_config() 删除指定配置
    """
    try:
        success = await config_service.delete_config(request.config_name)
        if success:
            return DeleteConfigResponse(
                success=True,
                message="配置删除成功"
            )
        else:
            return DeleteConfigResponse(
                success=False,
                message="配置删除失败"
            )
    except Exception as e:
        return DeleteConfigResponse(
            success=False,
            message=f"删除失败: {str(e)}"
        )


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
    print(f"========== FastAPI start finish, use time: {time.time() - start:.2f}s ==========")
    
    #FastAPI 负责“写接口逻辑”，FastAPI 本身 不是服务器。
    #Uvicorn 负责“把接口变成可访问的 HTTP 服务”。
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
