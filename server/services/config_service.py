"""
配置服务
负责保存和加载用户配置
"""
#print(">>> import config_service...")
import json
import os
from datetime import datetime
from typing import Dict, List
from .log_service import push_log


# 获取配置文件的完整路径
def get_config_file_path():
    """获取配置文件路径"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    config_dir = os.path.join(project_root, 'configs')

    # 如果目录不存在，创建它
    if not os.path.exists(config_dir):
        os.makedirs(config_dir)

    config_file = os.path.join(config_dir, 'config.json')
    return config_file


def get_all_configs_from_file() -> List[Dict]:
    """从配置文件中读取所有配置"""
    config_file = get_config_file_path()
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('configs', [])
    return []


def save_all_configs_to_file(configs: List[Dict]) -> bool:
    """保存所有配置到配置文件"""
    try:
        config_file = get_config_file_path()
        data = {'configs': configs}
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存配置失败: {e}")
        return False


async def save_config(model_name: str, api_key: str, config_name: str = "自定义名称", provider: str = "qwen", base_url: str = "") -> bool:
    """
    保存配置到文件

    Args:
        model_name: 模型名称
        api_key: API 密钥
        config_name: 配置名称（用于区分不同配置）
        provider: 模型供应商
        base_url: API 端点 URL（自定义供应商时使用）

    Returns:
        是否保存成功
    """
    try:
        configs = get_all_configs_from_file()

        # 清理配置名称，移除非法字符
        safe_name = "".join(c for c in config_name if c.isalnum() or c in ('-', '_', '.'))
        if not safe_name:
            safe_name = "自定义名称"

        # 检查是否已存在相同名称的配置
        existing_index = -1
        for i, cfg in enumerate(configs):
            if cfg.get('config_name') == safe_name:
                existing_index = i
                break

        config_data = {
            "config_name": safe_name,
            "provider": provider,
            "model_name": model_name,
            "api_key": api_key,
            "base_url": base_url,
            "updated_at": datetime.now().isoformat()
        }

        if existing_index >= 0:
            # 更新已存在的配置
            configs[existing_index] = config_data
        else:
            # 添加新配置
            configs.append(config_data)

        if save_all_configs_to_file(configs):
            await push_log("config", f"配置已保存: {config_name} ({provider}/{model_name}, base_url: {base_url})")
            return True
        return False
    except Exception as e:
        await push_log("config", f"配置保存失败: {str(e)}")
        return False


async def load_config(config_name: str = "自定义名称") -> Dict:
    """
    加载配置文件，并更新其 updated_at 时间戳

    Args:
        config_name: 配置名称

    Returns:
        配置字典，包含 model_name 和 api_key
    """
    

    try:
        configs = get_all_configs_from_file()

        # 清理配置名称
        safe_name = "".join(c for c in config_name if c.isalnum() or c in ('-', '_', '.'))
        if not safe_name:
            safe_name = "自定义名称"

        for i, cfg in enumerate(configs):
            if cfg.get('config_name') == safe_name:
                # 更新 updated_at 时间戳
                configs[i]['updated_at'] = datetime.now().isoformat()
                save_all_configs_to_file(configs)
                await push_log("config", f"加载配置: {config_name}...")
                return configs[i]

        # 未找到配置，返回默认配置
        await push_log("config", f"配置 {config_name} 不存在，使用默认配置")
        return get_default_config()
    except Exception as e:
        await push_log("config", f"加载配置失败: {str(e)}")
        return get_default_config()


async def get_all_configs() -> List[Dict]:
    """
    获取所有已保存的配置列表（按更新时间排序）

    Returns:
        配置列表
    """
    try:
        configs = get_all_configs_from_file()
        # 按更新时间排序，最新的在前
        configs.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        # 为每个配置添加 file_name 字段（用于兼容前端）
        for cfg in configs:
            cfg['file_name'] = cfg.get('config_name', '')
        return configs
    except Exception as e:
        await push_log("config", f"获取配置列表失败: {str(e)}")
        return []


async def get_latest_config() -> Dict:
    """
    获取最近更新的配置

    Returns:
        最近更新的配置
    """
    try:
        configs = get_all_configs_from_file()
        if not configs:
            return get_default_config()
        # 按更新时间排序，最新的在前
        configs.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        return configs[0]
    except Exception as e:
        await push_log("config", f"获取最近配置失败: {str(e)}")
        return get_default_config()


async def delete_config(config_name: str) -> bool:
    """
    删除配置文件

    Args:
        config_name: 配置名称

    Returns:
        是否删除成功
    """
    try:
        configs = get_all_configs_from_file()

        # 清理配置名称
        safe_name = "".join(c for c in config_name if c.isalnum() or c in ('-', '_', '.'))

        # 过滤掉要删除的配置
        new_configs = [cfg for cfg in configs if cfg.get('config_name') != safe_name]

        if len(new_configs) < len(configs):
            if save_all_configs_to_file(new_configs):
                await push_log("config", f"配置已删除: {config_name}")
                return True

        await push_log("config", f"配置不存在: {config_name}")
        return False
    except Exception as e:
        await push_log("config", f"删除配置失败: {str(e)}")
        return False


def get_default_config() -> Dict:
    """
    获取默认配置

    Returns:
        默认配置字典
    """
    return {
        "config_name": "自定义名称",
        "provider": "qwen",
        "model_name": "qwen-max",
        "api_key": ""
    }
