"""
PDF 解析服务
负责解析 PDF 文件并提取文本内容
"""
from typing import Optional
from langchain_community.document_loaders import PyPDFLoader


def parse_pdf(file_path: str) -> Optional[str]:
    """
    解析 PDF 文件，返回完整的文本内容

    Args:
        file_path: PDF 文件路径

    Returns:
        PDF 的完整文本内容
    """
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        # 合并所有页面的文本内容
        content = "\n".join([doc.page_content for doc in documents])
        return content
    except Exception as e:
        print(f"PDF 解析失败: {e}")
        return None


def get_pdf_info(file_path: str) -> dict:
    """
    获取 PDF 文件的基本信息

    Args:
        file_path: PDF 文件路径

    Returns:
        包含页数、标题等信息的字典
    """
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        return {
            "pages": len(documents),
            "success": True
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

