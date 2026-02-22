import { NavLink } from 'react-router-dom'
import { FileText, Settings, Terminal, Info } from 'lucide-react'

function Sidebar() {
  const navItems = [
    { path: '/analyze', label: '文章解析', icon: FileText },
    { path: '/config', label: '基础配置', icon: Settings },
    { path: '/env-check', label: '环境检测', icon: Terminal },
    { path: '/about', label: '关于', icon: Info },
  ]

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
      {/* 标题 */}
      <div className="h-28 flex items-center px-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary leading-tight">智析论文引擎</h1>
          <p className="text-sm text-text-muted mt-1.5">AI Paper Extractor</p>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-accent-light text-accent-primary'
                  : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-base">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 版本信息 */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-text-muted text-center">v1.0.0</p>
      </div>
    </aside>
  )
}

export default Sidebar
