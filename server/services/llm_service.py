"""
LLM 服务
负责调用大语言模型进行字段提取
"""
from typing import List, Dict


def extract_fields(chunk: str, fields: List[str], model_name: str = "qwen-max", api_key: str = "") -> Dict:
    """
    使用 LLM 从文本块中提取指定字段

    Args:
        chunk: 文本块内容
        fields: 需要提取的字段列表
        model_name: 模型名称，默认 qwen-max
        api_key: API 密钥

    Returns:
        提取结果字典

    Note:
        TODO: 实现字段提取逻辑
        - 调用千问 API
        - 根据 fields 列表生成 prompt
        - 解析返回结果
    """
    pass


def call_llm(prompt: str, model_name: str, api_key: str) -> str:
    """
    调用 LLM API

    Args:
        prompt: 提示词
        model_name: 模型名称
        api_key: API 密钥

    Returns:
        LLM 返回的文本

    Note:
        TODO: 实现 API 调用
    """
    pass
