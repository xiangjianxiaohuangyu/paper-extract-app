"""
流水线服务
负责整合 PDF 解析、分块、字段提取、结果汇总的完整流程
"""
from typing import List, Dict
from . import pdf_parser, llm_service
from .log_service import push_log

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
    for file_path in file_paths:
        await push_log("analyze", f"开始解析文件: {file_path}")

        # Step 1: 解析 PDF
        await push_log("analyze", "正在解析 PDF...")
        content = pdf_parser.parse_pdf(file_path)
        await push_log("analyze", f"PDF 解析完成，内容长度: {len(content) if content else 0} 字符")

        # Step 2: 字段提取
        await push_log("analyze", "正在调用模型提取字段...")
        extracted = llm_service.extract_fields(content, fields)
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
