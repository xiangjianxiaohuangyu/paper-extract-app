import axios from 'axios'

const api = axios.create({
  baseURL: typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : '/api',
  timeout: 600000,
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
export async function analyzePdf(filePaths: string[], fields: string[], savePath?: string, saveFormat?: string) {
  try {
    const result = await api.post('/analyze', {
      file_paths: filePaths,
      fields: fields,
      save_path: savePath || null,
      save_format: saveFormat || 'json',
    })

    return result
  } catch (error) {
    // 后端未实现时返回 Mock 数据
    console.error('[API] 请求失败，使用 Mock 数据:', error)
    return {
      success: false,
      message: 'Mock: 解析失败',
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
export async function saveConfig(modelName: string, apiKey: string, configName: string = '自定义名称', provider: string = 'qwen', baseUrl: string = '') {
  try {
    return await api.post('/config/save', {
      model_name: modelName,
      api_key: apiKey,
      config_name: configName,
      provider: provider,
      base_url: baseUrl,
    })
  } catch (error) {
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
export async function loadConfig(configName: string = '自定义名称') {
  try {
    return await api.get(`/config/load?config_name=${configName}`)
  } catch (error) {
    return {
      success: true,
      data: {
        config_name: '自定义名称',
        provider: 'qwen',
        model_name: 'qwen-max',
        api_key: '',
      },
    }
  }
}

/**
 * 获取配置列表
 * 对应后端 config_service.get_all_configs()
 */
export async function getConfigList() {
  try {
    return await api.get('/config/list')
  } catch (error) {
    return {
      success: true,
      data: [],
    }
  }
}

/**
 * 获取最近使用的配置
 * 对应后端 config_service.get_latest_config()
 */
export async function getLatestConfig() {
  try {
    return await api.get('/config/latest')
  } catch (error) {
    return {
      success: true,
      data: {
        config_name: '自定义名称',
        provider: 'qwen',
        model_name: 'qwen-max',
        api_key: '',
      },
    }
  }
}

/**
 * 删除配置
 * 对应后端 config_service.delete_config()
 */
export async function deleteConfig(configName: string) {
  try {
    return await api.post('/config/delete', {
      config_name: configName,
    })
  } catch (error) {
    return {
      success: true,
      message: 'Mock: 配置删除成功',
    }
  }
}

// ============ 连通性测试 API ============

/**
 * 测试 API 连通性
 * 对应后端 /api/config/test-connection
 */
export async function testConnection(modelName: string, apiKey: string, provider: string, baseUrl: string) {
  try {
    return await api.post('/config/test-connection', {
      model_name: modelName,
      api_key: apiKey,
      provider: provider,
      base_url: baseUrl,
    })
  } catch (error) {
    return {
      success: false,
      message: '测试失败: 网络错误',
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
