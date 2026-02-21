# 论文提取工具

一款桌面应用，帮助你从学术论文中快速提取关键信息。

## 主要功能

- **PDF 论文解析**: 拖拽上传 PDF 论文，自动提取论文内容
- **智能信息提取**: 基于 AI 大模型，智能提取论文中的关键信息，包括：
  - 论文标题
  - 作者信息
  - 摘要
  - 研究方法
  - 实验结果
  - 结论
- **多配置管理**: 支持保存多个配置，满足不同场景需求
- **兼容主流模型**: 支持通义千问、OpenAI 以及任何兼容 OpenAI API 的模型服务

## 界面预览

- **分析页面**: 上传论文，一键提取关键信息
- **配置页面**: 灵活配置模型供应商和 API
- **环境检测**: 自动检测运行环境，确保正常工作

## 下载使用

从 [Releases](https://github.com/xiangjianxiaohuangyu/paper-extract-app/releases) 页面下载安装包。

## 开发模式

### 环境要求

- Node.js 18+
- Python 3.10+
- Git

### 克隆仓库

```bash
git clone https://github.com/xiangjianxiaohuangyu/paper-extract-app.git
cd paper-extract-app
```

### 安装前端依赖

```bash
npm install
```

### 安装后端依赖

```bash
cd server
pip install -r requirements.txt
cd ..
```

### 启动开发模式

```bash
npm run dev
```

这将同时启动：
- Vite 开发服务器 (http://localhost:5173)
- Python 后端服务 (http://localhost:8000)
- Electron 桌面应用

### 单独运行

- **仅前端**: `npm run dev:vite`
- **仅后端**: `npm run server` 或 `python server/run.py`
- **仅 Electron**: `npm run electron:dev`

## 构建发布

### 构建前端

```bash
npm run build
```

### 构建后端 (PyInstaller)

```bash
npm run build:server
```

### 构建完整安装包

```bash
npm run build:all
```

构建完成后，安装包位于 `release` 目录下。

## 配置说明

### 通义千问

- 访问 [阿里云 DashScope](https://dashscope.aliyuncs.com/) 获取 API Key

### OpenAI

- 访问 [OpenAI Platform](https://platform.openai.com/) 获取 API Key

### 自定义 API

支持接入任何兼容 OpenAI API 格式的第三方模型服务（如本地部署的模型）

## 技术支持

如有 Issues，请提交至 [GitHub](https://github.com/xiangjianxiaohuangyu/paper-extract-app/issues)
