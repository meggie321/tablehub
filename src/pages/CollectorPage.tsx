import { ArrowRight, Files, Layers, RotateCcw, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileTable } from '@/components/files/FileTable'
import { UploadDropzone, type PickedFile } from '@/components/upload/UploadDropzone'
import {
  AIAnalyzePanel,
  OrganizeSummary,
  UploadReviewPanel,
  UploadProgressPanel,
  type UploadReview,
} from '@/components/upload/UploadProgress'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageShell, SectionTitle } from '@/components/ui/Card'
import { analyzeFilesWithDeepSeek, DEMO_UPLOAD_FILES, buildUploadedFile, type UploadResult } from '@/lib/ai'
import { useApp } from '@/store/AppStore'
import { formatSize, uid } from '@/lib/utils'
import { inspectUploadFile, inspectWorkbookSheets } from '@/lib/uploadInspection'
import type { UploadTask } from '@/types'

type Phase = 'idle' | 'uploading' | 'analyzing' | 'done'

const SUPPORTED = ['XLSX', 'XLS', 'CSV', 'PDF', 'PPTX', 'DOCX']

export default function CollectorPage() {
  const { liveFiles, addFiles, toast } = useApp()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('idle')
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const [results, setResults] = useState<UploadResult[]>([])
  const [aiStep, setAiStep] = useState(0)
  const [review, setReview] = useState<UploadReview | null>(null)
  const [checking, setChecking] = useState(false)

  /** 进度推进 */
  useEffect(() => {
    if (phase !== 'uploading') return
    const id = window.setInterval(() => {
      setTasks((prev) =>
        prev.map((t) =>
          t.progress >= 100
            ? t
            : { ...t, progress: Math.min(100, t.progress + 7 + Math.random() * 16) },
        ),
      )
    }, 150)
    return () => window.clearInterval(id)
  }, [phase])

  /** 全部上传完成 → 进入 AI 识别 */
  useEffect(() => {
    if (phase === 'uploading' && tasks.length > 0 && tasks.every((t) => t.progress >= 100)) {
      const t = window.setTimeout(() => setPhase('analyzing'), 320)
      return () => window.clearTimeout(t)
    }
  }, [phase, tasks])

  /** AI 识别阶段 */
  useEffect(() => {
    if (phase !== 'analyzing') return
    let active = true
    const timers = [
      window.setTimeout(() => setAiStep(1), 250),
      window.setTimeout(() => setAiStep(2), 900),
      window.setTimeout(() => setAiStep(3), 1700),
    ]
    const finish = (built: UploadResult[], usedFallback: boolean) => {
      if (!active) return
      timers.forEach((timer) => window.clearTimeout(timer))
      setAiStep(4)
      setResults(built)
      addFiles(built.map((item) => item.file))
      setPhase('done')
      toast(
        usedFallback
          ? `DeepSeek 暂不可用，已用本地规则整理并加入 ${built.length} 个文件`
          : `✓ DeepSeek 已整理并加入 ${built.length} 个文件`,
        usedFallback ? 'warn' : 'success',
      )
    }

    analyzeFilesWithDeepSeek(tasks).then((analyses) => {
      finish(tasks.map((task, index) => buildUploadedFile(task.name, task.sizeMB, analyses[index], task.contentHash, task.worksheets)), false)
    }).catch(() => {
      finish(tasks.map((task) => buildUploadedFile(task.name, task.sizeMB, undefined, task.contentHash, task.worksheets)), true)
    })

    return () => {
      active = false
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [phase, tasks, addFiles, toast])

  async function start(picked: PickedFile[]) {
    if (!picked.length) return
    setChecking(true)
    setResults([])
    setAiStep(0)
    setReview(null)
    const empty: string[] = []
    const duplicates: UploadReview['duplicates'] = []
    const unchecked: string[] = []
    const unique: Array<PickedFile & { contentHash?: string; worksheets?: Awaited<ReturnType<typeof inspectWorkbookSheets>> }> = []
    const seen = new Map<string, string>()

    for (const item of picked) {
      let contentHash: string | undefined
      let worksheets: Awaited<ReturnType<typeof inspectWorkbookSheets>> | undefined
      if (item.file) {
        try {
          const inspection = await inspectUploadFile(item.file)
          if (inspection.isEmpty) {
            empty.push(item.name)
            continue
          }
          contentHash = inspection.contentHash
          if (/\.xlsx$/i.test(item.name)) {
            try {
              worksheets = await inspectWorkbookSheets(item.file)
            } catch {
              // Keep the original upload usable if workbook sheet indexing fails.
            }
          }
          if (!inspection.emptyCheckSupported) unchecked.push(item.name)
        } catch {
          unchecked.push(item.name)
        }
      } else {
        // Demo files have no bytes; this stable marker only prevents repeated demo entries.
        contentHash = `demo:${item.name}`
      }

      if (contentHash) {
        const existing = liveFiles.find((file) => file.contentHash === contentHash)
        const sameBatch = seen.get(contentHash)
        if (existing || sameBatch) {
          duplicates.push({ skippedName: item.name, keptName: existing?.name ?? sameBatch! })
          continue
        }
        seen.set(contentHash, item.name)
      }
      unique.push({ ...item, contentHash, worksheets })
    }
    setChecking(false)
    setReview({ checked: picked.length, added: unique.length, empty, duplicates, unchecked })

    if (unique.length === 0) {
      setTasks([])
      setPhase('done')
      toast('检查完成，没有新的有效文件需要整理', empty.length || duplicates.length ? 'warn' : 'info')
      return
    }

    setTasks(unique.map((item) => ({
      id: uid('task'),
      name: item.name,
      sizeMB: item.sizeMB,
      contentHash: item.contentHash,
      worksheets: item.worksheets,
      progress: 0,
      stage: 'uploading',
    })))
    setPhase('uploading')
    toast(`检查完成，开始整理 ${unique.length} 个文件`, 'info')
  }

  const recent = useMemo(
    () =>
      [...liveFiles]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 8),
    [liveFiles],
  )

  const totalSize = liveFiles.reduce((s, f) => s + f.sizeMB, 0)

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">表格汇集器</h2>
          <p className="mt-1.5 text-[14px] text-slate-500">
            把分散的表格统一放到这里，搜索一次即可找到。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand" icon={<Layers size={11} />}>
            已汇集 {liveFiles.length} 个文件
          </Badge>
          <Badge tone="slate" icon={<Files size={11} />}>
            共 {formatSize(totalSize)}
          </Badge>
        </div>
      </div>

      {/* 上传区 / 上传流程 */}
      <div className="mt-6">
        {phase === 'idle' ? (
          <>
            <UploadDropzone onFiles={start} onDemo={() => start(DEMO_UPLOAD_FILES)} busy={checking} />
            {checking ? <p className="mt-3 text-center text-[13px] text-slate-500">正在本机检查空文件和重复内容，文件内容不会上传或保存……</p> : null}
          </>
        ) : (
          <div className="space-y-4">
            {phase === 'uploading' ? <UploadProgressPanel tasks={tasks} /> : null}
            {phase === 'analyzing' ? (
              <>
                <UploadProgressPanel tasks={tasks} waitingForAI />
                <AIAnalyzePanel step={aiStep} />
              </>
            ) : null}
            {phase === 'done' ? (
              <>
                {review ? <UploadReviewPanel review={review} /> : null}
                {results.length ? <OrganizeSummary results={results} /> : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    icon={<Search size={15} />}
                    disabled={!results.length}
                    onClick={() =>
                      navigate(
                        `/search?q=${encodeURIComponent(results[0]?.file.name.split(/[.\s]/)[0] ?? '')}`,
                      )
                    }
                  >
                    搜索刚上传的文件
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<RotateCcw size={15} />}
                    onClick={() => {
                      setPhase('idle')
                      setTasks([])
                      setResults([])
                      setReview(null)
                    }}
                  >
                    继续上传
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* 说明卡片 */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Sparkles size={17} />
            </span>
            <h3 className="text-[14px] font-semibold text-slate-900">上传后自动识别</h3>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
            DeepSeek 会根据文件名和格式识别客户、用途、关键词与标签。当前演示版不上传或读取文件内容。
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Files size={17} />
            </span>
            <h3 className="text-[14px] font-semibold text-slate-900">支持的格式</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUPPORTED.map((s) => (
              <Badge key={s} tone="slate">
                {s}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
            支持批量拖动，一次可以整理几十份文件。
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-brand-50 via-white to-orch-50 ring-brand-100">
          <h3 className="text-[14px] font-semibold text-slate-900">不想手动找文件？</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            直接问 AI 助手，例如「帮我找星河科技最近的报价表」，它会返回文件并给出建议。
          </p>
          <Button
            variant="ai"
            size="sm"
            className="mt-3.5"
            icon={<Sparkles size={14} />}
            iconRight={<ArrowRight size={13} />}
            onClick={() => navigate('/ai')}
          >
            打开 AI 助手
          </Button>
        </Card>
      </div>

      {/* 最近汇集 */}
      <div className="mt-8">
        <SectionTitle
          title="最近汇集的文件"
          subtitle="新上传的文件会自动出现在搜索结果里"
        />
        <div className="mt-4">
          <FileTable files={recent} emptyAction={<Button variant="primary" onClick={() => start(DEMO_UPLOAD_FILES)}>上传承第一个表格</Button>} />
        </div>
      </div>
    </PageShell>
  )
}
