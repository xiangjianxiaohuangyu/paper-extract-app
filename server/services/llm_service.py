"""
LLM 服务
负责调用大语言模型进行字段提取
"""
print(">>> import llm_service...")
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
    print(f"[call_llm] 开始调用, model={model_name}, prompt长度={len(prompt)}")

    if not api_key:
        raise ValueError("API Key 不能为空")

    try:
        # 使用 langchain-openai 兼容千问 API
        # 千问 API 兼容 OpenAI 接口
        llm = ChatOpenAI(
            model=model_name,
            api_key=api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            temperature=0.1
        )

        response = llm.invoke(prompt)
        print(f"[call_llm] 响应类型: {type(response)}, content长度: {len(response.content) if response.content else 0}")
        print(f"[call_llm] 原始响应内容: {response.content}")
        return response.content
    except Exception as e:
        import traceback
        print(f"[call_llm] 调用失败: {e}")
        print(f"[call_llm] 详细堆栈: {traceback.format_exc()}")
        raise


def extract_fields(content: str, fields: List[str], model_name: str = "qwen-max", api_key: str = "") -> Dict:
    """
    使用 LLM 从文本内容中提取指定字段

    Args:
        content: 完整的文本内容
        fields: 需要提取的字段列表
        model_name: 模型名称，默认 qwen-max
        api_key: API 密钥

    Returns:
        提取结果字典（包含 parsed 和 raw 字段）
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

    raw_response = ""  # 初始化原始响应

    # 检查 API Key 是否为空
    if not api_key:
        print("[ERROR] API Key 为空")
        return {
            "parsed": {field: "" for field in fields},
            "raw": "",
            "error": "API Key 为空，请在配置页面设置 API Key"
        }

    try:
        # 调用 LLM
        raw_response = call_llm(prompt, model_name, api_key)
        print(f"[DEBUG] LLM 完整原始响应: {raw_response}")

        # 解析 JSON 响应
        # 尝试提取 JSON 部分
        response = raw_response.strip()
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]

        parsed_result = json.loads(response.strip())

        # 返回包含解析结果和原始结果
        return {
            "parsed": parsed_result,
            "raw": raw_response
        }

    except Exception as e:
        import traceback
        print(f"字段提取失败: {e}")
        print(f"原始响应: {raw_response[:500] if raw_response else '未获取到响应'}")
        print(f"详细堆栈: {traceback.format_exc()}")
        return {
            "parsed": {field: "" for field in fields},
            "raw": raw_response  # 现在 raw_response 一定存在
        }
