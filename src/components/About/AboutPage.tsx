import { FileText, Globe, Github, ExternalLink, Sparkles } from 'lucide-react'

function AboutPage() {
  const openLink = (url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-text-primary mb-6">关于</h1>

      {/* 个人信息 */}
      <div className="card p-6 mb-6">
        <h2 className="text-base font-medium text-text-secondary mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-primary" />
          个人信息
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-0">
            <span className="text-text-muted w-12">姓名:</span>
            <span className="text-text-primary">lzp</span>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-text-muted" />
            <button
              onClick={() => openLink('https://xiangjianxiaohuangyu.top/')}
              className="text-accent-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              https://xiangjianxiaohuangyu.top/
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Github className="w-4 h-4 text-text-muted" />
            <button
              onClick={() => openLink('https://github.com/xiangjianxiaohuangyu')}
              className="text-accent-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              https://github.com/xiangjianxiaohuangyu
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 后续更新计划 */}
      <div className="card p-6">
        <h2 className="text-base font-medium text-text-secondary mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent-primary" />
          后续更新计划
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="text-text-secondary">【新增】增加历史保存功能，构建本地知识库</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text-secondary">【新增】文本清洗，去除页眉页脚、空行乱码等内容</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text-secondary">【新增】中断解析功能，并保存已解析的结果</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text-secondary">【优化】并行解析论文，提高解析速度</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default AboutPage
