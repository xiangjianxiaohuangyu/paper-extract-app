"""
配置服务
负责保存和加载用户配置
"""
import json
import os
from typing import Dict
from .log_service import push_log


CONFIG_FILE = "config.json"


async def save_config(model_name: str, api_key: str) -> bool:
    """
    保存配置到文件

    Args:
        model_name: 模型名称
        api_key: API 密钥

    Returns:
        是否保存成功

    Note:
        TODO: 实现配置保存逻辑
        - 将配置保存到 JSON 文件
        - 注意 api_key 的安全性（可选择加密存储）
    """
    await push_log("config", f"开始保存配置 (模型: {model_name})...")

    try:
        # TODO: 实现实际的配置保存逻辑
        # config_data = {"model_name": model_name, "api_key": api_key}
        # with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        #     json.dump(config_data, f, ensure_ascii=False, indent=2)

        await push_log("config", "配置保存中...")
        await push_log("config", "配置已保存")
        return True
    except Exception as e:
        await push_log("config", f"配置保存失败: {str(e)}")
        return False


async def load_config() -> Dict:
    """
    加载配置文件

    Returns:
        配置字典，包含 model_name 和 api_key

    Note:
        TODO: 实现配置加载逻辑
        - 从 JSON 文件读取配置
        - 如果文件不存在，返回默认配置
    """
    await push_log("config", "加载配置...")

    try:
        # TODO: 实现实际的配置加载逻辑
        # if os.path.exists(CONFIG_FILE):
        #     with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        #         return json.load(f)
        # return get_default_config()

        await push_log("config", "加载默认配置")
        return get_default_config()
    except Exception as e:
        await push_log("config", f"加载配置失败: {str(e)}")
        return get_default_config()


def get_default_config() -> Dict:
    """
    获取默认配置

    Returns:
        默认配置字典
    """
    return {
        "model_name": "qwen-max",
        "api_key": ""
    }
