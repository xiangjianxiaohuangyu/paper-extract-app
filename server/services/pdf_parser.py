"""
PDF 解析服务
负责解析 PDF 文件并提取文本内容
"""
#print(">>> import pdf_parser...")
from typing import Tuple
from langchain_community.document_loaders import PyPDFLoader


def parse_pdf(file_path: str) -> Tuple[str, str]:
    """
    解析 PDF 文件

    Returns:
        (content, error_msg): 文本内容 和 错误信息（空字符串表示成功）
    """
    try:
        print(f"解析 PDF 路径: {file_path}")
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        if not documents:
            error_msg = "loader.load() 返回空文档列表"
            print(error_msg)
            return "", error_msg

        content = "\n".join([doc.page_content for doc in documents])

        if not content.strip():
            error_msg = "解析内容为空，可能是图片型PDF（扫描件）"
            print(error_msg)
            return "", error_msg

        print(f"解析成功，内容长度: {len(content)} 字符")
        return content, ""

    except Exception as e:
        error_msg = f"PDF 解析失败: {str(e)}"
        print(error_msg)
        return "", error_msg

