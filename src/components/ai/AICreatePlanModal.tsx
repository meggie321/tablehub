import { Check, Download, FileSpreadsheet, Save, Sparkles, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileIcon } from '@/components/files/FileIcon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { AISteps, type StepItem } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { CLIENTS, mkFile } from '@/data/demo'
import { buildPlanDraft, exportPlanDraft, type PlanDraft } from '@/lib/ai'
import { useApp } from '@/store/AppStore'
import { cn } from '@/lib/utils'
import { useAuth } from '@/auth/AuthProvider'

type Phase = 'form' | 'generating' | 'preview'

const STEP_LABELS = [
  '正在分析相关表格……',
  '正在提取客户信息……',
  '正在整理数据……',
  '正在生成方案……',
]

export function AICreatePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { liveFiles, addFiles, toast } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [client, setClient] = useState(CLIENTS[0].name)
  const [topic, setTopic] = useState('2026年度合作')
  const [refs, setRefs] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('form')
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<PlanDraft | null>(null)

  const sheetFiles = useMemo(() => liveFiles.filter((f) => f.kind === 'sheet').slice(0, 40), [liveFiles])
  const selected = useMemo(
    () => sheetFiles.filter((f) => refs.includes(f.id)),
    [sheetFiles, refs],
  )

  useEffect(() => {
    if (!open) {
      setPhase('form')
      setStep(0)
      setDraft(null)
      setRefs([])
    }
  }, [open])

  useEffect(() => {
    if (phase !== 'generating') return
    const timers: number[] = []
    let acc = 0
    STEP_LABELS.forEach((_, i) => {
      acc += 620 + i * 140
      timers.push(window.setTimeout(() => setStep(i + 1), acc))
    })
    timers.push(
      window.setTimeout(() => {
        setDraft(buildPlanDraft(client, topic, selected))
        setPhase('preview')
      }, acc + 520),
    )
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [phase, client, topic, selected])

  function save() {
    if (!draft) return
    const file = mkFile({
      id: `plan-${Date.now().toString(36)}`,
      name: `${draft.title}.pptx`,
      kind: 'ppt',
      client,
      category: '客户方案',
      owner: user?.username ?? '用户',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      sizeMB: 4.2,
      tags: ['客户', '方案', String(new Date().getFullYear())],
      status: '已完成',
      aiSummary: {
        intro: draft.summary,
        bullets: draft.slides.map((s) => s.title),
        recommend: `建议发送给：${client}客户负责人。`,
      },
    })
    addFiles([file])
    toast('✓ 已保存到文件列表', 'success')
    onClose()
    navigate('/dashboard')
  }

  const steps: StepItem[] = STEP_LABELS.map((label, i) => ({
    label,
    state: i < step ? 'done' : i === step ? 'active' : 'pending',
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="AI 创建客户方案"
      subtitle="选择客户与参考表格，AI 会自动生成一份可发送的客户方案"
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-orch-600 text-white shadow-glow">
          <Wand2 size={17} />
        </span>
      }
      footer={
        phase === 'preview' ? (
          <>
            <Button variant="secondary" icon={<Download size={15} />} onClick={() => draft && exportPlanDraft(draft)}>
              导出 PPT
            </Button>
            <Button variant="ai" icon={<Save size={15} />} onClick={save}>
              保存到方案中心
            </Button>
          </>
        ) : phase === 'generating' ? (
          <Button variant="secondary" disabled>
            生成中…
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="ai"
              icon={<Sparkles size={15} />}
              disabled={!client.trim()}
              onClick={() => {
                setStep(0)
                setPhase('generating')
              }}
            >
              AI 生成方案
            </Button>
          </>
        )
      }
    >
      {phase === 'form' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="客户名称">
              <Select value={client} onChange={(e) => setClient(e.target.value)}>
                {CLIENTS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}（{c.industry}）
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="方案主题">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：2026年度合作"
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium text-slate-600">参考表格</span>
              <span className="text-[12px] text-slate-400">
                已选 {refs.length} 个 · 可多选
              </span>
            </div>
            <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50/70 p-2 ring-1 ring-slate-200/70">
              {sheetFiles.map((f) => {
                const on = refs.includes(f.id)
                return (
                  <button
                    key={f.id}
                    onClick={() =>
                      setRefs((prev) => (on ? prev.filter((x) => x !== f.id) : [...prev, f.id]))
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                      on ? 'bg-white ring-1 ring-brand-200' : 'hover:bg-white/70',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] ring-1 transition-colors',
                        on ? 'bg-brand-600 ring-brand-600' : 'bg-white ring-slate-300',
                      )}
                    >
                      {on ? <Check size={11} className="text-white" strokeWidth={3} /> : null}
                    </span>
                    <FileIcon kind={f.kind} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-slate-700">
                        {f.name}
                      </span>
                      <span className="block text-[11.5px] text-slate-400">
                        {f.client} · {f.category}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-orch-50 p-3.5 ring-1 ring-brand-100">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-600" />
            <p className="text-[12.5px] leading-relaxed text-slate-600">
              AI 会读取所选表格里的客户信息与报价数据，自动生成包含项目背景、服务内容、合作方式、项目报价和时间安排的完整方案。
            </p>
          </div>
        </div>
      ) : null}

      {phase === 'generating' ? (
        <div className="py-2">
          <AISteps steps={steps} />
          <div className="mt-5 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/70">
            <p className="text-[12px] text-slate-400">
              客户：<span className="font-medium text-slate-600">{client}</span> · 主题：
              <span className="font-medium text-slate-600">{topic}</span> · 参考表格：
              <span className="font-medium text-slate-600">{selected.length} 个</span>
            </p>
          </div>
        </div>
      ) : null}

      {phase === 'preview' && draft ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-brand-50 via-white to-orch-50 p-4 ring-1 ring-brand-100">
            <div className="flex items-center gap-2 text-brand-700">
              <Sparkles size={14} />
              <span className="text-[12.5px] font-semibold">方案预览</span>
            </div>
            <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-slate-900">
              {draft.title}
            </h3>
            <p className="mt-1 text-[12.5px] text-slate-500">{draft.subtitle}</p>
          </div>

          <ol className="space-y-2.5">
            {draft.slides.map((s, i) => (
              <li key={s.title} className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-50 text-[11px] font-semibold text-brand-600">
                    {i + 1}
                  </span>
                  <h4 className="text-[13.5px] font-semibold text-slate-800">{s.title}</h4>
                </div>
                <ul className="mt-2 space-y-1 pl-7">
                  {s.points.map((p) => (
                    <li key={p} className="text-[12.5px] leading-relaxed text-slate-500">
                      · {p}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              <FileSpreadsheet size={11} />
              引用 {selected.length} 份表格
            </Badge>
            <Badge tone="emerald">可直接导出</Badge>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
