# AI Paper Extractor

[English](#english) | [中文](#中文)

---

## English

## 中文

### 项目简介 / Project Overview

AI Paper Extractor 是一款基于 Electron + React + Python + LLM 构建的跨平台桌面工具，用于从学术论文中自动提取结构化信息，并支持导出为标准化数据结果。
AI Paper Extractor is a cross-platform desktop tool built with Electron + React + Python + LLM. It automatically extracts structured information from academic papers and exports standardized data results.

该项目定位为：
This project is positioned as:

面向科研人员的论文信息结构化工具（A structured paper information tool for researchers）

面向开发者的可扩展 LLM 桌面应用模板（An extensible LLM desktop application template for developers）

前后端解耦 + 可独立打包部署的工程化示例（An engineering example with decoupled frontend/backend and independent packaging and deployment）

### 核心亮点 / Core Features

#### 1. 本地桌面架构（非纯 Web）/ Local Desktop Architecture (Not Pure Web)

基于 Electron 构建
Built with Electron

前端使用 Vite + React + TypeScript
Frontend: Vite + React + TypeScript

后端使用 Python FastAPI
Backend: Python FastAPI

支持 PyInstaller 打包为独立可执行文件
Supports PyInstaller packaging to standalone executable

**优势：**
**Advantages:**

不依赖浏览器环境
No browser dependency

可本地离线部署（模型 API 除外）
Can be deployed offline locally (except for model API)

适用于企业内网或科研环境
Suitable for enterprise intranet or research environments

#### 2. AI 驱动的结构化论文解析 / AI-Powered Structured Paper Parsing

支持从 PDF 中自动提取：
Automatically extracts from PDFs:

论文标题
Paper Title

作者信息
Author Information

摘要
Abstract

研究方法
Research Methods

实验结果
Experimental Results

结论
Conclusions

自定义字段（支持扩展）
Custom Fields (extensible)

**技术特性：**
**Technical Features:**

基于 pypdf 文本解析
Based on pypdf text parsing

支持多模型供应商
Supports multiple model providers

支持自定义 Prompt 扩展
Supports custom Prompt extension

兼容 OpenAI API 协议
Compatible with OpenAI API protocol

#### 3. 多模型兼容架构 / Multi-Model Compatible Architecture

支持：
Supports:

通义千问
Qwen (Tongyi Qianwen)

OpenAI
OpenAI

任意兼容 OpenAI API 协议的模型服务
Any model service compatible with OpenAI API protocol

本地部署模型（如 vLLM / Ollama / 企业私有模型）
Locally deployed models (e.g., vLLM / Ollama / Enterprise private models)

模型配置与业务逻辑解耦，支持多配置保存与切换。
Model configuration is decoupled from business logic, supporting multiple configuration saves and switches.

#### 4. 完整工程化构建流程 / Complete Engineering Build Process

支持：
Supports:

开发模式热更新
Hot reload in development mode

后端独立打包
Independent backend packaging

全量安装包构建
Full installer build

自动环境检测
Automatic environment detection

前后端分离部署
Frontend/backend separated deployment

### 界面功能说明 / Interface Overview

**分析页面 / Analysis Page**

拖拽上传 PDF
Drag and drop PDF upload

批量处理
Batch processing

一键结构化提取
One-click structured extraction

**配置页面 / Configuration Page**

选择模型供应商
Select model provider

填写 API Key
Fill in API Key

自定义 Base URL
Custom Base URL

多配置管理
Multi-configuration management

**环境检测 / Environment Detection**

自动检测 Python 环境
Auto-detect Python environment

自动检测后端服务状态
Auto-detect backend service status

提供异常提示
Provide exception alerts

### 生产模式（用户使用）/ Production Mode (For Users)

#### 下载 / Download

从 GitHub Releases 下载构建完成的安装包：
Download the built installer from Git Releases:

👉 https://github.com/xiangjianxiaohuangyu/paper-extract-app/releases

安装后即可使用，无需手动配置 Python 环境。
After installation, you can use it directly without manually configuring Python environment.

#### 生产模式架构 / Production Architecture

```
Electron App
   ↓
backend.exe (PyInstaller 打包 / PyInstaller packaged)
   ↓
FastAPI 服务 / FastAPI Service (localhost:8000)
```

**特点：**
**Features:**

后端已编译为可执行文件
Backend compiled to executable

无需 Python 环境
No Python environment required

一键安装运行
One-click installation and running

适合非开发人员
Suitable for non-developers

### 开发模式（开发者使用）/ Development Mode (For Developers)

#### 环境要求 / Environment Requirements

Node.js 18+

Python 3.10+

Git

#### 克隆项目 / Clone Project

```bash
git clone https://github.com/xiangjianxiaohuangyu/paper-extract-app.git
cd paper-extract-app
```

#### 安装前端依赖 / Install Frontend Dependencies

```bash
npm install
```

#### 安装后端依赖 / Install Backend Dependencies

```bash
cd server
pip install -r requirements.txt
cd ..
```

#### 启动开发模式 / Start Development Mode

```bash
npm run dev
```

将同时启动：
This will simultaneously start:

Vite Dev Server → http://localhost:5173
Vite Dev Server → http://localhost:5173

FastAPI Backend → http://localhost:8000
FastAPI Backend → http://localhost:8000

Electron Desktop App
Electron Desktop App

#### 单独运行组件 / Run Components Individually

**仅前端 / Frontend only:**
```bash
npm run dev:vite
```

**仅后端 / Backend only:**
```bash
npm run server
```
或 / or:
```bash
python server/run.py
```

**仅 Electron / Electron only:**
```bash
npm run electron:dev
```

### 构建发布流程 / Build & Release Process

#### 1. 构建前端 / Build Frontend

```bash
npm run build
```

#### 2. 构建后端（PyInstaller）/ Build Backend (PyInstaller)

```bash
npm run build:server
```

#### 3. 构建完整安装包 / Build Complete Installer

```bash
npm run build:all
```

构建完成后，安装包位于：
After build completes, the installer is located in:

`release/`

### 技术栈 / Tech Stack

**前端 / Frontend:**

Electron 28

React 18

TypeScript

Vite

Ant Design 5

Zustand

**后端 / Backend:**

Python 3.10+

FastAPI

pypdf

LangChain (optional extension)

PyInstaller

### 项目结构 / Project Structure

```
paper-extract-app/
├─ electron/
├─ src/                # React 前端 / React Frontend
├─ server/             # Python 后端 / Python Backend
├─ release/            # 构建产物 / Build Output
└─ package.json
```

### 适用场景 / Use Cases

批量论文整理（Batch paper organization）

科研信息结构化（Scientific research information structuring）

学术数据预处理（Academic data preprocessing）

LLM 工程化实践（LLM engineering practice）

桌面 AI 工具开发模板（Desktop AI tool development template）

### 作者信息 / Author

作者（Name）：lzp

个人网站（Website）：https://xiangjianxiaohuangyu.top/

邮箱（Email）：zhipenglin02@163.com

技术方向：（例如：AI 工程化 / 桌面应用架构 / LLM 应用开发）
Technical Focus: (e.g., AI Engineering / Desktop Application Architecture / LLM Application Development)

### 技术支持 / Support

如有问题或建议，请提交 Issue：
For issues or suggestions, please submit an Issue:

https://github.com/xiangjianxiaohuangyu/paper-extract-app/issues
