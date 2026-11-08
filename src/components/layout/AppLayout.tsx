import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sidebar, SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '@/auth/AuthProvider'

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, status } = useAuth()

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Ctrl / Cmd + K 直达搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        navigate('/search')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  if (status === 'loading') return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">正在检查登录状态…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />

      {/* 移动端抽屉 */}
      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setNavOpen(false)}
          />
          <div className="relative h-full w-[268px] max-w-[82%] bg-white shadow-pop animate-slide-in-right">
            <button
              onClick={() => setNavOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="关闭导航"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[256px]">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main className="pb-8 lg:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
