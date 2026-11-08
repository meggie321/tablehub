import { BadgeCheck, CheckCircle2, FileSpreadsheet, Presentation, Sparkles, Tags } from 'lucide-react'
import { AIDots, AISteps, ProgressBar, type StepItem } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { FileIcon } from '@/components/files/FileIcon'
import { cn, formatSize } from '@/lib/utils'
import type { UploadTask } from '@/types'
import type { UploadResult } from '@/lib/ai'

/* ------------------------------------------------------------------ *
 * 上传中：逐个文件进度 + AI 识别提示
 * ------------------------------------------------------------------ */

export function UploadProgressPanel({ tasks, waitingForAI = false }: { tasks: UploadTask[]; waitingForAI?: boolean }) {
  const total = tasks.length
  const pendingIndex = waitingForAI ? tasks.length - 1 : -1
  const done = tasks.filter((t, index) => t.progress >= 100 && index !== pendingIndex).length
  // File upload can finish before DeepSeek has returned its classifications.
  // Reserve 100% for the final state after results have been saved.
  const overall = total ? Math.min(99, tasks.reduce((s, t) => s + t.progress, 0) / total) : 0

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orch-500 text-white shadow-glow">
            <AIDots />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">正在整理你的文件</h3>
            <p className="text-[12.5px] text-slate-500">
              已上传 {done} / {total} 个文件
              {waitingForAI ? ' · 最后一份上传中（99%），正在等待整理结果……' : ' · 正在上传……'}
            </p>
          </div>
        </div>
        <span className="text-[22px] font-semibold tabular-nums text-slate-900">
          {Math.round(overall)}%
        </span>
      </div>

      <ProgressBar value={overall} className="mt-4" />

      <ul className="mt-5 space-y-3.5">
        {tasks.map((t, index) => {
          const isPending = index === pendingIndex
          const progress = isPending ? 99 : t.progress
          return (
          <li key={t.id}>
            <div className="flex items-center gap-3">
              <FileIcon kind="sheet" size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-slate-700">
                {t.name}
              </span>
              <span
                className={cn(
                  'shrink-0 text-[12.5px] font-medium tabular-nums',
                  !isPending && t.progress >= 100 ? 'text-emerald-600' : 'text-slate-400',
                )}
              >
                {isPending ? '上传中 · 99%' : t.progress >= 100 ? '✓ 已上传' : `${Math.round(t.progress)}%`}
              </span>
            </div>
            <ProgressBar
              value={progress}
              tone={!isPending && t.progress >= 100 ? 'emerald' : 'brand'}
              className="mt-2 ml-11 w-[calc(100%-2.75rem)]"
            />
          </li>
          )
        })}
      </ul>
    </div>
  )
}

/** AI 多步骤识别过程 */
export function AIAnalyzePanel({ step }: { step: number }) {
  const labels = [
    'DeepSeek 正在识别文件名称与类型……',
    'DeepSeek 正在推断客户与文件用途……',
    'DeepSeek 正在生成关键词与标签……',
    '正在写入表格汇索引……',
  ]
  const steps: StepItem[] = labels.map((label, i) => ({
    label,
    state: i < step ? 'done' : i === step ? 'active' : 'pending',
  }))

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-50/80 via-white to-orch-50/80 p-5 ring-1 ring-brand-100">
      <div className="flex items-center gap-2.5">
        <Sparkles size={16} className="text-brand-600" />
        <h3 className="text-[14.5px] font-semibold text-slate-900">AI 智能识别</h3>
      </div>
      <AISteps steps={steps} className="mt-4" />
    </div>
  )
}

export interface UploadReview {
  checked: number
  added: number
  empty: string[]
  duplicates: Array<{ skippedName: string; keptName: string }>
  unchecked: string[]
}

export function UploadReviewPanel({ review }: { review: UploadReview }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-card">
      <h3 className="text-[15px] font-semibold text-slate-900">上传检查结果</h3>
      <p className="mt-1 text-[12.5px] text-slate-500">
        已检查本批 {review.checked} 个文件；{review.added} 个进入整理流程，未保存文件内容。
      </p>
      {review.empty.length === 0 && review.duplicates.length === 0 && review.unchecked.length === 0 ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">未发现空文件或重复内容。</p>
      ) : null}
      {review.empty.length ? (
        <div className="mt-3 rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">
          <p className="font-semibold">空文件已从本次上传队列移除</p>
          <ul className="mt-1 list-inside list-disc">{review.empty.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}</ul>
          <p className="mt-1 text-[11.5px]">网页无法删除你设备上的原文件；空文件不会加入表格汇索引。</p>
        </div>
      ) : null}
      {review.duplicates.length ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-800">
          <p className="font-semibold">发现相同文件内容，已合并为一条记录</p>
          <ul className="mt-1 space-y-1">{review.duplicates.map((item, i) => (
            <li key={`${item.skippedName}-${i}`}>保留「{item.keptName}」，跳过重复项「{item.skippedName}」</li>
          ))}</ul>
        </div>
      ) : null}
      {review.unchecked.length ? (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[12.5px] text-slate-600">
          <p className="font-semibold">以下格式无法自动确认是否为空，已保留供你查看</p>
          <ul className="mt-1 list-inside list-disc">{review.unchecked.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}</ul>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * 整理完成：汇总 + 自动分类结果
 * ------------------------------------------------------------------ */

export function OrganizeSummary({
  results,
  className,
}: {
  results: UploadResult[]
  className?: string
}) {
  const sheets = results.filter((r) => r.file.kind === 'sheet').length
  const ppt = results.filter((r) => r.file.kind === 'ppt').length
  const pdf = results.filter((r) => r.file.kind === 'pdf').length
  const docs = results.filter((r) => r.file.kind === 'doc').length

  const counters = [
    { label: '表格', value: sheets, icon: FileSpreadsheet, cls: 'bg-emerald-50 text-emerald-600' },
    { label: 'PPT', value: ppt, icon: Presentation, cls: 'bg-orange-50 text-orange-600' },
    { label: '方案', value: docs, icon: BadgeCheck, cls: 'bg-brand-50 text-brand-600' },
    { label: 'PDF', value: pdf, icon: Tags, cls: 'bg-rose-50 text-rose-600' },
  ].filter((c) => c.value > 0)

  return (
    <div className={cn('rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-card', className)}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={18} />
        </span>
        <div className="flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-slate-900">
            ✓ 整理完毕 <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] text-emerald-700">100%</span>
          </h3>
          <p className="text-[12.5px] text-slate-500">
            共处理 {results.length} 个文件，已全部加入表格汇，可以直接搜索到
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-5 pb-3">
        {counters.map((c) => {
          const Icon = c.icon
          return (
            <span
              key={c.label}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium',
                c.cls,
              )}
            >
              <Icon size={14} />
              发现 {c.value} 个{c.label}
            </span>
          )
        })}
      </div>

      <div className="px-5 pb-5">
        <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
          AI 自动分类结果
        </p>
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.file.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/60"
            >
              <FileIcon kind={r.file.kind} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-700">{r.file.name}</p>
                <p className="mt-0.5 text-[11.5px] text-slate-400">
                  {formatSize(r.file.sizeMB)} · 识别置信度 {Math.round(r.confidence * 100)}%
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="brand">客户：{r.file.client}</Badge>
                <Badge tone="violet">类型：{r.file.category}</Badge>
                {r.file.tags.map((t) => (
                  <Badge key={t} tone="slate">
                    {t}
                  </Badge>
                ))}
              </div>
              <p className="w-full truncate text-[11.5px] text-slate-400">
                关键词：{r.file.keywords.slice(0, 6).join(' / ')}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
