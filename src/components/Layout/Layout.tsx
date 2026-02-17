import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧固定导航栏 */}
      <Sidebar />

      {/* 右侧内容区动态切换 */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
