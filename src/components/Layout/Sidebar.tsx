import { NavLink } from 'react-router-dom'

function Sidebar() {
  const navItems = [
    { path: '/analyze', label: '文章解析', icon: '📄' },
    { path: '/config', label: '基础配置', icon: '⚙️' },
    { path: '/env-check', label: '环境检测', icon: '🔧' },
  ]

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* 标题 */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">论文提取工具</h1>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 版本信息 */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">v1.0.0</p>
      </div>
    </aside>
  )
}

export default Sidebar
