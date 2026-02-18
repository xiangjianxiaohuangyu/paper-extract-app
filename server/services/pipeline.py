"""
流水线服务
负责整合 PDF 解析、分块、字段提取、结果汇总的完整流程
"""
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
    预估 token 数量和费用

    Args:
        content: PDF 文本内容
        fields: 需要提取的字段列表
        model_name: 模型名称

    Returns:
        (input_tokens, estimated_cost): token 数量和费用字符串
    """
    # 构建 prompt（与 llm_service.extract_fields 保持一致）
    fields_str = ", ".join(fields)
    prompt = f"""请从以下论文内容中提取指定字段：{fields_str}

请严格按照以下 JSON 格式返回，不要包含其他内容：
{{
    "字段名": "提取的内容",
    ...
}}

如果某个字段不存在，请返回空字符串。

论文内容：
{content[:150000]}
"""
    input_tokens = estimate_tokens(prompt)
    estimated_cost = estimate_cost(input_tokens, model_name=model_name)

    return input_tokens, estimated_cost


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
    api_key = config.get("api_key", "")
    model_name = config.get("model_name", "qwen-max")

    for file_path in file_paths:
        await push_log("analyze", f"开始解析文件: {file_path}")

        # Step 1: 解析 PDF
        await push_log("analyze", "正在解析 PDF...")
        content = pdf_parser.parse_pdf(file_path)
        await push_log("analyze", f"PDF 解析完成，内容长度: {len(content) if content else 0} 字符")

        # Step 2: 预估 token 和费用
        input_tokens, estimated_cost = await estimate_and_log_tokens(content, fields, model_name)
        await push_log("analyze", f"预估输入 token: {input_tokens}，预估费用: {estimated_cost}")

        # Step 3: 字段提取
        await push_log("analyze", "正在调用模型提取字段...")

        result = llm_service.extract_fields(content, fields, model_name, api_key)
        extracted = result.get("parsed", {})
        raw_response = result.get("raw", "")
        await push_log("analyze", f"模型原始返回: {raw_response[:500]}...")
        await push_log("analyze", "字段提取完成")

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
