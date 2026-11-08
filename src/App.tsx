import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import AIAssistantPage from '@/pages/AIAssistantPage'
import CollectorPage from '@/pages/CollectorPage'
import Dashboard from '@/pages/Dashboard'
import FileDetailPage from '@/pages/FileDetailPage'
import Landing from '@/pages/Landing'
import { FavoritesPage, PptCenter } from '@/pages/LibraryPages'
import NotFound from '@/pages/NotFound'
import OrganizePage from '@/pages/OrganizePage'
import ReimbursementPage from '@/pages/ReimbursementPage'
import SearchPage from '@/pages/SearchPage'
import SettingsPage from '@/pages/SettingsPage'
import TrashPage from '@/pages/TrashPage'
import LoginPage from '@/pages/LoginPage'
import TeamPage from '@/pages/TeamPage'
import { AppProvider } from '@/store/AppStore'
import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { TeamProvider, useTeam } from '@/team/TeamProvider'
import type { TeamModuleKey } from '@/team/modules'

/** 路由切换后回到顶部 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <Application />
    </AuthProvider>
  )
}

function Application() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-slate-400">正在打开表格汇…</div>
  }

  return (
    <AppProvider key={user?.id ?? 'guest'} userId={user?.id ?? 'guest'}>
      <TeamProvider>
      <>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<ModuleRoute module="dashboard"><Dashboard /></ModuleRoute>} />
            <Route path="/search" element={<ModuleRoute module="search"><SearchPage /></ModuleRoute>} />
            <Route path="/favorites" element={<ModuleRoute module="favorites"><FavoritesPage /></ModuleRoute>} />
            <Route path="/tables" element={<Navigate to="/dashboard" replace />} />
            <Route path="/plans" element={<Navigate to="/dashboard" replace />} />
            <Route path="/ppt" element={<ModuleRoute module="ppt"><PptCenter /></ModuleRoute>} />
            <Route path="/files" element={<Navigate to="/dashboard" replace />} />
            <Route path="/file/:id" element={<ModuleRoute module="files"><FileDetailPage /></ModuleRoute>} />
            <Route path="/reimbursement" element={<ModuleRoute module="reimbursement"><ReimbursementPage /></ModuleRoute>} />
            <Route path="/ai" element={<ModuleRoute module="ai"><AIAssistantPage /></ModuleRoute>} />
            <Route path="/organize" element={<ModuleRoute module="organize"><OrganizePage /></ModuleRoute>} />
            <Route path="/collector" element={<ModuleRoute module="collector"><CollectorPage /></ModuleRoute>} />
            <Route path="/trash" element={<ModuleRoute module="trash"><TrashPage /></ModuleRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
      </TeamProvider>
    </AppProvider>
  )
}

function ModuleRoute({ module, children }: { module: TeamModuleKey; children: ReactNode }) {
  const { membership, permissions, loading } = useTeam()
  if (loading) return <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">正在读取团队权限…</div>
  if (membership && !permissions[module]) {
    return <div className="mx-auto mt-16 max-w-lg rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-slate-200"><h2 className="text-lg font-semibold text-slate-900">此区域暂不可访问</h2><p className="mt-2 text-sm text-slate-500">团队负责人限制了此功能。如需开通，请联系房间创建者。</p></div>
  }
  return children
}
