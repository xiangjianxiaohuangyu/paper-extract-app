import sys
import os

# 将 server 目录添加到 Python 路径
server_dir = os.path.dirname(os.path.abspath(__file__))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

# 设置 PYTHONPATH
os.environ['PYTHONPATH'] = server_dir

if __name__ == "__main__":
    import uvicorn
    from main import app

    # 生产模式不使用 reload
    uvicorn.run(app, host="0.0.0.0", port=8000)
