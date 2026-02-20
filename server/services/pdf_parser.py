"""
PDF 解析服务
负责解析 PDF 文件并提取文本内容
"""
#print(">>> import pdf_parser...")
from typing import Optional
from langchain_community.document_loaders import PyPDFLoader


# def parse_pdf(file_path: str) -> Optional[str]:
#     try:
#         loader = PyPDFLoader(file_path)
#         documents = loader.load()
#         # 合并所有页面的文本内容
#         content = "\n".join([doc.page_content for doc in documents])
#         return content
#     except Exception as e:
#         print(f"PDF 解析失败: {e}")
#         return None



def parse_pdf(file_path: str) -> str:
    try:
        print(f"解析 PDF 路径: {file_path}")
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        if not documents:
            print("loader.load() 返回空文档列表")
        content = "\n".join([doc.page_content for doc in documents])
        if not content.strip():
            print("解析内容为空")
        return content
    except Exception as e:
        print(f"PDF 解析失败: {e}")
        return ""

