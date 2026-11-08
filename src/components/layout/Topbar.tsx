import { Bell, ChevronDown, LogOut, Menu, Search, Settings, Sparkles, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, MenuDivider, MenuItem } from '@/components/ui/Dropdown'
import { IconButton } from '@/components/ui/Button'
import { useApp } from '@/store/AppStore'
import { cn } from '@/lib/utils'
import { PAGE_TITLES } from './nav'
import { useAuth } from '@/auth/AuthProvider'

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useApp()
  const { user, logout } = useAuth()
  const username = user?.username ?? '用户'
  const meta =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/file/') || location.pathname.startsWith('/home')
      ? { title: '文件详情', desc: '查看文件信息、AI 总结与版本历史' }
      : undefined)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onOpenNav}
          className="-ml-1 rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          aria-label="打开导航"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
            {meta?.title ?? '表格汇'}
          </h1>
          {meta?.desc ? (
            <p className="hidden truncate text-[12px] text-slate-400 sm:block">{meta.desc}</p>
          ) : null}
        </div>

        {/* 桌面端快速搜索入口 */}
        <button
          onClick={() => navigate('/search')}
          className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[13px] text-slate-400 ring-1 ring-slate-200 transition-colors hover:bg-white hover:text-slate-600 md:flex md:w-64 lg:w-72"
        >
          <Search size={15} />
          <span className="flex-1 text-left">搜索表格、客户、方案…</span>
          <kbd className="rounded-md bg-white px-1.5 py-0.5 text-[10.5px] font-medium text-slate-400 ring-1 ring-slate-200">
            Ctrl K
          </kbd>
        </button>

        <div className="flex items-center gap-1.5">
          <Dropdown
            trigger={() => (
              <IconButton label="通知">
                <span className="relative">
                  <Bell size={18} />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </span>
              </IconButton>
            )}
            width="w-80"
          >
            {(close) => (
              <div>
                <p className="px-3 py-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                  通知
                </p>
                {[
                  { t: '星河科技年度合作方案 已更新', d: '10 分钟前' },
                  { t: '检测到「星河科技合作方案」有新版本 V3', d: '昨天 18:32 · AI 版本检查' },
                  { t: '12 笔员工报销等待审核', d: '昨天 09:10 · 财务' },
                ].map((n) => (
                  <button
                    key={n.t}
                    onClick={() => {
                      close()
                      toast('已标记为已读', 'info')
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="text-[13px] font-medium text-slate-700">{n.t}</span>
                    <span className="text-[11.5px] text-slate-400">{n.d}</span>
                  </button>
                ))}
              </div>
            )}
          </Dropdown>

          <button
            onClick={() => navigate('/ai')}
            className={cn(
              'hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-orch-600 px-3 py-2 text-[13px] font-medium text-white shadow-glow transition-all hover:brightness-110 sm:flex',
            )}
          >
            <Sparkles size={14} />
            AI
          </button>

          <Dropdown
            trigger={() => (
              <button className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-1.5 transition-colors hover:bg-slate-100">
                <Avatar name={username} size={30} />
                <span className="hidden max-w-28 truncate text-[13.5px] font-medium text-slate-700 sm:block">{username}</span>
                <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
              </button>
            )}
          >
            {(close) => (
              <div>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar name={username} size={38} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-slate-800">{username}</p>
                    <p className="truncate text-[11.5px] text-slate-400">表格汇账号</p>
                  </div>
                </div>
                <MenuDivider />
                <MenuItem
                  icon={<User size={15} />}
                  onClick={() => {
                    close()
                    navigate('/settings')
                  }}
                >
                  个人资料
                </MenuItem>
                <MenuItem
                  icon={<Settings size={15} />}
                  onClick={() => {
                    close()
                    navigate('/settings')
                  }}
                >
                  设置
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<LogOut size={15} />}
                  danger
                  onClick={() => {
                    close()
                    void logout().then(() => navigate('/login', { replace: true }))
                    toast('已退出登录', 'info')
                  }}
                >
                  退出登录
                </MenuItem>
              </div>
            )}
          </Dropdown>
        </div>
      </div>
    </header>
  )
}
