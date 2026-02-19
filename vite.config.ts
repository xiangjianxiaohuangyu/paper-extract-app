// 从 Vite 中引入 defineConfig 用于类型推导和配置定义
import { defineConfig } from 'vite'
// 引入 React 插件，使 Vite 支持 React 的 JSX/TSX 语法
import react from '@vitejs/plugin-react'
// Node.js 内置 path 模块，用于处理路径
import path from 'path'

// 默认导出 Vite 配置
export default defineConfig(({ mode }) => {
  // 判断当前环境是否为生产环境
  const isProd = mode === 'production'

  return {
    // base 是部署时的基础路径，'./' 表示相对路径
    base: './',

    // 全局常量定义，可以在代码中通过 __API_BASE_URL__ 访问
    // 开发环境使用相对路径 /api，生产环境使用完整 URL
    define: {
      __API_BASE_URL__: JSON.stringify(
        isProd ? 'http://127.0.0.1:8000/api' : '/api'
      )
    },

    // 插件配置
    plugins: [
      react() // 启用 React 支持
    ],

    // 模块解析配置
    resolve: {
      alias: {
        // '@' 作为 src 的别名，方便在项目中导入模块
        '@': path.resolve(__dirname, './src'),
      },
    },

    // 开发服务器配置
    server: {
      port: 5173, // 开发服务器端口
      open: false, // 启动时是否自动打开浏览器
      proxy: {
        // 配置代理，将 /api 请求转发到后端
        '/api': {
          target: 'http://127.0.0.1:8000', // 后端接口地址
          changeOrigin: true, // 是否修改 origin，解决跨域问题
        },
      },
    },

    // 打包配置
    build: {
      outDir: 'dist', // 输出目录
      emptyOutDir: true, // 打包前清空输出目录
    },
  }
})
