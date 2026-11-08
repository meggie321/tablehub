import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  FileSpreadsheet,
  FolderTree,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileIcon } from '@/components/files/FileIcon'
import { HotSearches, SearchBar } from '@/components/search/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { Button, LinkButton } from '@/components/ui/Button'
import { HOT_SEARCHES } from '@/data/demo'
import { buildAISearchAnswer, searchFiles } from '@/lib/search'
import { relativeTime } from '@/lib/utils'
import { useApp } from '@/store/AppStore'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-orch-600 text-white shadow-glow">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 8h16M4 12.5h16M4 17h9" />
        </svg>
      </span>
      <div>
        <p className="text-[15px] font-semibold leading-tight tracking-tight text-slate-900">表格汇</p>
        <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate-400">TableHub</p>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: Layers,
    title: '统一汇集',
    desc: 'Excel、CSV、PDF、PPT、Word 全部放到一个地方，不再散落在各个文件夹和聊天记录里。',
    tone: 'bg-brand-50 text-brand-600',
  },
  {
    icon: Search,
    title: '超级搜索',
    desc: '输入客户名、员工名或方案关键词，实时按相关度排序，一眼看到最该用的那一份。',
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Wand2,
    title: 'AI 自动分类',
    desc: '上传后自动识别文件名称、类型、所属客户、用途、关键词和标签，不用手动整理。',
    tone: 'bg-orch-50 text-orch-600',
  },
  {
    icon: ShieldCheck,
    title: '防止发错方案',
    desc: '分享前 AI 自动检查版本，发现更新的方案会提醒你改用最新版，避免把旧方案发给客户。',
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Sparkles,
    title: 'AI 生成方案',
    desc: '选择客户和参考表格，AI 直接生成包含背景、服务、报价、时间安排的完整客户方案。',
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Users,
    title: '面向小团队',
    desc: '报销、人事、客户资料集中管理，谁在什么时候更新过哪份文件，一目了然。',
    tone: 'bg-rose-50 text-rose-600',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { registerSearch, liveFiles } = useApp()
  const [q, setQ] = useState('')
  const previewQuery = '星河科技'
  const previewResults = searchFiles(liveFiles, previewQuery)
  const previewAnswer = buildAISearchAnswer(previewQuery, previewResults)
  const sheetCount = liveFiles.filter((file) => file.kind === 'sheet').length
  const planCount = liveFiles.filter((file) => file.kind === 'doc').length
  const pptCount = liveFiles.filter((file) => file.kind === 'ppt').length

  function go(value: string) {
    const query = value.trim()
    if (!query) {
      navigate('/search')
      return
    }
    registerSearch()
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-slate-500 md:flex">
            <button onClick={() => scrollTo('features')} className="transition-colors hover:text-slate-900">
              产品功能
            </button>
            <button onClick={() => scrollTo('compare')} className="transition-colors hover:text-slate-900">
              核心价值
            </button>
            <button onClick={() => scrollTo('scenes')} className="transition-colors hover:text-slate-900">
              使用场景
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <LinkButton to="/login" variant="secondary" size="sm" className="hidden sm:inline-flex">
              进入工作台
            </LinkButton>
            <Button variant="ai" size="sm" icon={<Sparkles size={14} />} onClick={() => navigate('/ai')}>
              体验 AI
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-grid mask-fade-b pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-200/50 via-orch-200/40 to-blue-200/40 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1200px] px-5 pb-14 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-brand-700 ring-1 ring-brand-100 shadow-card">
              <Sparkles size={13} />
              AI 驱动的表格汇集器 · 让所有表格，都能被快速找到
            </span>

            <h1 className="mt-6 text-[34px] font-semibold leading-[1.15] tracking-tight text-slate-900 sm:text-[46px] lg:text-[54px]">
              再也不用
              <span className="text-gradient"> 到处找表格</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-500 sm:text-base">
              表格汇帮你集中管理表格、方案和 PPT。
              <br className="hidden sm:block" />
              输入一个名字，快速找到你需要的文件——并且确保发给客户的是最新版本。
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                iconRight={<ArrowRight size={16} />}
                onClick={() => navigate('/login')}
              >
                开始使用
              </Button>
              <Button
                variant="ai"
                size="lg"
                icon={<Sparkles size={16} />}
                onClick={() => navigate('/search')}
              >
                体验 AI 搜索
              </Button>
            </div>
          </div>

          {/* Hero 搜索框 */}
          <div className="mx-auto mt-12 max-w-3xl">
            <p className="mb-3 text-center text-[13px] font-medium text-slate-400">
              今天想找什么？
            </p>
            <SearchBar
              value={q}
              onChange={setQ}
              onSubmit={go}
              size="hero"
              placeholder="搜索表格名称"
              hotSearches={HOT_SEARCHES}
              showHot
              rightSlot={
                <Button variant="primary" onClick={() => go(q)}>
                  搜索
                </Button>
              }
            />
          </div>

          {/* 产品预览 */}
          <div className="mx-auto mt-14 max-w-[980px]">
            <div className="rounded-[22px] bg-white p-2.5 ring-1 ring-slate-200/80 shadow-pop">
              <div className="rounded-[16px] bg-slate-50/80 p-4">
                <div className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-slate-200">
                  <Search size={15} className="text-slate-400" />
                  <span className="text-[13.5px] font-medium text-slate-700">{previewQuery}</span>
                  <span className="ml-auto text-[11.5px] text-slate-400">找到 {previewResults.length} 个相关结果</span>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                  <div className="space-y-2">
                    {previewResults.slice(0, 3).map((row) => (
                      <div
                        key={row.file.id}
                        className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 ring-1 ring-slate-200/80"
                      >
                        <FileIcon kind={row.file.kind} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-slate-800">{row.file.name}</p>
                          <p className="truncate text-[11.5px] text-slate-400">{row.file.client} · {relativeTime(row.file.updatedAt)}</p>
                        </div>
                        <Badge tone="slate">
                          {row.file.kind === 'sheet' ? '表格' : row.file.kind === 'ppt' ? 'PPT' : row.file.kind === 'pdf' ? 'PDF' : '方案'}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-brand-50 via-white to-orch-50 p-4 ring-1 ring-brand-100">
                    <div className="flex items-center gap-2 text-brand-700">
                      <Sparkles size={14} />
                      <span className="text-[12.5px] font-semibold">AI 搜索助手</span>
                    </div>
                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-600">
                      {previewAnswer.text.join(' ')}
                    </p>
                    {previewAnswer.recommend ? (
                      <div className="mt-3 rounded-lg bg-white/80 p-2.5 ring-1 ring-brand-100">
                        <p className="text-[11.5px] text-slate-400">建议发送</p>
                        <p className="mt-0.5 text-[12.5px] font-medium text-slate-800">{previewAnswer.recommend.name}</p>
                        <p className="text-[11px] text-slate-400">最后更新：{relativeTime(previewAnswer.recommend.updatedAt)}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[12.5px] text-slate-400">
            当前演示已预置 {liveFiles.length} 个文件 · 无需注册，直接体验完整流程
          </p>
        </div>
      </section>

      {/* 以前 / 现在 */}
      <section id="compare" className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[32px]">
            从「到处找」到「一句话找到」
          </h2>
          <p className="mt-3 text-[14.5px] text-slate-500">
            表格汇围绕一个核心价值：汇集 + 搜索 + AI 整理 + 防止发错。
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/80 shadow-card">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <X size={16} />
              </span>
              <h3 className="text-[15px] font-semibold text-slate-800">以前</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {['文件散落在电脑、聊天记录和网盘里', '名字相似，容易把 V2 当成最新版发出去', '报销、客户资料要找很久，全靠记忆', '没有统一归档，新人接手成本很高'].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate-500">
                  <X size={14} className="mt-1 shrink-0 text-rose-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-brand-200/80 shadow-card">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-brand-100 to-orch-100 blur-2xl" />
            <div className="relative flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Check size={16} />
              </span>
              <h3 className="text-[15px] font-semibold text-slate-800">现在</h3>
            </div>
            <ul className="relative mt-4 space-y-3">
              {['上传即汇集，自动识别客户、类型和关键词', '搜索名字直接命中，按相关度排序推荐', 'AI 在分享前检查版本，提醒你换最新方案', '所有资料可搜索、可收藏、可追溯到更新时间'].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate-600">
                  <Check size={14} className="mt-1 shrink-0 text-brand-500" strokeWidth={3} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 功能 */}
      <section id="features" className="border-y border-slate-200/70 bg-white/70">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand" icon={<Zap size={11} />}>
              核心能力
            </Badge>
            <h2 className="mt-3 text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[32px]">
              不是文件夹，是一个会帮你找文件的 AI
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl bg-white p-6 ring-1 ring-slate-200/80 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.tone}`}>
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 使用场景 */}
      <section id="scenes" className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge tone="violet" icon={<Building2 size={11} />}>
              典型场景
            </Badge>
            <h2 className="mt-3 text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[32px]">
              给小团队准备的第二个大脑
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-slate-500">
              创业团队、销售、人事、财务都在用同一套方式管理文件：放进来 → 搜一下 → 发出去。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" iconRight={<ArrowRight size={15} />} onClick={() => navigate('/login')}>
                进入工作台
              </Button>
              <Button variant="secondary" icon={<FileSpreadsheet size={15} />} onClick={() => navigate('/collector')}>
                看看表格汇集器
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: ShieldCheck,
                title: '给客户发方案之前',
                desc: 'AI 检查版本，发现 V3 就提醒你别再发 V2。',
                tone: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: Users,
                title: '统计员工报销',
                desc: '按部门、金额、状态筛选，12 笔待审核一眼看清。',
                tone: 'bg-blue-50 text-blue-600',
              },
              {
                icon: FolderTree,
                title: '新人接手客户资料',
                desc: '输入客户名，历史方案和表格全部列出来。',
                tone: 'bg-orch-50 text-orch-600',
              },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.title}
                  className="flex items-start gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-card"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-[14.5px] font-semibold text-slate-900">{s.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="px-5 pb-20 lg:px-8">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-orch-600 px-8 py-14 text-center text-white shadow-glow">
          <div className="pointer-events-none absolute inset-0 opacity-20 hero-grid" aria-hidden />
          <div className="relative">
            <Badge className="bg-white/15 text-white ring-white/20" tone="slate">
              <Sparkles size={11} />
              TableHub Demo
            </Badge>
            <h2 className="mt-4 text-[28px] font-semibold tracking-tight sm:text-[36px]">
              让所有表格，都能被快速找到。
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/80">
              预置了 {sheetCount} 个表格、{planCount} 份方案和 {pptCount} 个 PPT，打开即可体验完整的搜索、上传和 AI 流程。
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-white text-brand-700 hover:bg-white/90"
                iconRight={<ArrowRight size={16} />}
                onClick={() => navigate('/login')}
              >
                开始使用
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/15"
                icon={<BadgeCheck size={16} />}
                onClick={() => navigate('/ai')}
              >
                体验 AI 助手
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 bg-white/60 py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 text-[12.5px] text-slate-400 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2.5">
            <Logo />
          </div>
          <p>表格汇 TableHub · 汇集 + 搜索 + AI 整理 + 防止发错</p>
        </div>
      </footer>
    </div>
  )
}
