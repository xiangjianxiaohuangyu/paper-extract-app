import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

export default function Toast() {
  const { toast, hideToast } = useAppStore()
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (toast) {
      setIsExiting(false)
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => {
          hideToast()
        }, 300) // 等待淡出动画完成后清除
      }, 2700) // 2.7秒显示 + 0.3秒淡出 = 3秒

      return () => clearTimeout(timer)
    }
  }, [toast, hideToast])

  if (!toast) return null

  const isSuccess = toast.type === 'success'

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isSuccess ? 'bg-state-success' : 'bg-state-error'
      } text-white ${isExiting ? 'opacity-0 transform translate-x-10' : 'opacity-100 transform translate-x-0'}`}
    >
      {isSuccess ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span className="font-medium">{toast.message}</span>
    </div>
  )
}
