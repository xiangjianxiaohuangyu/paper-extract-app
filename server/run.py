import sys
import os

# 将 server 目录添加到 Python 路径
server_dir = os.path.dirname(os.path.abspath(__file__))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

# 设置 PYTHONPATH
os.environ['PYTHONPATH'] = server_dir

# PyInstaller 打包后处理 tiktoken 数据路径
if getattr(sys, 'frozen', False):
    # 获取打包后的资源路径
    base_path = sys._MEIPASS

    # 将 tiktoken 数据目录添加到 Python 路径，使其能找到 tiktoken_ext
    tiktoken_ext_path = os.path.join(base_path, 'tiktoken_ext')
    if os.path.exists(tiktoken_ext_path) and tiktoken_ext_path not in sys.path:
        sys.path.insert(0, tiktoken_ext_path)

    # 设置 PYTHONPATH 包含 tiktoken_ext
    os.environ['PYTHONPATH'] = server_dir + os.pathsep + base_path

if __name__ == "__main__":
    import uvicorn
    from main import app

    # 生产模式不使用 reload
    uvicorn.run(app, host="0.0.0.0", port=8000)
