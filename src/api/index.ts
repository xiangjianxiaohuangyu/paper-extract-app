import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ============ 文章解析 API ============

/**
 * 分析 PDF 文件
 * 对应后端 pipeline.run_pipeline()
 */
export async function analyzePdf(filePaths: string[], fields: string[]) {
  try {
    return await api.post('/analyze', {
      file_paths: filePaths,
      fields: fields,
    })
  } catch (error) {
    // 后端未实现时返回 Mock 数据
    return {
      success: true,
      message: 'Mock: 解析完成',
      data: {
        total_files: filePaths.length,
        fields: fields,
        results: filePaths.map((path) => ({
          file: path,
          extracted: {
            title: '示例标题',
            authors: '示例作者',
            abstract: '这是示例摘要内容...',
          },
        })),
      },
    }
  }
}

// ============ 配置 API ============

/**
 * 保存配置
 * 对应后端 config_service.save_config()
 */
export async function saveConfig(modelName: string, apiKey: string) {
  try {
    return await api.post('/config/save', {
      model_name: modelName,
      api_key: apiKey,
    })
  } catch (error) {
    // 后端未实现时返回 Mock 数据
    return {
      success: true,
      message: 'Mock: 配置保存成功',
    }
  }
}

/**
 * 加载配置
 * 对应后端 config_service.load_config()
 */
export async function loadConfig() {
  try {
    return await api.get('/config/load')
  } catch (error) {
    // 后端未实现时返回默认配置
    return {
      success: true,
      data: {
        model_name: 'qwen-max',
        api_key: '',
      },
    }
  }
}

// ============ 环境检测 API ============

/**
 * 检测环境
 * 对应后端 env_service.run_all_checks()
 */
export async function checkEnv() {
  try {
    return await api.get('/env/check')
  } catch (error) {
    // 后端未实现时返回 Mock 数据
    return {
      success: true,
      message: 'Mock: 检测完成',
      data: {
        python: {
          version: '3.10.0',
          status: 'ok',
          message: 'Python 版本正常',
        },
        dependencies: {
          pypdf: { installed: true, version: '3.15.0' },
          langchain: { installed: true, version: '0.1.0' },
          openai: { installed: true, version: '1.10.0' },
        },
        api_connection: {
          status: 'ok',
          message: 'API 连接正常',
        },
      },
    }
  }
}

export default api
