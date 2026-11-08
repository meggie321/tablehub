import {
  ArrowRight,
  Clock,
  FileSpreadsheet,
  FileText,
  Presentation,
  Search,
  Sparkles,
  Star,
  Upload,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileTable } from '@/components/files/FileTable'
import { SearchBar } from '@/components/search/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, PageShell, SectionTitle } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Segmented'
import { StatCard } from '@/components/ui/StatCard'
import { Avatar } from '@/components/ui/Avatar'
import { CLIENTS, HOT_SEARCHES } from '@/data/demo'
import { useApp } from '@/store/AppStore'
import { relativeTime } from '@/lib/utils'

export default function Dashboard() {
  const { liveFiles, recents, starredFiles, searchCount, registerSearch } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const sheets = liveFiles.filter((f) => f.kind === 'sheet').length
  const docs = liveFiles.filter((f) => f.kind === 'doc').length
  const ppts = liveFiles.filter((f) => f.kind === 'ppt').length

  /** 客户活跃度：找出最久没更新的客户 */
  const activity = useMemo(() => {
    return CLIENTS.map((c) => {
      const own = liveFiles
        .filter((f) => f.client === c.name)
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      return { client: c, latest: own[0], count: own.length }
    })
      .filter((x) => x.latest)
      .sort((a, b) => +new Date(a.latest.updatedAt) - +new Date(b.latest.updatedAt))
  }, [liveFiles])

  function submit(value?: string) {
    const query = (value ?? q).trim()
    registerSearch()
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <PageShell wide>
      {/* 欢迎 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">
            欢迎回来 👋
          </h2>
          <p className="mt-1.5 text-[14px] text-slate-500">
            今天也来快速找到你需要的表格和方案。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton to="/collector" variant="secondary" icon={<Upload size={15} />}>
            上传文件
          </LinkButton>
          <Button variant="ai" icon={<Sparkles size={15} />} onClick={() => navigate('/ai')}>
            问 AI 助手
          </Button>
        </div>
      </div>

      {/* 全局搜索 */}
      <Card className="relative mt-6 overflow-hidden p-6" padded={false}>
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-brand-100 to-orch-100 blur-3xl"
          aria-hidden
        />
        <div className="relative p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center gap-1.5 rounded-lg bg-brand-50 px-2 text-[11.5px] font-semibold text-brand-700">
              <Search size={11} />
              全局搜索
            </span>
            <span className="text-[12px] text-slate-400">
              共 {liveFiles.length} 个文件可被搜索
            </span>
          </div>

          <h3 className="mt-3 text-[22px] font-semibold tracking-tight text-slate-900">
            今天想找什么？
          </h3>

          <div className="mt-4">
            <SearchBar
              value={q}
              onChange={setQ}
              onSubmit={submit}
              size="hero"
              placeholder="搜索表格名称"
              hotSearches={liveFiles.length ? HOT_SEARCHES : []}
              showHot={liveFiles.length > 0}
              rightSlot={
                <Button variant="primary" onClick={() => submit()}>
                  搜索
                </Button>
              }
            />
          </div>
        </div>
      </Card>

      {/* 数据概览 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={<FileSpreadsheet size={18} />}
          label="全部表格"
          value={sheets}
          hint={sheets ? '+12 本月新增' : '暂无表格'}
          tone="emerald"
        />
        <StatCard
          icon={<FileText size={18} />}
          label="方案文件"
          value={docs}
          hint={docs ? '8 个客户方案' : '暂无方案'}
          tone="brand"
        />
        <StatCard
          icon={<Presentation size={18} />}
          label="PPT"
          value={ppts}
          hint={ppts ? '最近新增 3 个' : '暂无 PPT'}
          tone="amber"
          onClick={() => navigate('/ppt')}
        />
        <StatCard
          icon={<Search size={18} />}
          label="本周搜索"
          value={searchCount}
          hint={searchCount ? '本次会话' : '暂无搜索'}
          tone="violet"
          onClick={() => navigate('/search')}
        />
      </div>

      {/* 最近使用 */}
      <div className="mt-8">
        <SectionTitle
          title="最近使用"
          subtitle="打开过的文件会自动出现在这里"
          action={
            <div className="flex items-center gap-2">
              <Chip onClick={() => navigate('/ppt')}>PPT</Chip>
            </div>
          }
        />
        <div className="mt-4">
          <FileTable files={recents.slice(0, 6)} emptyAction={<LinkButton to="/collector" variant="primary">＋ 上传表格</LinkButton>} />
        </div>
      </div>

      {/* 洞察区 */}
      <div className="mt-8">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orch-500 text-white shadow-glow">
                <Sparkles size={17} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">AI 洞察</h3>
                <p className="text-[12.5px] text-slate-500">
                  基于 {liveFiles.length} 个文件的更新情况自动分析
                </p>
              </div>
            </div>
            {activity.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => navigate('/ai')}>
                让 AI 分析
              </Button>
            )}
          </div>

          {activity.length ? <ul className="mt-5 space-y-2.5">
            {activity.slice(0, 3).map((row, i) => {
              const days = Math.floor((Date.now() - new Date(row.latest.updatedAt).getTime()) / 86400000)
              return (
                <li
                  key={row.client.name}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50/80 p-3.5 ring-1 ring-slate-200/60"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[12px] font-semibold text-slate-500 ring-1 ring-slate-200">
                    {i + 1}
                  </span>
                  <Avatar name={row.client.name} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-slate-800">
                      {row.client.name}
                    </p>
                    <p className="truncate text-[11.5px] text-slate-400">
                      最近更新：{relativeTime(row.latest.updatedAt)} · {row.latest.owner} · 共 {row.count} 个文件
                    </p>
                  </div>
                  <Badge tone={days > 20 ? 'amber' : 'slate'}>
                    <Clock size={11} />
                    {days > 0 ? `${days} 天未更新` : '今天有更新'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    iconRight={<ArrowRight size={13} />}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(row.client.name)}`)}
                  >
                    查看
                  </Button>
                </li>
              )
            })}
          </ul> : (
            <p className="mt-5 rounded-xl bg-slate-50/80 p-4 text-[13px] text-slate-500 ring-1 ring-slate-200/60">
              暂无文件可供分析
            </p>
          )}
        </Card>
      </div>

      {/* 我的收藏 */}
      {starredFiles.length ? (
        <div className="mt-8">
          <SectionTitle
            title="我的收藏"
            subtitle="你标记过的重要文件"
            action={
              <LinkButton to="/favorites" variant="ghost" size="sm" iconRight={<ArrowRight size={13} />}>
                全部收藏
              </LinkButton>
            }
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {starredFiles.slice(0, 3).map((f) => (
              <button
                key={f.id}
                onClick={() => navigate(`/file/${f.id}`)}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200/80 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <Star size={16} fill="currentColor" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-slate-800">
                    {f.name}
                  </span>
                  <span className="block truncate text-[11.5px] text-slate-400">
                    {f.client} · {relativeTime(f.updatedAt)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
