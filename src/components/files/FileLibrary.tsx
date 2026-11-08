import { Filter, FolderOpen, LayoutGrid, List, Search, Star, Upload, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { FileCard } from '@/components/files/FileCard'
import { FileTable } from '@/components/files/FileTable'
import { Badge, TagChip } from '@/components/ui/Badge'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, PageShell } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Input'
import { ALL_TAGS, CLIENT_OPTIONS } from '@/data/demo'
import { searchFiles } from '@/lib/search'
import { useApp } from '@/store/AppStore'
import { cn } from '@/lib/utils'
import type { HubFile, SortKey } from '@/types'

const PAGE_SIZE = 24

/** 通用文件库页面：方案中心 / PPT / 我的收藏共用 */
export function FileLibrary({
  title,
  subtitle,
  preset,
  defaultLayout = 'table',
  toolbar,
  icon,
}: {
  title: string
  subtitle: string
  preset?: (f: HubFile) => boolean
  defaultLayout?: 'table' | 'cards'
  toolbar?: ReactNode
  icon?: ReactNode
}) {
  const { liveFiles } = useApp()
  const [q, setQ] = useState('')
  const [client, setClient] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<SortKey>('updated')
  const [starredOnly, setStarredOnly] = useState(false)
  const [layout, setLayout] = useState<'table' | 'cards'>(defaultLayout)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const base = useMemo(
    () => liveFiles.filter((f) => (preset ? preset(f) : true)),
    [liveFiles, preset],
  )

  const hits = useMemo(
    () =>
      searchFiles(base, q, {
        client,
        tags: tag ? [tag] : [],
        sort,
        starredOnly,
      }),
    [base, q, client, tag, sort, starredOnly],
  )

  const files = hits.map((h) => h.file)
  const shown = files.slice(0, visible)
  const activeFilters = (client ? 1 : 0) + (tag ? 1 : 0) + (starredOnly ? 1 : 0)

  function clearFilters() {
    setClient('')
    setTag('')
    setStarredOnly(false)
    setSort('updated')
  }

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-slate-200/80 shadow-card">
              {icon}
            </span>
          ) : null}
          <div>
            <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <LinkButton to="/collector" variant="primary" icon={<Upload size={15} />}>
            上传文件
          </LinkButton>
        </div>
      </div>

      {/* 工具栏 */}
      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setVisible(PAGE_SIZE)
              }}
              placeholder="在这个分类里搜索文件名、客户或关键词…"
              className="h-10 w-full rounded-xl bg-white pl-9 pr-3 text-sm text-slate-800 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
            />
          </div>

          <Select
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="h-10 w-[140px] shrink-0"
          >
            <option value="">全部客户</option>
            {CLIENT_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="h-10 w-[130px] shrink-0"
          >
            <option value="">全部标签</option>
            {ALL_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 w-[132px] shrink-0"
          >
            <option value="updated">最近修改</option>
            <option value="name">按名称</option>
            <option value="size">按大小</option>
            <option value="relevance">相关度</option>
          </Select>

          <button
            onClick={() => setStarredOnly((v) => !v)}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium ring-1 transition-colors',
              starredOnly
                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50',
            )}
          >
            <Star size={14} fill={starredOnly ? 'currentColor' : 'none'} />
            收藏
          </button>

          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100/80 p-1">
            <button
              onClick={() => setLayout('table')}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                layout === 'table' ? 'bg-white text-brand-600 shadow-card' : 'text-slate-400',
              )}
              aria-label="列表视图"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setLayout('cards')}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                layout === 'cards' ? 'bg-white text-brand-600 shadow-card' : 'text-slate-400',
              )}
              aria-label="卡片视图"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {activeFilters > 0 ? (
            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters}>
              清空
            </Button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[12px] text-slate-400">
            <Filter size={11} />
            热门标签
          </span>
          {ALL_TAGS.slice(0, 8).map((t) => (
            <TagChip key={t} label={t} active={tag === t} onClick={() => setTag(tag === t ? '' : t)} />
          ))}
          <span className="ml-auto text-[12.5px] text-slate-400">
            共 <strong className="text-slate-600">{files.length}</strong> 个文件
          </span>
        </div>
      </Card>

      {/* 内容 */}
      <div className="mt-5">
        {files.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={22} />}
            title={q || activeFilters ? '没有符合条件的文件' : '这里还是空的'}
            description={
              q || activeFilters
                ? '试着换个关键词，或清空筛选条件。'
                : '上传你的第一个表格，让表格汇帮你整理。'
            }
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <LinkButton to="/collector" variant="primary">
                  ＋ 上传表格
                </LinkButton>
                {activeFilters > 0 ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    清空筛选
                  </Button>
                ) : null}
              </div>
            }
          />
        ) : layout === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((f) => (
              <FileCard key={f.id} file={f} />
            ))}
          </div>
        ) : (
          <FileTable files={shown} query={q} />
        )}
      </div>

      {files.length > visible ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            显示更多（还有 {files.length - visible} 个）
          </Button>
        </div>
      ) : files.length > 0 ? (
        <div className="mt-6 flex items-center justify-center gap-2 text-[12.5px] text-slate-400">
          <Badge tone="slate">已显示全部 {files.length} 个文件</Badge>
        </div>
      ) : null}
    </PageShell>
  )
}
