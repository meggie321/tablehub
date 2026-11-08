import { Sparkles, Zap } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { NAV_SECTIONS } from './nav'
import { useAuth } from '@/auth/AuthProvider'
import { useTeam } from '@/team/TeamProvider'
import type { TeamModuleKey } from '@/team/modules'

const NAV_MODULES: Record<string, TeamModuleKey | undefined> = {
  '/dashboard': 'dashboard', '/favorites': 'favorites', '/collector': 'collector', '/ppt': 'ppt',
  '/ai': 'ai', '/organize': 'organize', '/trash': 'trash', '/reimbursement': 'reimbursement',
}

function Logo() {
  return (
    <div className="flex items-center gap-3 px-3">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-orch-600 text-white shadow-glow">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 8h16M4 12.5h16M4 17h9" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-tight tracking-tight text-slate-900">表格汇</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">TableHub</p>
      </div>
    </div>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const { membership, permissions } = useTeam()
  const username = user?.username ?? '用户'
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      const module = NAV_MODULES[item.to]
      return !membership || !module || permissions[module]
    }),
  })).filter((section) => section.items.length > 0)
  return (
    <div className="flex h-full flex-col">
      <div className="pt-5">
        <Logo />
        <p className="mt-3 px-4 text-[12px] leading-relaxed text-slate-400">
          让所有表格，都能被快速找到。
        </p>
      </div>

      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 rounded-xl px-3 py-[7px] text-[13.5px] font-medium transition-all duration-150',
                          isActive
                            ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100/80'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={17}
                            className={cn(
                              'shrink-0 transition-colors',
                              isActive
                                ? item.ai
                                  ? 'text-orch-600'
                                  : 'text-brand-600'
                                : 'text-slate-400 group-hover:text-slate-600',
                            )}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.ai ? (
                            <span className="rounded-md bg-gradient-to-r from-brand-500 to-orch-500 px-1.5 py-px text-[10px] font-semibold text-white">
                              AI
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {(!membership || permissions.collector) ? <div className="mx-1 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-orch-50 p-3.5 ring-1 ring-brand-100/70">
          <div className="flex items-center gap-2 text-brand-700">
            <Sparkles size={14} />
            <span className="text-[12.5px] font-semibold">AI 智能整理</span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
            上传后自动识别客户、类型和关键词，不用手动命名。
          </p>
          <NavLink
            to="/collector"
            onClick={onNavigate}
            className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700 hover:text-brand-800"
          >
            <Zap size={12} />
            立即上传
          </NavLink>
        </div> : null}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50">
          <Avatar name={username} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-slate-800">{username}</p>
            <p className="truncate text-[11.5px] text-slate-400">个人账户</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-100" />
        </div>
      </div>
    </div>
  )
}

/** 桌面端固定侧边栏 */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] border-r border-slate-200/80 bg-white lg:block">
      <SidebarContent />
    </aside>
  )
}
