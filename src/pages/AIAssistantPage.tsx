import {
  BarChart3,
  Clock,
  FileSearch,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { AIChat } from '@/components/ai/AIChat'
import { FileIcon } from '@/components/files/FileIcon'
import { Badge } from '@/components/ui/Badge'
import { Card, PageShell } from '@/components/ui/Card'
import { useApp } from '@/store/AppStore'
import { relativeTime } from '@/lib/utils'

const CAPABILITIES = [
  {
    icon: FileSearch,
    title: '一句话找文件',
    desc: '输入客户名或用途，直接返回最相关的那一份。',
    examples: ['帮我找星河科技最近的报价表', '员工报销统计表在哪'],
    tone: 'bg-brand-50 text-brand-600',
  },
  {
    icon: BarChart3,
    title: '分析客户状态',
    desc: '找出很久没更新方案的客户，提醒你及时跟进。',
    examples: ['哪些客户最近没有更新方案？', '一共收录了多少个文件？'],
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    icon: ShieldCheck,
    title: '防止发错方案',
    desc: '分享前检查版本，发现更新版本立刻提醒。',
    examples: ['有没有发错版本的风险？'],
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Wallet,
    title: '汇总财务数据',
    desc: '报销金额、待审核笔数一次说清。',
    examples: ['本月员工报销一共多少钱？'],
    tone: 'bg-amber-50 text-amber-600',
  },
]

export default function AIAssistantPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { recents } = useApp()
  const initialQuestion = params.get('q') ?? undefined

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-orch-600 text-white shadow-glow">
            <Sparkles size={20} />
          </span>
          <div>
            <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">表格汇 AI</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">
              帮你快速找到、整理和分析表格。
            </p>
          </div>
        </div>
        <Badge tone="brand" icon={<Sparkles size={11} />}>
          Demo 推理模式 · 不联网可用
        </Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <AIChat initialQuestion={initialQuestion} />

        <div className="space-y-5">
          <Card>
            <h3 className="text-[15px] font-semibold text-slate-900">我可以帮你做什么</h3>
            <ul className="mt-4 space-y-4">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon
                return (
                  <li key={c.title}>
                    <div className="flex items-start gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.tone}`}>
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-slate-800">{c.title}</p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">
                          {c.desc}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.examples.map((ex) => (
                            <button
                              key={ex}
                              onClick={() => navigate(`/ai?q=${encodeURIComponent(ex)}`)}
                              className="rounded-lg bg-slate-50 px-2 py-1 text-[11.5px] font-medium text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
                            >
                              {ex}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-slate-400" />
              <h3 className="text-[15px] font-semibold text-slate-900">最近使用</h3>
            </div>
            <ul className="mt-3 space-y-1">
              {recents.slice(0, 5).map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => navigate(`/file/${f.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <FileIcon kind={f.kind} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-slate-700">
                        {f.name}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {f.client} · {relativeTime(f.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
