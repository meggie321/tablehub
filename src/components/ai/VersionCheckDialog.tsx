import { ArrowRight, BadgeCheck, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useApp } from '@/store/AppStore'
import { relativeTime, smartDateTime } from '@/lib/utils'
import type { HubFile } from '@/types'

/**
 * 「防止发错方案」——分享前的 AI 版本检查。
 * 如果同一系列存在更新的版本，会提示用户改用最新版。
 */
export function VersionCheckDialog({
  file,
  onClose,
}: {
  file: HubFile | null
  onClose: () => void
}) {
  const { liveFiles, toast, markOpened } = useApp()
  const navigate = useNavigate()

  const newer = useMemo(() => {
    if (!file?.seriesId) return []
    return liveFiles
      .filter(
        (f) =>
          f.seriesId === file.seriesId &&
          f.id !== file.id &&
          +new Date(f.updatedAt) > +new Date(file.updatedAt),
      )
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [file, liveFiles])

  if (!file) return null

  const latest = newer[0]
  const hasNewer = Boolean(latest)

  function useLatest() {
    if (!latest) return
    markOpened(latest.id)
    onClose()
    toast(`已切换到最新版本 ${latest.version ?? ''}`, 'success')
    navigate(`/file/${latest.id}`)
  }

  function sendAnyway() {
    onClose()
    toast('已复制分享链接（演示环境不真正发出）', 'info')
  }

  return (
    <Modal
      open={Boolean(file)}
      onClose={onClose}
      size="lg"
      title={hasNewer ? '发送前检查' : '发送前检查通过'}
      subtitle="AI 自动比对了同一系列文件的所有版本"
      icon={
        <span
          className={
            hasNewer
              ? 'flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600'
              : 'flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600'
          }
        >
          {hasNewer ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
        </span>
      }
      footer={
        hasNewer ? (
          <>
            <Button variant="secondary" onClick={sendAnyway}>
              仍然发送当前文件
            </Button>
            <Button variant="ai" icon={<Sparkles size={15} />} onClick={useLatest}>
              使用最新版本
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={sendAnyway}>
            复制分享链接
          </Button>
        )
      }
    >
      {hasNewer && latest ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            我发现你选择的文件可能<strong className="text-amber-600">不是最新版本</strong>。
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/70">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                当前文件
              </p>
              <p className="mt-1.5 text-[13.5px] font-medium text-slate-700">{file.name}</p>
              <p className="mt-1 text-[12px] text-slate-400">
                {file.version ?? '历史版本'} · 更新于 {relativeTime(file.updatedAt)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50/70 p-3.5 ring-1 ring-emerald-100">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-emerald-600">
                系统发现
              </p>
              <p className="mt-1.5 text-[13.5px] font-medium text-emerald-800">{latest.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone="emerald" icon={<BadgeCheck size={11} />}>
                  {latest.version ?? '最新'}
                </Badge>
                <span className="text-[12px] text-emerald-700">
                  更新于 {smartDateTime(latest.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-orch-50 p-3.5 ring-1 ring-brand-100">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-600" />
            <div>
              <p className="text-[13px] font-semibold text-brand-800">AI 建议</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">
                建议发送 {latest.version ?? '最新版本'} 最新版本，避免把旧方案发给客户。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12.5px] text-slate-400">
            <span>版本链路</span>
            <ArrowRight size={12} />
            <span className="text-slate-500">{file.version ?? '旧版'}</span>
            <ArrowRight size={12} />
            <span className="font-medium text-emerald-600">{latest.version ?? '最新'}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50/70 p-3.5 ring-1 ring-emerald-100">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-[13.5px] font-semibold text-emerald-800">这是最新版本</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                「{file.name}」没有更新的版本，可以放心发送给客户。
              </p>
            </div>
          </div>
          <dl className="grid gap-2 rounded-xl bg-slate-50 p-3.5 text-[13px] ring-1 ring-slate-200/70">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">最后更新</dt>
              <dd className="font-medium text-slate-700">{smartDateTime(file.updatedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">创建人</dt>
              <dd className="font-medium text-slate-700">{file.owner}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">所属客户</dt>
              <dd className="font-medium text-slate-700">{file.client}</dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  )
}
