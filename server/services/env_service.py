"""
环境检测服务
负责检测 Python 版本、依赖包、API 连通性等
"""
print(">>> import env_service...")
import sys
import subprocess
import importlib.metadata
from typing import Dict, List
from .log_service import push_log


def get_version(package_name: str) -> str:
    """
    获取包的版本号

    Args:
        package_name: 包名

    Returns:
        版本号字符串，如果获取失败返回 None
    """
    # 包名到模块名的映射
    package_to_module = {
        "python-dotenv": "dotenv",
        "pydantic-settings": "pydantic_settings",
        "langchain-community": "langchain_community",
        "langchain-openai": "langchain_openai",
    }

    module_name = package_to_module.get(package_name, package_name.replace('-', '_'))

    # 方法1: 尝试从导入的模块获取 __version__ 属性
    try:
        module = __import__(module_name, fromlist=['__version__'])
        if hasattr(module, '__version__'):
            return module.__version__
    except (ImportError, AttributeError):
        pass

    # 方法2: 尝试获取 _version 属性
    try:
        module = __import__(module_name, fromlist=['_version'])
        if hasattr(module, '_version'):
            return module._version.version
    except (ImportError, AttributeError):
        pass

    # 方法3: 尝试 importlib.metadata（开发环境可用）
    try:
        return importlib.metadata.version(package_name)
    except importlib.metadata.PackageNotFoundError:
        pass

    # 方法4: 尝试将包名转为下划线后获取
    try:
        normalized_name = package_name.replace('-', '_')
        return importlib.metadata.version(normalized_name)
    except importlib.metadata.PackageNotFoundError:
        return None


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
    检测 requirements.txt 中的所有依赖

    Returns:
        包含各依赖包检测结果的字典

    Note:
        检测以下依赖：
        - 基础环境: python-dotenv
        - Web 服务: fastapi, uvicorn, pydantic, pydantic-settings
        - AI 核心: langchain, langchain-community, langchain-openai, openai
        - 其他: tiktoken, pandas, openpyxl
    """
    await push_log("env", "检测依赖包...")

    dependencies = {}

    # 包名到模块名的映射
    package_to_module = {
        "python-dotenv": "dotenv",
        "pydantic-settings": "pydantic_settings",
        "langchain-community": "langchain_community",
        "langchain-openai": "langchain_openai",
    }

    # 检测 requirements.txt 中的所有依赖包
    packages = [
        "python-dotenv",
        "fastapi", "uvicorn", "pydantic", "pydantic-settings",
        "langchain", "langchain-community", "langchain-openai", "openai",
        "tiktoken", "pandas", "openpyxl"
    ]
    for pkg in packages:
        # 获取对应的模块名
        module_name = package_to_module.get(pkg, pkg.replace('-', '_'))

        # 尝试导入模块
        try:
            __import__(module_name)
            # 如果导入成功，尝试获取版本
            version = get_version(pkg)
            dependencies[pkg] = {"installed": True, "version": version or "unknown"}
            await push_log("env", f"  - {pkg}: 已安装 (v{version or 'unknown'})")
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

    await push_log("env", "开始环境检测...")

    # Python 版本检测
    python_result = await check_python()

    # 依赖检测
    dependencies_result = await check_dependencies()

    # API 连通性检测
    api_result = await check_model_connection()

    await push_log("env", "环境检测完成!")

    return {
        "python": python_result,
        "dependencies": dependencies_result,
        "api_connection": api_result
    }
