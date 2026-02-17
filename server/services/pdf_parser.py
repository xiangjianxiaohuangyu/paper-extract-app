"""
PDF 解析服务
负责解析 PDF 文件并提取文本内容
"""
from typing import List


def parse_pdf(file_path: str) -> List[str]:
    """
    解析 PDF 文件，返回文本块列表

    Args:
        file_path: PDF 文件路径

    Returns:
        文本块列表

    Note:
        TODO: 实现 PDF 解析逻辑
        - 使用 pypdf 或 pdfplumber 库读取 PDF
        - 将文本内容分块返回
    """
    pass


def get_pdf_info(file_path: str) -> dict:
    """
    获取 PDF 文件的基本信息

    Args:
        file_path: PDF 文件路径

    Returns:
        包含页数、标题等信息的字典

    Note:
        TODO: 实现获取 PDF 元数据
    """
    pass
