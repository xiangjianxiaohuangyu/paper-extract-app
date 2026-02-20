# 论文提取桌面应用 - 项目结构文档

## 一、项目概述

这是一个基于 **Electron + React + Python** 的桌面应用程序，用于从 PDF 论文中提取结构化信息。

### 核心技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Zustand + TailwindCSS |
| 后端 | Python FastAPI + Uvicorn |
| 桌面 | Electron 28 |
| AI | LangChain + OpenAI API (兼容通义千问) |

---

## 二、开发模式整体进程架构

```
┌────────────────────────────────────────────┐
│                 操作系统                   │
└────────────────────────────────────────────┘
                    │
                    ▼
          npm run dev (concurrently)
                    │
 ┌──────────────────┼──────────────────┐
 ▼                  ▼                  ▼

Vite Dev Server   Uvicorn进程        Electron进程
(端口5173)        (端口8000)         (主进程)
```

---

## 三、真实运行结构

```
[ Node.js 进程 ]
    ├── Vite Dev Server (5173)
    │       └── 提供前端资源 (React)
    │
    ├── Python 进程
    │       └── Uvicorn
    │              └── FastAPI App
    │                     └── 业务逻辑
    │
    └── Electron 主进程
            └── 创建 BrowserWindow
                   └── 加载 http://localhost:5173
                          └── React 渲染进程
                                 └── 调用 http://localhost:8000/api
```

---

## 四、数据流路径（一次接口调用）

```
用户点击按钮 →
React (5173)
   ↓ HTTP 请求
Uvicorn (8000)
   ↓
FastAPI 路由
   ↓
pipeline (PDF解析 + LLM提取)
   ↓
返回 JSON
   ↓
React 更新 UI
```

---

## 五、核心组件职责

### 1. Electron

- **作用**: 创建桌面窗口、管理生命周期、提供 Node API
- **端口**: 不直接处理业务 API

### 2. Vite

- **作用**: 启动前端开发服务器、热更新、编译 React
- **开发模式**: Electron 加载 Vite 提供的页面

### 3. Uvicorn

- **作用**: 监听 8000 端口、处理 HTTP 请求、转发给 FastAPI

### 4. FastAPI

- **作用**: 定义接口、处理逻辑、调用 LLM/PDF/Excel

---

## 六、目录结构

```
paper-extract-app/
├── src/                    # React 前端源码
│   ├── api/               # API 通信层
│   │   ├── index.ts       # HTTP API 封装
│   │   └── websocket.ts   # WebSocket 客户端
│   ├── components/        # React 组件
│   │   ├── Analyze/       # 论文解析页面
│   │   ├── Config/        # 配置管理页面
│   │   ├── EnvCheck/     # 环境检测页面
│   │   ├── Layout/       # 布局组件
│   │   └── Terminal/     # 终端日志面板
│   ├── stores/            # Zustand 状态管理
│   │   └── appStore.ts
│   ├── App.tsx           # 路由配置
│   ├── main.tsx          # 应用入口
│   └── index.css         # 全局样式
│
├── electron/              # Electron 主进程
│   ├── main.cjs         # 主进程入口
│   └── preload.cjs      # 预加载脚本
│
├── server/               # Python 后端
│   ├── main.py          # FastAPI 主入口
│   ├── run.py           # 启动脚本
│   ├── requirements.txt # 依赖列表
│   ├── server.spec      # PyInstaller 配置
│   └── services/        # 业务服务
│       ├── pipeline.py      # 解析流水线
│       ├── pdf_parser.py   # PDF 解析
│       ├── llm_service.py  # LLM 调用
│       ├── config_service.py # 配置管理
│       ├── env_service.py   # 环境检测
│       └── log_service.py  # 日志/WebSocket
│
├── package.json          # npm 配置
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
└── tailwind.config.js    # Tailwind 配置
```

---

## 七、前端模块详解

### 7.1 入口文件

| 文件 | 功能 |
|------|------|
| `src/main.tsx` | React 应用入口，建立 WebSocket 连接，使用 HashRouter 路由 |
| `src/App.tsx` | 路由配置，定义 `/analyze`、`/config`、`/env-check` 三个页面路由 |
| `src/index.css` | 全局 CSS 样式 (Tailwind) |

### 7.2 API 层 (`src/api/`)

| 文件 | 功能 |
|------|------|
| `index.ts` | HTTP API 封装，包含 `analyzePdf()`, `saveConfig()`, `loadConfig()`, `checkEnv()` 等 |
| `websocket.ts` | WebSocket 客户端，用于实时接收后端日志推送 |

### 7.3 状态管理 (`src/stores/`)

| 文件 | 功能 |
|------|------|
| `appStore.ts` | Zustand 全局状态管理，包含: selectedFiles, extractFields, savePath, config, terminalLogs 等 |

### 7.4 页面组件 (`src/components/`)

#### 论文解析页面 (`Analyze/AnalyzePage.tsx`)
- PDF 文件选择/拖拽
- 提取字段配置
- 保存路径/格式选择
- 调用后端解析
- 显示终端日志

#### 配置页面 (`Config/ConfigPage.tsx`)
- 选择模型供应商 (Qwen/OpenAI)
- 模型名称选择
- API Key 管理
- 配置保存/加载/删除

#### 环境检测页面 (`EnvCheck/EnvCheckPage.tsx`)
- Python 版本检测
- 依赖包检测
- API 连接状态检测

#### 终端面板 (`Terminal/TerminalPanel.tsx`)
- 实时日志显示
- 深色主题
- 自动滚动
- 清空日志

---

## 八、后端模块详解

### 8.1 主入口 (`server/main.py`)

**API 端点**:
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/analyze` | POST | 解析 PDF 论文 |
| `/api/config/save` | POST | 保存配置 |
| `/api/config/load` | GET | 加载配置 |
| `/api/config/list` | GET | 获取配置列表 |
| `/api/config/latest` | GET | 获取最近配置 |
| `/api/config/delete` | POST | 删除配置 |
| `/api/env/check` | GET | 环境检测 |
| `/ws/logs` | WebSocket | 日志推送 |

### 8.2 服务模块 (`server/services/`)

| 模块 | 功能 | 关键函数 |
|------|------|----------|
| `pipeline.py` | 整合 PDF 解析、分块、字段提取、结果汇总 | `run_pipeline()` |
| `pdf_parser.py` | 使用 PyPDFLoader 解析 PDF 文件 | `parse_pdf()` |
| `llm_service.py` | 调用通义千问 API 进行字段提取 | `call_llm()`, `extract_fields()` |
| `config_service.py` | 保存/加载/删除用户配置到 JSON | `save_config()`, `load_config()` |
| `env_service.py` | 检测 Python 版本、依赖包、API 连通性 | `run_all_checks()` |
| `log_service.py` | WebSocket 连接管理与日志推送 | `ConnectionManager`, `push_log()` |

---

## 九、生产模式架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     用户安装的 EXE 应用                          │
├─────────────────────────────────────────────────────────────────┤
│  Electron 主进程                                                │
│  ├── 启动 server.exe (Python 后端)                             │
│  ├── 等待服务就绪 (localhost:8000)                            │
│  ├── 创建 BrowserWindow                                         │
│  └── 加载 dist/index.html (前端静态资源)                       │
└─────────────────────────────────────────────────────────────────┘
```

### 构建产物

| 产物 | 位置 | 说明 |
|------|------|------|
| 前端资源 | `dist/` | Vite 构建的静态文件 |
| Python 服务 | `dist/server/server.exe` | PyInstaller 打包的可执行文件 |
| Electron 应用 | `release/论文提取工具 Setup 1.0.0.exe` | NSIS 安装包 |

---

## 十、模块调用关系

```
1. 用户选择 PDF → 前端 AnalyzePage 调用 electronAPI.selectFiles()
2. 开始解析 → 前端调用 analyzePdf() → HTTP POST /api/analyze
3. 后端处理 → main.py 调用 pipeline.run_pipeline()
   - pdf_parser.parse_pdf() 提取文本
   - llm_service.extract_fields() 调用 LLM 提取字段
4. 结果保存 → 支持 JSON/Excel 格式保存到指定目录
5. 日志推送 → 通过 WebSocket 实时推送到前端终端面板
```
