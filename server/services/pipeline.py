"""
流水线服务
负责整合 PDF 解析、分块、字段提取、结果汇总的完整流程
"""
print(">>> import pipeline...")
import os
from typing import List, Dict
import tiktoken
from . import pdf_parser, llm_service, config_service
from .log_service import push_log

# Token 预估函数
def estimate_tokens(text: str) -> int:
    """
    预估文本的 token 数量
    使用 tiktoken 库进行精确估算（cl100k_base 编码）

    Args:
        text: 待预估的文本

    Returns:
        预估的 token 数量
    """
    if not text:
        return 0

    try:
        # 使用 cl100k_base 编码（GPT-4/3.5 使用）
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        # 如果 tiktoken 失败，使用备用估算方法
        return len(text) // 2


def estimate_cost(input_tokens: int, output_tokens: int = 1000, model_name: str = "qwen-max") -> str:
    """
    预估 API 调用费用

    Args:
        input_tokens: 输入 token 数量
        output_tokens: 输出 token 数量
        model_name: 模型名称

    Returns:
        费用估算字符串
    """
    # 千问模型价格（单位：元/百万 token）
    # qwen-max: 输入 0.02 元/万 token，输出 0.06 元/万 token
    prices = {
        "qwen-max": (2.0, 6.0),  # (输入价格, 输出价格) 单位：元/百万
        "qwen-plus": (1.0, 3.0),
        "qwen-turbo": (0.5, 1.5),
    }

    price = prices.get(model_name, (1.0, 3.0))
    input_cost = input_tokens / 1_000_000 * price[0]
    output_cost = output_tokens / 1_000_000 * price[1]
    total_cost = input_cost + output_cost

    return f"约 {total_cost:.4f} 元"


async def estimate_and_log_tokens(content: str, fields: List[str], model_name: str = "qwen-max") -> tuple:
    """
    预估 token 数量和费用（使用分块模式）

    Args:
        content: PDF 文本内容
        fields: 需要提取的字段列表
        model_name: 模型名称

    Returns:
        (input_tokens, estimated_cost): token 数量和费用字符串
    """
    # 使用与 llm_service.extract_fields_advanced 相同的分块逻辑
    from .llm_service import split_by_tokens

    fields_str = ", ".join(fields)
    chunks = split_by_tokens(content, max_tokens=3000, overlap=300)

    total_input_tokens = 0
    chunk_count = len(chunks)

    # 计算每个 chunk 的 prompt token
    for chunk in chunks:
        # Map 阶段 prompt
        map_prompt = f"""请从以下论文片段中提取字段：{fields_str}

严格返回 JSON 格式，不要包含任何解释或额外内容。如果某个字段不存在，请返回空字符串。

片段内容：
{chunk}
"""
        map_tokens = estimate_tokens(map_prompt)
        total_input_tokens += map_tokens

    # Reduce 阶段 prompt（汇总所有部分结果）
    reduce_prompt = f"""以下是多个论文片段提取结果：

[部分结果]

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
    reduce_tokens = estimate_tokens(reduce_prompt)
    total_input_tokens += reduce_tokens

    estimated_cost = estimate_cost(total_input_tokens, model_name=model_name)

    # print(f"[estimate_and_log_tokens] 分块数量: {chunk_count}, 总输入 token: {total_input_tokens}, 费用: {estimated_cost}")

    return total_input_tokens, estimated_cost


async def run_pipeline(file_paths: List[str], fields: List[str]) -> Dict:
    """
    完整的解析流水线：PDF解析 -> 分块 -> 字段提取 -> 结果汇总

    Args:
        file_paths: PDF 文件路径列表
        fields: 需要提取的字段列表

    Returns:
        解析结果字典

    Note:
        内部流程：
        1. 遍历每个 PDF 文件，调用 parse_pdf() 解析
        2. 调用 split_documents() 对文档进行分块
        3. 对每个 chunk 调用 extract_fields() 提取字段
        4. 调用 merge_results() 汇总所有结果
    """
    # 记录日志：开始解析

    await push_log("analyze", f"开始解析 {len(file_paths)} 个文件...")

    all_results = []

    # 获取配置中的 API Key 和模型名称（使用最近保存的配置）
    config = await config_service.get_latest_config()
    config_name = config.get("config_name", "未知")
    provider = config.get("provider", "qwen")
    api_key = config.get("api_key", "")
    model_name = config.get("model_name", "qwen-max")
    base_url = config.get("base_url", "")

    # 输出配置信息

    await push_log("analyze", f"配置信息: config_name={config_name}, provider={provider}, model_name={model_name}, api_key={'***' + api_key[-4:] if api_key else ''}, base_url={base_url}")

    # 检查配置完整性
    if not api_key:
        await push_log("analyze", "警告: API Key 为空，请在配置页面设置 API Key")
        return {"total_files": 0, "fields": fields, "results": [], "error": "API Key 为空"}

    if not base_url:
        await push_log("analyze", "警告: base_url 为空，请在配置页面设置 API 端点")
        return {"total_files": 0, "fields": fields, "results": [], "error": "base_url 为空"}

    for file_path in file_paths:
        #await push_log("analyze", f"开始解析文件: {file_path}")

        # Step 1: 解析 PDF
        content = pdf_parser.parse_pdf(file_path)

        # Step 2: 预估 token 和费用
        input_tokens, estimated_cost = await estimate_and_log_tokens(content, fields, model_name)
        await push_log("analyze", f"文件{os.path.basename(file_path)}预估输入 token: {input_tokens}")

        # Step 3: 字段提取
        result = llm_service.extract_fields_advanced(content, fields, model_name, api_key, base_url)

        # 检查是否有错误
        if result.get("error"):
            await push_log("analyze", f"错误: {result.get('error')}")
            return {
                "total_files": 0,
                "fields": fields,
                "results": [],
                "error": result.get("error")
            }

        extracted = result.get("parsed", {})
        raw_response = result.get("raw", "")

        all_results.append({
            "file": file_path,
            "extracted": extracted
        })

    await push_log("analyze", f"解析完成，共处理 {len(all_results)} 个文件")

    return {
        "total_files": len(file_paths),
        "fields": fields,
        "results": all_results
    }


def split_documents(docs: List[str], chunk_size: int = 1000) -> List[str]:
    """
    将文档分块

    Args:
        docs: 文档列表
        chunk_size: 每个块的大小

    Returns:
        分块后的文本列表

    Note:
        TODO: 实现文档分块逻辑
        - 可以按段落、按固定长度分块
        - 考虑重叠以保证上下文连贯
    """
    pass


def merge_results(results: List[Dict]) -> Dict:
    """
    合并各分块的提取结果

    Args:
        results: 各分块的提取结果列表

    Returns:
        合并后的结果字典

    Note:
        TODO: 实现结果合并逻辑
        - 对于相同字段，去重或合并
        - 保持数据结构一致性
    """
    pass
