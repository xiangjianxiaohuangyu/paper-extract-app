"""
环境检测服务
负责检测 Python 版本、依赖包、API 连通性等
"""
print(">>> import env_service...")
import sys
import subprocess
from typing import Dict, List
from .log_service import push_log


async def check_python() -> Dict:
    """
    检测 Python 版本

    Returns:
        包含版本信息和检测状态的字典

    Note:
        TODO: 实现 Python 版本检测
        - 获取当前 Python 版本
        - 判断是否满足最低版本要求
    """
    version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    await push_log("env", f"检测到 Python 版本: {version}")
    return {
        "version": version,
        "status": "ok",
        "message": f"Python {version} 运行正常"
    }


async def check_dependencies() -> Dict:
    """
    检测 pypdf、langchain 等依赖

    Returns:
        包含各依赖包检测结果的字典

    Note:
        TODO: 实现依赖检测逻辑
        - 检测 pypdf / pdfplumber
        - 检测 langchain
        - 检测其他必要依赖
    """
    await push_log("env", "检测依赖包...")

    dependencies = {}

    # 检测常用依赖包
    packages = ["pypdf", "pdfplumber", "langchain", "openai", "requests"]
    for pkg in packages:
        try:
            __import__(pkg)
            dependencies[pkg] = {"installed": True, "version": "unknown"}
            await push_log("env", f"  - {pkg}: 已安装")
        except ImportError:
            dependencies[pkg] = {"installed": False}
            await push_log("env", f"  - {pkg}: 未安装")

    await push_log("env", "依赖检测完成")
    return dependencies


async def check_model_connection() -> Dict:
    """
    检测千问 API 连通性

    Returns:
        包含 API 连通性检测结果的字典

    Note:
        TODO: 实现 API 连通性检测
        - 测试 API 端点是否可达
        - 验证 API 密钥是否有效
    """
    await push_log("env", "检测 API 连通性...")

    # TODO: 实现实际的 API 连通性检测
    # try:
    #     import requests
    #     response = requests.get("https://api.openai.com/v1/models", timeout=5)
    #     if response.status_code == 200:
    #         return {"status": "ok", "message": "API 连接正常"}
    #     else:
    #         return {"status": "error", "message": f"API 返回错误: {response.status_code}"}
    # except Exception as e:
    #     return {"status": "error", "message": f"API 连接失败: {str(e)}"}

    await push_log("env", "  - API 连通性: 正常 (Mock)")
    return {
        "status": "ok",
        "message": "API 连接正常"
    }


async def run_all_checks() -> Dict:
    """
    统一封装所有检测，返回结构化检测结果

    Returns:
        包含所有检测项结果的字典

    Note:
        内部依次调用：
        - check_python() - Python 版本检测
        - check_dependencies() - 依赖检测
        - check_model_connection() - API 连通性检测
    """
    await push_log("env", "=" * 30)
    await push_log("env", "开始环境检测...")
    await push_log("env", "=" * 30)

    # Python 版本检测
    python_result = await check_python()

    # 依赖检测
    await push_log("env", "-" * 30)
    dependencies_result = await check_dependencies()

    # API 连通性检测
    await push_log("env", "-" * 30)
    api_result = await check_model_connection()

    await push_log("env", "=" * 30)
    await push_log("env", "环境检测完成!")
    await push_log("env", "=" * 30)

    return {
        "python": python_result,
        "dependencies": dependencies_result,
        "api_connection": api_result
    }
