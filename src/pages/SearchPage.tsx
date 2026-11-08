import {
  ArrowRight,
  Building2,
  CalendarClock,
  Filter,
  History,
  Search as SearchIcon,
  Sparkles,
  Star,
  User,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileIcon } from '@/components/files/FileIcon'
import { FileTable } from '@/components/files/FileTable'
import { SearchBar } from '@/components/search/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card, PageShell } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Select } from '@/components/ui/Input'
import { AIDots } from '@/components/ui/Loading'
import { Chip } from '@/components/ui/Segmented'
import { ALL_TAGS, HOT_SEARCHES } from '@/data/demo'
import { buildAISearchAnswer, searchEntities, searchFiles } from '@/lib/search'
import { useApp } from '@/store/AppStore'
import { cn, kindLabel, relativeTime, smartDateTime } from '@/lib/utils'
import type { FileKind, SortKey } from '@/types'

type KindFilter = 'all' | FileKind
type EntityMode = null | 'client' | 'employee'

const KIND_GROUPS: Array<{ kind: FileKind; emoji: string; label: string }> = [
  { kind: 'sheet', emoji: '📊', label: '表格' },
  { kind: 'doc', emoji: '📑', label: '方案' },
  { kind: 'ppt', emoji: '📊', label: 'PPT' },
  { kind: 'pdf', emoji: '📄', label: 'PDF' },
]

export default function SearchPage() {
  const { liveFiles, registerSearch, markOpened } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const initial = params.get('q') ?? ''
  const [q, setQ] = useState(initial)
  const [submitted, setSubmitted] = useState(initial)
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [entityMode, setEntityMode] = useState<EntityMode>(null)
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<SortKey>('relevance')
  const [starredOnly, setStarredOnly] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const next = params.get('q') ?? ''
    setQ(next)
    setSubmitted(next)
  }, [params])

  useEffect(() => {
    if (!submitted.trim()) return
    setSearching(true)
    const t = window.setTimeout(() => setSearching(false), 420)
    return () => window.clearTimeout(t)
  }, [submitted, kindFilter, tag, sort, starredOnly])

  const hits = useMemo(
    () =>
      searchFiles(liveFiles, submitted, {
        kind: kindFilter,
        tags: tag ? [tag] : [],
        sort,
        starredOnly,
      }),
    [liveFiles, submitted, kindFilter, tag, sort, starredOnly],
  )

  const answer = useMemo(() => buildAISearchAnswer(submitted, hits), [submitted, hits])
  const entities = useMemo(() => searchEntities(liveFiles, submitted), [liveFiles, submitted])

  function run(value?: string) {
    const query = (value ?? q).trim()
    setSubmitted(query)
    setQ(query)
    setEntityMode(null)
    setParams(query ? { q: query } : {})
    if (query) registerSearch()
  }

  const activeFilters = (tag ? 1 : 0) + (starredOnly ? 1 : 0) + (kindFilter !== 'all' ? 1 : 0)

  return (
    <PageShell wide>
      {/* 搜索头部 */}
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">
          搜索表格名称
        </h2>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          不用知道文件存在哪里，输入一个名字就够了
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        <SearchBar
          value={q}
          onChange={setQ}
          onSubmit={run}
          size="hero"
          autoFocus
          placeholder="搜索表格名称"
          hotSearches={HOT_SEARCHES}
          rightSlot={
            <Button variant="primary" onClick={() => run()}>
              搜索
            </Button>
          }
        />
      </div>

      {/* 类型 / 维度切换 */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
        <Chip
          active={kindFilter === 'all' && !entityMode}
          onClick={() => {
            setKindFilter('all')
            setEntityMode(null)
          }}
        >
          全部
        </Chip>
        <Chip
          active={kindFilter === 'sheet'}
          onClick={() => {
            setKindFilter('sheet')
            setEntityMode(null)
          }}
        >
          📊 表格
        </Chip>
        <Chip
          active={kindFilter === 'ppt'}
          onClick={() => {
            setKindFilter('ppt')
            setEntityMode(null)
          }}
        >
          📑 PPT
        </Chip>
        <Chip
          active={kindFilter === 'doc'}
          onClick={() => {
            setKindFilter('doc')
            setEntityMode(null)
          }}
        >
          📄 方案
        </Chip>
        <Chip
          active={entityMode === 'client'}
          onClick={() => setEntityMode(entityMode === 'client' ? null : 'client')}
        >
          <Building2 size={13} />
          客户
        </Chip>
        <Chip
          active={entityMode === 'employee'}
          onClick={() => setEntityMode(entityMode === 'employee' ? null : 'employee')}
        >
          <User size={13} />
          员工
        </Chip>
      </div>

      {/* 高级筛选 */}
      <Card className="mt-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
            <Filter size={14} />
            筛选
            {activeFilters > 0 ? <Badge tone="brand">{activeFilters}</Badge> : null}
          </div>

          <div className="w-[150px]">
            <Field label="最近修改">
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="relevance">相关度优先</option>
                <option value="updated">最近修改</option>
                <option value="name">按名称</option>
              </Select>
            </Field>
          </div>

          <div className="w-[150px]">
            <Field label="文件类型">
              <Select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as KindFilter)}
              >
                <option value="all">全部类型</option>
                <option value="sheet">表格</option>
                <option value="doc">方案</option>
                <option value="ppt">PPT</option>
                <option value="pdf">PDF</option>
              </Select>
            </Field>
          </div>

          <div className="w-[150px]">
            <Field label="标签">
              <Select value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="">全部标签</option>
                {ALL_TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <button
            onClick={() => setStarredOnly((v) => !v)}
            className={cn(
              'inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium ring-1 transition-colors',
              starredOnly
                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50',
            )}
          >
            <Star size={14} fill={starredOnly ? 'currentColor' : 'none'} />
            仅看收藏
          </button>

          {activeFilters > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<X size={14} />}
              onClick={() => {
                setKindFilter('all')
                setTag('')
                setStarredOnly(false)
                setSort('relevance')
              }}
            >
              清空筛选
            </Button>
          ) : null}
        </div>

      </Card>

      {/* AI 搜索助手 */}
      {submitted ? (
        <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50/90 via-white to-orch-50/90 ring-1 ring-brand-100 shadow-card">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
            <div className="flex items-center gap-2.5 lg:w-44 lg:shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orch-500 text-white shadow-glow">
                <Sparkles size={17} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-900">AI 搜索助手</p>
                <p className="text-[11.5px] text-slate-400">
                  {searching ? '正在分析…' : `已分析 ${hits.length} 个结果`}
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              {searching ? (
                <div className="flex items-center gap-2.5 py-2 text-slate-500">
                  <AIDots className="text-brand-500" />
                  <span className="text-[13px]">AI 正在检索「{submitted}」相关的文件…</span>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {answer.text.map((line, i) => (
                      <p key={i} className="text-[13.5px] leading-relaxed text-slate-700">
                        {line}
                      </p>
                    ))}
                  </div>

                  {answer.recommend ? (
                    <div className="mt-3.5 flex flex-wrap items-center gap-4 rounded-xl bg-white/80 p-3.5 ring-1 ring-brand-100">
                      <FileIcon kind={answer.recommend.kind} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-slate-800">
                          {answer.recommend.name}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-slate-400">
                          最后更新时间：{smartDateTime(answer.recommend.updatedAt)} ·{' '}
                          {answer.recommend.owner} · {answer.recommend.client}
                        </p>
                      </div>
                      <Button
                        variant="ai"
                        size="sm"
                        icon={<ArrowRight size={14} />}
                        onClick={() => {
                          markOpened(answer.recommend!.id)
                          navigate(`/file/${answer.recommend!.id}`)
                        }}
                      >
                        打开文件
                      </Button>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {answer.actions
                      .filter((a) => a.kind === 'to')
                      .map((a) => (
                        <Button
                          key={a.label}
                          size="sm"
                          variant="secondary"
                          onClick={() => a.payload && navigate(a.payload)}
                        >
                          {a.label}
                        </Button>
                      ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<History size={13} />}
                      onClick={() => navigate('/ai')}
                    >
                      换个问法，去 AI 助手
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 客户 / 员工 维度 */}
      {entityMode === 'client' ? (
        <div className="mt-6">
          <h3 className="text-[15px] font-semibold text-slate-900">相关客户</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entities.clients.length ? (
              entities.clients.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setEntityMode(null)
                    run(c.name)
                  }}
                  className="rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200/80 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Building2 size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-slate-900">{c.name}</p>
                      <p className="truncate text-[11.5px] text-slate-400">{c.industry}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[12px] text-slate-400">
                    <span>对接人 {c.contact}</span>
                    <Badge tone="brand">{c.count} 个文件</Badge>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState
                compact
                icon={<Building2 size={20} />}
                title="没有匹配的客户"
                description="试试输入「星河」「ABC」等客户关键词。"
              />
            )}
          </div>
        </div>
      ) : null}

      {entityMode === 'employee' ? (
        <div className="mt-6">
          <h3 className="text-[15px] font-semibold text-slate-900">相关员工</h3>
          <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-card">
            {entities.employees.length ? (
              <ul className="divide-y divide-slate-100">
                {entities.employees.map((e) => (
                  <li key={e.name} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Users size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-slate-800">{e.name}</p>
                      <p className="text-[11.5px] text-slate-400">{e.dept}</p>
                    </div>
                    <Badge tone="slate">{e.files} 个文件</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEntityMode(null)
                        run(e.name)
                      }}
                    >
                      搜索
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState compact icon={<User size={20} />} title="没有匹配的员工" />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 搜索结果 */}
      <div className="mt-8">
        {!submitted ? (
          <EmptyState
            icon={<SearchIcon size={22} />}
            title="输入想要找的内容"
            description="比如「星河科技」「报价表」「员工报销」，也可以直接点上面的热门搜索。"
          />
        ) : searching ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/80"
              />
            ))}
          </div>
        ) : hits.length === 0 ? (
          <EmptyState
            icon={<SearchIcon size={22} />}
            title={`没有找到与「${submitted}」相关的文件`}
            description="可以换个关键词，或者把这份表格上传到表格汇，让 AI 自动识别。"
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <LinkButton to="/collector" variant="primary">
                  ＋ 上传表格
                </LinkButton>
                <Button variant="secondary" onClick={() => run('星河科技')}>
                  试试搜索「星河科技」
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold tracking-tight text-slate-900">
                  搜索结果
                </h3>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  找到 <strong className="text-brand-600">{hits.length}</strong> 个与「{submitted}
                  」相关的结果
                </p>
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-slate-400">
                <CalendarClock size={13} />
                按 {sort === 'relevance' ? '相关度' : sort === 'updated' ? '最近修改' : sort === 'name' ? '名称' : '大小'} 排序
              </div>
            </div>

            {kindFilter === 'all' ? (
              <div className="space-y-7">
                {KIND_GROUPS.map((g) => {
                  const groupHits = hits.filter((h) => h.file.kind === g.kind)
                  if (!groupHits.length) return null
                  return (
                    <section key={g.kind}>
                      <div className="mb-3 flex items-center gap-2">
                        <h4 className="text-[14.5px] font-semibold text-slate-800">
                          {g.emoji} {g.label}
                        </h4>
                        <Badge tone="slate">{groupHits.length}</Badge>
                      </div>
                      <FileTable files={groupHits.map((h) => h.file)} query={submitted} />
                    </section>
                  )
                })}
              </div>
            ) : (
              <FileTable files={hits.map((h) => h.file)} query={submitted} />
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
