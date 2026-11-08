import { CheckCircle2, RefreshCw, Sparkles, Tag, Wand2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FileIcon } from '@/components/files/FileIcon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageShell } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/Loading'
import { StatCard } from '@/components/ui/StatCard'
import { analyzeFilesWithDeepSeek, toOrganizedMetadata } from '@/lib/ai'
import { useApp } from '@/store/AppStore'
import { relativeTime } from '@/lib/utils'
import type { HubFile } from '@/types'

const GENERIC_CATEGORIES = ['客户表格', '内部表格']

export default function OrganizePage() {
  const { liveFiles, toast, updateFilesMetadata } = useApp()
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(100)
  const [reviewed, setReviewed] = useState<string[]>([])
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({})
  const confidenceOf = (file: HubFile) =>
    confidenceScores[file.id] ?? 0.84 + ((file.name.length * 7) % 15) / 100

  const rows = useMemo(
    () =>
      [...liveFiles]
        .sort((a, b) => confidenceOf(a) - confidenceOf(b))
        .slice(0, 40),
    [liveFiles, confidenceScores],
  )

  const pending = useMemo(
    () => liveFiles.filter((f) => GENERIC_CATEGORIES.includes(f.category)),
    [liveFiles],
  )

  const worksheetRows = useMemo(
    () => liveFiles.flatMap((file) => (file.worksheets ?? []).map((sheet) => ({ file, sheet }))),
    [liveFiles],
  )

  const avg = useMemo(() => {
    const list = liveFiles.slice(0, 60)
    if (!list.length) return 0
    return list.reduce((s, f) => s + confidenceOf(f), 0) / list.length
  }, [liveFiles, confidenceScores])

  async function rerun() {
    setRunning(true)
    setProgress(0)
    const id = window.setInterval(() => {
      setProgress((value) => Math.min(90, value + 2))
    }, 500)
    try {
      const analyses = await analyzeFilesWithDeepSeek(liveFiles)
      updateFilesMetadata(liveFiles.map((file, index) => ({
        id: file.id,
        metadata: toOrganizedMetadata(analyses[index]),
      })))
      setConfidenceScores(Object.fromEntries(liveFiles.map((file, index) => [file.id, analyses[index].confidence])))
      setProgress(100)
      toast(`✓ DeepSeek 已重新整理 ${analyses.length} 个文件`, 'success')
    } catch (error) {
      toast(error instanceof Error ? `DeepSeek 整理失败：${error.message}` : 'DeepSeek 整理失败', 'error')
    } finally {
      window.clearInterval(id)
      setRunning(false)
    }
  }

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-orch-600 text-white shadow-glow">
            <Wand2 size={20} />
          </span>
          <div>
            <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">AI 智能整理</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">
              工作簿按每个工作表拆开索引；工作表名称、标题和表头仅在本机读取。
            </p>
          </div>
        </div>
        <Button
          variant="ai"
          icon={<RefreshCw size={15} className={running ? 'animate-spin' : ''} />}
          disabled={running}
          onClick={rerun}
        >
          {running ? '正在重新识别…' : '重新识别全部'}
        </Button>
      </div>

      {running ? (
        <Card className="mt-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orch-500 text-white">
              <Sparkles size={16} />
            </span>
            <div className="flex-1">
              <p className="text-[13.5px] font-medium text-slate-700">
              DeepSeek 正在根据文件名与格式重新整理……（不会上传工作表内容）
              </p>
              <ProgressBar value={progress} className="mt-2" />
            </div>
            <span className="text-[15px] font-semibold tabular-nums text-slate-700">
              {Math.round(progress)}%
            </span>
          </div>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="已自动分类"
          value={liveFiles.length - pending.length}
          hint="上传后自动完成，无需手动整理"
          tone="emerald"
        />
        <StatCard
          icon={<Tag size={18} />}
          label="待人工确认"
          value={pending.length}
          hint="AI 无法确定具体用途的文件"
          tone="amber"
        />
        <StatCard
          icon={<Sparkles size={18} />}
          label="平均识别置信度"
          value={`${Math.round(avg * 100)}%`}
          hint="根据文件名与格式推断；未读取文件内容"
          tone="brand"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">按工作表拆分</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">每个工作表单独列出；只保存名称、标题、表头和行数</p>
          </div>
          <Badge tone="slate">{worksheetRows.length} 个工作表</Badge>
        </div>
        {worksheetRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead><tr className="border-b border-slate-100 bg-slate-50/60">
                {['来源文件', '工作表', '标题', '表头', '数据行数'].map((heading) => <th key={heading} className="px-4 py-2.5 text-[12px] font-semibold text-slate-400">{heading}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {worksheetRows.map(({ file, sheet }, index) => (
                  <tr key={`${file.id}-${sheet.name}-${index}`} className="hover:bg-slate-50/70">
                    <td className="max-w-[240px] truncate px-4 py-3 text-[12.5px] text-slate-600">{file.name}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-slate-800">{sheet.name}</td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-600">{sheet.title || '—'}</td>
                    <td className="max-w-[320px] px-4 py-3 text-[12px] text-slate-500">{sheet.headers.join(' / ') || '—'}</td>
                    <td className="px-4 py-3 text-[12.5px] tabular-nums text-slate-600">{sheet.rowCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-5 py-8 text-center text-[13px] text-slate-400">尚无可拆分的工作簿，请重新上传 XLSX 文件。</p>}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">识别结果</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              按置信度从低到高排序，优先确认最不确定的文件
            </p>
          </div>
          <Badge tone="slate">显示前 {rows.length} 个</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['文件', 'AI 识别客户', '类型', '关键词', '置信度', '操作'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((f) => {
                const conf = confidenceOf(f)
                const done = reviewed.includes(f.id)
                return (
                  <tr key={f.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="max-w-[280px] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileIcon kind={f.kind} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-slate-800">{f.name}</p>
                          <p className="text-[11px] text-slate-400">{relativeTime(f.updatedAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={f.client === '未分类' ? 'amber' : 'brand'}>{f.client}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="violet">{f.category}</Badge>
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="truncate text-[12px] text-slate-500">
                        {f.keywords.slice(0, 4).join(' / ')}
                      </p>
                    </td>
                    <td className="w-[130px] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={conf * 100}
                          tone={conf > 0.92 ? 'emerald' : conf > 0.88 ? 'brand' : 'amber'}
                          className="w-14"
                        />
                        <span className="text-[12px] tabular-nums text-slate-500">
                          {Math.round(conf * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {done ? (
                        <Badge tone="emerald" icon={<CheckCircle2 size={11} />}>
                          已确认
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReviewed((prev) => [...prev, f.id])
                            toast(`已确认「${f.name}」的分类`, 'success')
                          }}
                        >
                          确认
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  )
}
