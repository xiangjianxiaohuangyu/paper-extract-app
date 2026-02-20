"""
LLM 服务
负责调用大语言模型进行字段提取
"""
print(">>> import llm_service...")
import json
from typing import List, Dict, Optional
import tiktoken
from langchain_openai import ChatOpenAI


def split_by_tokens(text: str, max_tokens: int = 3000, overlap: int = 300) -> List[str]:
    """
    按 token 分块，避免超过模型限制

    Args:
        text: 待分块的文本
        max_tokens: 每个块的最大 token 数
        overlap: 块之间的重叠 token 数

    Returns:
        分块后的文本列表
    """
    if not text:
        return []

    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)

    # 计算步长（每块token数 - overlap）
    step = max_tokens - overlap

    chunks = []
    for i in range(0, len(tokens), step):
        chunk_tokens = tokens[i:i + max_tokens]
        chunk_text = enc.decode(chunk_tokens)
        chunks.append(chunk_text)

    print(f"[split_by_tokens] 文本总 token 数: {len(tokens)}, 分块数量: {len(chunks)}, 每块 {max_tokens} tokens, overlap {overlap}")
    return chunks


def extract_from_chunk(chunk: str, fields: List[str], model_name: str, api_key: str) -> Dict:
    """
    Map 阶段：从单个文本块中提取字段

    Args:
        chunk: 文本块
        fields: 需要提取的字段列表
        model_name: 模型名称
        api_key: API 密钥

    Returns:
        提取结果字典
    """
    fields_str = ", ".join(fields)

    prompt = f"""请从以下论文片段中提取字段：{fields_str}

严格返回 JSON 格式，不要包含任何解释或额外内容。如果某个字段不存在，请返回空字符串。

片段内容：
{chunk}
"""

    try:
        raw = call_llm(prompt, model_name, api_key)
        print(f"[extract_from_chunk] 块原始返回: {raw[:500]}...")

        # 解析 JSON 响应
        response = raw.strip()
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]

        return json.loads(response.strip())
    except Exception as e:
        print(f"[extract_from_chunk] 解析失败: {e}")
        return {field: "" for field in fields}


def merge_results(results: List[Dict], fields: List[str], model_name: str, api_key: str) -> Dict:
    """
    Reduce 阶段：合并多个文本块的提取结果

    Args:
        results: 各文本块的提取结果列表
        fields: 需要提取的字段列表
        model_name: 模型名称
        api_key: API 密钥

    Returns:
        合并后的最终结果
    """
    if not results:
        return {field: "" for field in fields}

    if len(results) == 1:
        return results[0]

    prompt = f"""以下是多个论文片段提取结果：

{json.dumps(results, ensure_ascii=False, indent=2)}

请合并为最终结果。
规则：
1. 如果多个片段都有值，选择最完整的（非空）值。
2. 不要丢失任何信息。
3. 严格返回 JSON 格式，不要包含任何解释。

输出格式：
{{
    "字段名": "合并后的值",
    ...
}}
"""

    try:
        raw = call_llm(prompt, model_name, api_key)
        print(f"[merge_results] 合并原始返回: {raw[:500]}...")

        # 解析 JSON 响应
        response = raw.strip()
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]

        return json.loads(response.strip())
    except Exception as e:
        print(f"[merge_results] 解析失败: {e}")
        # 回退策略：取第一个非空值
        fallback = {}
        for field in fields:
            for result in results:
                if result.get(field):
                    fallback[field] = result[field]
                    break
            else:
                fallback[field] = ""
        return fallback


def extract_fields_advanced(content: str, fields: List[str], model_name: str = "qwen-max", api_key: str = "") -> Dict:
    """
    高级字段提取：Token-aware 分块 + Map-Reduce

    Args:
        content: 完整的文本内容
        fields: 需要提取的字段列表
        model_name: 模型名称，默认 qwen-max
        api_key: API 密钥

    Returns:
        提取结果字典（包含 parsed 和 raw 字段）
    """
    # 检查 API Key 是否为空
    if not api_key:
        print("[ERROR] API Key 为空")
        return {
            "parsed": {field: "" for field in fields},
            "raw": "",
            "error": "API Key 为空，请在配置页面设置 API Key"
        }

    print(f"[extract_fields_advanced] 开始处理，内容长度: {len(content)} 字符")

    # 1. Token-aware 分块
    chunks = split_by_tokens(content, max_tokens=3000, overlap=300)
    print(f"[extract_fields_advanced] 分块数量: {len(chunks)}")

    # 2. Map 阶段：每块提取字段
    partial_results = []
    for i, chunk in enumerate(chunks):
        print(f"[extract_fields_advanced] 处理块 {i+1}/{len(chunks)}")
        result = extract_from_chunk(chunk, fields, model_name, api_key)
        partial_results.append(result)

    # 3. Reduce 阶段：合并结果
    print(f"[extract_fields_advanced] 开始合并 {len(partial_results)} 个结果")
    final_result = merge_results(partial_results, fields, model_name, api_key)

    return {
        "parsed": final_result,
        "raw": json.dumps(partial_results, ensure_ascii=False)
    }


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
{content[:30000]}  # qwen-max最大输入限制30720
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
