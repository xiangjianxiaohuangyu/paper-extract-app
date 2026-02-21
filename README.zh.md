# AI Paper Extractor

[English](./README.md) | [中文](./README.zh.md)

---

## 项目简介

AI Paper Extractor 是一款基于 Electron + React + Python + LLM 构建的跨平台桌面工具，用于从学术论文中自动提取结构化信息，并支持导出为标准化数据结果。

该项目定位为：

1. 面向科研人员的论文信息结构化工具
2. 面向开发者的可扩展 LLM 桌面应用模板
3. 前后端解耦 + 可独立打包部署的工程化示例

## 核心亮点

### 1. 本地桌面架构

- 基于 Electron 构建
- 前端使用 Vite + React + TypeScript
- 后端使用 Python FastAPI
- 支持 PyInstaller 打包为独立可执行文件

**优势：**

- 不依赖浏览器环境
- 可本地离线部署（模型 API 除外）
- 适用于企业内网或科研环境

### 2. AI 驱动的结构化论文解析

支持从 PDF 中自动提取：

- 论文标题
- 作者信息
- 摘要
- 研究方法
- 实验结果
- 结论
- 自定义字段（支持扩展）

**技术特性：**

- 基于 pypdf 文本解析
- 支持多模型供应商
- 支持自定义 Prompt 扩展
- 兼容 OpenAI API 协议

### 3. 多模型兼容架构

支持：

- 通义千问
- OpenAI
- 任意兼容 OpenAI API 协议的模型服务
- 本地部署模型（如 vLLM / Ollama / 企业私有模型）

模型配置与业务逻辑解耦，支持多配置保存与切换。

### 4. 完整工程化构建流程

支持：

- 开发模式热更新
- 后端独立打包
- 全量安装包构建
- 自动环境检测
- 前后端分离部署

## 界面功能说明

**分析页面**

- 拖拽上传 PDF
- 批量处理
- 一键结构化提取

**配置页面**

- 选择模型供应商
- 填写 API Key
- 自定义 Base URL
- 多配置管理

**环境检测**

- 自动检测 Python 环境
- 自动检测后端服务状态
- 提供异常提示

## 生产模式

### 下载

从 GitHub Releases 下载构建完成的安装包：

👉 https://github.com/xiangjianxiaohuangyu/paper-extract-app/releases

安装后即可使用，无需手动配置 Python 环境。

### 生产模式架构

```
Electron App
   ↓
backend.exe (PyInstaller 打包)
   ↓
FastAPI 服务 (localhost:8000)
```

**特点：**

- 后端已编译为可执行文件
- 无需 Python 环境
- 一键安装运行
- 适合非开发人员

## 开发模式

### 环境要求

- Node.js 18+
- Python 3.10+
- Git

### 克隆项目

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

将同时启动：

- Vite Dev Server → http://localhost:5173
- FastAPI Backend → http://localhost:8000
- Electron Desktop App

### 单独运行组件

**仅前端：**

```bash
npm run dev:vite
```

**仅后端：**

```bash
npm run server
```

或：

```bash
python server/run.py
```

**仅 Electron：**

```bash
npm run electron:dev
```

## 构建发布流程

### 1. 构建前端

```bash
npm run build
```

### 2. 构建后端

```bash
npm run build:server
```

### 3. 构建完整安装包

```bash
npm run build:all
```

构建完成后，安装包位于：`release/`

## 技术栈

**前端：**

- Electron 28
- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand

**后端：**

- Python 3.10+
- FastAPI
- pypdf
- LangChain（可选扩展）
- PyInstaller

## 项目结构

```
paper-extract-app/
├─ electron/
├─ src/                # React 前端
├─ server/             # Python 后端
├─ release/            # 构建产物
└─ package.json
```

## 适用场景

- 批量论文整理
- 科研信息结构化
- 学术数据预处理
- LLM 工程化实践
- 桌面 AI 工具开发模板

## 作者

- 作者：lzp
- 个人网站：https://xiangjianxiaohuangyu.top/
- 邮箱：zhipenglin02@163.com
- 技术方向：AI 工程化 / 桌面应用架构 / LLM 应用开发

## 技术支持

如有问题或建议，请提交 Issue：

https://github.com/xiangjianxiaohuangyu/paper-extract-app/issues
