import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  Link2,
  MoreHorizontal,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Wand2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FileIcon } from '@/components/files/FileIcon'
import { Badge, StatusPill } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, PageShell } from '@/components/ui/Card'
import { Dropdown, MenuDivider, MenuItem } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { AIDots } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { getPreview } from '@/data/demo'
import { useApp } from '@/store/AppStore'
import { cn, download, formatDate, formatSize, kindLabel, smartDateTime } from '@/lib/utils'
import type { HubFile } from '@/types'

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-[13px] text-slate-400">{label}</span>
      <span className="min-w-0 break-words text-right text-[13px] font-medium text-slate-700">
        {children}
      </span>
    </div>
  )
}

function PreviewTable({ file }: { file: HubFile }) {
  const preview = useMemo(() => getPreview(file), [file])
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="bg-slate-50">
            {preview.headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3.5 py-2.5 text-[12px] font-semibold text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {preview.rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-50/70">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    'whitespace-nowrap px-3.5 py-2.5 text-[12.5px] text-slate-600',
                    typeof cell === 'number' && 'text-right tabular-nums',
                  )}
                >
                  {typeof cell === 'number' ? cell.toLocaleString('en-US') : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function FileDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const {
    files,
    liveFiles,
    toggleStar,
    markOpened,
    removeFile,
    confirm,
    checkVersion,
    toast,
  } = useApp()

  const file = files.find((f) => f.id === id)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [summaryState, setSummaryState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [customerSummary, setCustomerSummary] = useState('')

  useEffect(() => {
    if (file) markOpened(file.id)
    setSummaryState('idle')
    setCustomerSummary('')
  }, [file?.id])

  /** 同系列版本（防止发错方案的核心数据） */
  const versions = useMemo(() => {
    if (!file?.seriesId) return []
    return liveFiles
      .filter((f) => f.seriesId === file.seriesId)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [file, liveFiles])

  const related = useMemo(() => {
    if (!file) return []
    return liveFiles
      .filter((f) => f.id !== file.id && (f.client === file.client || f.category === file.category))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 5)
  }, [file, liveFiles])

  if (!file) {
    return (
      <PageShell>
        <EmptyState
          icon={<FileSpreadsheet size={22} />}
          title="文件不存在或已被删除"
          description="它可能已经被移到回收站，或者链接已经失效。"
          action={
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              返回首页
            </Button>
          }
        />
      </PageShell>
    )
  }

  function generateCustomerSummary() {
    setSummaryState('loading')
    window.setTimeout(() => {
      const preview = getPreview(file!)
      const numbers = preview.rows
        .flat()
        .filter((v): v is number => typeof v === 'number')
      const total = numbers.length ? Math.max(...numbers) : 0
      const text = [
        `【${file!.client} · ${file!.name.replace(/\.[^.]+$/, '')}】客户版摘要`,
        '',
        `· 交付内容：${file!.aiSummary.bullets.slice(0, 3).join('；')}`,
        `· 关键数据：${total ? `参考金额约 ¥${total.toLocaleString('en-US')}（详见报价明细）` : '详见文件内明细'}`,
        `· 时间安排：签约后 3 个工作日内启动，按季度验收`,
        `· 对接方式：${file!.owner} 负责对接，可随时预约同步会议`,
        '',
        file!.aiSummary.recommend,
        '（本摘要由表格汇 AI 自动生成，可直接复制发送给客户）',
      ].join('\n')
      setCustomerSummary(text)
      setSummaryState('done')
      toast('✓ 已生成客户版摘要', 'success')
    }, 1300)
  }

  return (
    <PageShell wide>
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-[12.5px] text-slate-400">
        <Link to="/dashboard" className="flex items-center gap-1 transition-colors hover:text-slate-700">
          <ArrowLeft size={13} />
          首页
        </Link>
        <span>/</span>
        <Link
          to={file.kind === 'ppt' ? '/ppt' : `/search?q=${encodeURIComponent(file.name.replace(/\.[^.]+$/, ''))}`}
          className="transition-colors hover:text-slate-700"
        >
          {file.kind === 'ppt' ? 'PPT' : '搜索结果'}
        </Link>
        <span>/</span>
        <span className="truncate text-slate-600">{file.name}</span>
      </nav>

      {/* 头部 */}
      <div className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <FileIcon kind={file.kind} filled size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
                  {file.name.replace(/\.[^.]+$/, '')}
                </h1>
                <button
                  onClick={() => toggleStar(file.id)}
                  className={cn(
                    'rounded-lg p-1.5 transition-colors',
                    file.starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400',
                  )}
                  aria-label="收藏"
                >
                  <Star size={16} fill={file.starred ? 'currentColor' : 'none'} />
                </button>
              </div>

              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
                <span className="font-medium text-slate-600">
                  {kindLabel(file.kind)} · {file.category}
                </span>
                <span className="text-slate-300">|</span>
                <span>{file.client}</span>
                <span className="text-slate-300">|</span>
                <span>{smartDateTime(file.updatedAt)}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill status={file.status} />
                {file.version ? <Badge tone="brand">{file.version}</Badge> : null}
                {file.tags.map((t) => (
                  <Badge key={t} tone="slate">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" icon={<Eye size={15} />} onClick={() => setPreviewOpen(true)}>
              打开文件
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                download(file.name)
                toast('已开始下载（演示文件）', 'success')
              }}
            >
              下载
            </Button>
            <Button variant="ai" icon={<Share2 size={15} />} onClick={() => checkVersion(file)}>
              分享
            </Button>
            <Dropdown
              trigger={() => (
                <IconButton label="更多">
                  <MoreHorizontal size={16} />
                </IconButton>
              )}
            >
              {(close) => (
                <>
                  <MenuItem
                    icon={<Star size={15} />}
                    onClick={() => {
                      close()
                      toggleStar(file.id)
                    }}
                  >
                    {file.starred ? '取消收藏' : '加入收藏'}
                  </MenuItem>
                  <MenuItem
                    icon={<Link2 size={15} />}
                    onClick={() => {
                      close()
                      toast('已复制文件链接（演示）', 'info')
                    }}
                  >
                    复制链接
                  </MenuItem>
                  <MenuItem
                    icon={<History size={15} />}
                    onClick={() => {
                      close()
                      toast(`共 ${versions.length || 1} 个版本`, 'info')
                    }}
                  >
                    查看版本历史
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    icon={<Trash2 size={15} />}
                    danger
                    onClick={async () => {
                      close()
                      const ok = await confirm({
                        title: '确定要删除这个文件吗？',
                        description: `「${file.name}」会被移到回收站，之后可以随时恢复。`,
                        confirmText: '删除',
                        cancelText: '取消',
                      })
                      if (ok) {
                        removeFile(file.id)
                        navigate('/dashboard')
                      }
                    }}
                  >
                    删除
                  </MenuItem>
                </>
              )}
            </Dropdown>
          </div>
        </div>
      </div>

      {/* 主体 */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          {/* 文件信息 */}
          <Card>
            <h3 className="text-[15px] font-semibold text-slate-900">文件信息</h3>
            <div className="mt-2 divide-y divide-slate-100">
              <InfoRow label="所属客户">{file.client}</InfoRow>
              <InfoRow label="更新时间">
                {formatDate(file.updatedAt)} · {smartDateTime(file.updatedAt)}
              </InfoRow>
              <InfoRow label="文件大小">{formatSize(file.sizeMB)}</InfoRow>
              <InfoRow label="创建人">{file.owner}</InfoRow>
              <InfoRow label="标签">
                <span className="flex flex-wrap justify-end gap-1">
                  {file.tags.map((t) => (
                    <Badge key={t} tone="slate">
                      {t}
                    </Badge>
                  ))}
                </span>
              </InfoRow>
              <InfoRow label="关键词">
                <span className="text-[12.5px] text-slate-500">
                  {file.keywords.slice(0, 6).join(' / ')}
                </span>
              </InfoRow>
              {file.rows ? <InfoRow label="数据行数">{file.rows} 行</InfoRow> : null}
            </div>
          </Card>

          {/* 预览 */}
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">
                {file.kind === 'sheet' ? '表格预览' : '内容大纲'}
              </h3>
              <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => setPreviewOpen(true)}>
                放大查看
              </Button>
            </div>
            <div className="mt-4">
              {file.kind === 'sheet' ? (
                <PreviewTable file={file} />
              ) : (
                <ol className="space-y-2.5">
                  {file.aiSummary.bullets.map((b, i) => (
                    <li
                      key={b}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200/60"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[12px] font-semibold text-brand-600 ring-1 ring-slate-200">
                        {i + 1}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700">{b}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>

          {/* AI 智能总结 */}
          <Card className="bg-gradient-to-br from-brand-50/70 via-white to-orch-50/70 ring-brand-100">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orch-500 text-white shadow-glow">
                <Sparkles size={17} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">AI 智能总结</h3>
                <p className="text-[12px] text-slate-500">基于文件内容自动生成，可一键改成客户版</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white/80 p-4 ring-1 ring-brand-100">
              <p className="text-[13.5px] leading-relaxed text-slate-700">{file.aiSummary.intro}</p>
              <p className="mt-3 text-[13px] font-medium text-slate-600">主要包含：</p>
              <ol className="mt-1.5 space-y-1 pl-1">
                {file.aiSummary.bullets.map((b, i) => (
                  <li key={b} className="text-[13px] leading-relaxed text-slate-600">
                    {i + 1}. {b}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[13px] font-medium text-brand-700">{file.aiSummary.recommend}</p>
            </div>

            <div className="mt-4">
              {summaryState === 'idle' ? (
                <Button variant="ai" icon={<Wand2 size={15} />} onClick={generateCustomerSummary}>
                  生成客户版摘要
                </Button>
              ) : summaryState === 'loading' ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-white/70 px-3.5 py-3 ring-1 ring-brand-100">
                  <AIDots className="text-brand-500" />
                  <span className="text-[13px] text-slate-500">
                    AI 正在把技术细节翻译成客户能看懂的语言…
                  </span>
                </div>
              ) : (
                <div className="rounded-xl bg-white p-4 ring-1 ring-brand-200">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-700">
                      <BadgeCheck size={13} />
                      客户版摘要
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Copy size={13} />}
                      onClick={() => {
                        navigator.clipboard?.writeText(customerSummary).catch(() => undefined)
                        toast('已复制到剪贴板', 'success')
                      }}
                    >
                      复制
                    </Button>
                  </div>
                  <pre className="mt-2.5 whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-slate-600">
                    {customerSummary}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 右侧栏 */}
        <div className="min-w-0 space-y-5">
          {versions.length > 1 ? (
            <Card>
              <div className="flex items-center gap-2">
                <History size={15} className="text-brand-600" />
                <h3 className="text-[15px] font-semibold text-slate-900">版本历史</h3>
                <Badge tone="brand">{versions.length} 个版本</Badge>
              </div>
              <ul className="mt-3.5 space-y-2">
                {versions.map((v) => {
                  const isCurrent = v.id === file.id
                  const isLatest = v.id === versions[0].id
                  return (
                    <li key={v.id}>
                      <button
                        onClick={() => navigate(`/file/${v.id}`)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors',
                          isCurrent
                            ? 'bg-brand-50 ring-brand-200'
                            : 'bg-slate-50/70 ring-slate-200/60 hover:bg-white',
                        )}
                      >
                        <Badge tone={isLatest ? 'emerald' : 'slate'}>{v.version ?? 'V?'}</Badge>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-slate-700">
                            {v.name}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {smartDateTime(v.updatedAt)} · {v.owner}
                          </span>
                        </span>
                        {isCurrent ? <Badge tone="brand">当前</Badge> : null}
                        {isLatest && !isCurrent ? <Badge tone="emerald">最新</Badge> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-700 ring-1 ring-amber-100">
                AI 会在分享前自动比对版本，避免把旧方案发给客户。
              </p>
            </Card>
          ) : null}

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">相关文件</h3>
              <Button
                size="sm"
                variant="ghost"
                iconRight={<ArrowRight size={13} />}
                onClick={() => navigate(`/search?q=${encodeURIComponent(file.client)}`)}
              >
                更多
              </Button>
            </div>
            <ul className="mt-3 space-y-1.5">
              {related.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => navigate(`/file/${r.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <FileIcon kind={r.kind} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-slate-700">
                        {r.name}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {smartDateTime(r.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="text-[15px] font-semibold text-slate-900">快捷操作</h3>
            <div className="mt-3.5 space-y-2">
              <Button
                variant="secondary"
                full
                icon={<Share2 size={15} />}
                onClick={() => checkVersion(file)}
              >
                分享前 AI 检查
              </Button>
              <Button
                variant="secondary"
                full
                icon={<Download size={15} />}
                onClick={() => {
                  download(file.name)
                  toast('已开始下载（演示文件）', 'success')
                }}
              >
                下载文件
              </Button>
              <Button
                variant="secondary"
                full
                icon={<Star size={15} />}
                onClick={() => toggleStar(file.id)}
              >
                {file.starred ? '取消收藏' : '加入我的收藏'}
              </Button>
              <Button
                variant="ghost"
                full
                icon={<Trash2 size={15} />}
                className="text-rose-600 hover:bg-rose-50"
                onClick={async () => {
                  const ok = await confirm({
                    title: '确定要删除这个文件吗？',
                    description: `「${file.name}」会被移到回收站，之后可以随时恢复。`,
                  })
                  if (ok) {
                    removeFile(file.id)
                    navigate('/dashboard')
                  }
                }}
              >
                删除文件
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 打开文件预览 */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        size="xl"
        title={file.name}
        subtitle={`${kindLabel(file.kind)} · ${file.category} · ${file.client}`}
        icon={<FileIcon kind={file.kind} size="md" />}
        footer={
          <>
            <Button
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => download(file.name)}
            >
              下载
            </Button>
            <Button variant="primary" onClick={() => setPreviewOpen(false)}>
              完成
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {file.kind === 'sheet' ? (
            <PreviewTable file={file} />
          ) : (
            <div className="space-y-3">
              {file.aiSummary.bullets.map((b, i) => (
                <div
                  key={b}
                  className="rounded-xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-200/60"
                >
                  <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                    Slide {i + 1}
                  </p>
                  <p className="mt-1 text-[13.5px] font-medium text-slate-700">{b}</p>
                </div>
              ))}
            </div>
          )}
          <p className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-[12px] text-brand-700 ring-1 ring-brand-100">
            这是演示预览。真实环境中会直接调用 Office 在线预览或下载原始文件。
          </p>
        </div>
      </Modal>
    </PageShell>
  )
}
