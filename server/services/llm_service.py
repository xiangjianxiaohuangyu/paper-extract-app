"""
LLM 服务
负责调用大语言模型进行字段提取
"""
import json
from typing import List, Dict, Optional
from langchain_openai import ChatOpenAI


def call_llm(prompt: str, model_name: str = "qwen-max", api_key: str = "") -> str:
    """
    调用 LLM API

    Args:
        prompt: 提示词
        model_name: 模型名称，默认 qwen-max
        api_key: API 密钥

    Returns:
        LLM 返回的文本
    """
    if not api_key:
        raise ValueError("API Key 不能为空")

    # 使用 langchain-openai 兼容千问 API
    # 千问 API 兼容 OpenAI 接口
    llm = ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        temperature=0.1
    )

    response = llm.invoke(prompt)
    return response.content


def extract_fields(content: str, fields: List[str], model_name: str = "qwen-max", api_key: str = "") -> Dict:
    """
    使用 LLM 从文本内容中提取指定字段

    Args:
        content: 完整的文本内容
        fields: 需要提取的字段列表
        model_name: 模型名称，默认 qwen-max
        api_key: API 密钥

    Returns:
        提取结果字典
    """
    # 构建 prompt
    fields_str = ", ".join(fields)
    prompt = f"""请从以下论文内容中提取指定字段：{fields_str}

请严格按照以下 JSON 格式返回，不要包含其他内容：
{{
    "字段名": "提取的内容",
    ...
}}

如果某个字段不存在，请返回空字符串。

论文内容：
{content[:150000]}  # 限制内容长度
"""

    try:
        # 调用 LLM
        response = call_llm(prompt, model_name, api_key)

        # 解析 JSON 响应
        # 尝试提取 JSON 部分
        response = response.strip()
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]

        result = json.loads(response.strip())
        return result

    except Exception as e:
        print(f"字段提取失败: {e}")
        return {field: "" for field in fields}
