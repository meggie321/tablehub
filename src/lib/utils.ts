import type { AccentColor, FileExt, FileKind } from '@/types'

/** 合并 className */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

const DAY = 24 * 60 * 60 * 1000

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** 2026/10/06 */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
}

/** 10月6日 */
export function formatMonthDay(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** 09:42 */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** 10分钟前 / 1小时前 / 昨天 / 3天前 / 10月6日 */
export function relativeTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const diff = now.getTime() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  const days = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / DAY)
  if (days === 0) return `${Math.floor(diff / 3600000)}小时前`
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return formatMonthDay(iso)
}

/** 今天 09:42 / 昨天 18:32 / 10月6日 14:20 */
export function smartDateTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const days = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / DAY)
  const t = formatTime(iso)
  if (days === 0) return `今天 ${t}`
  if (days === 1) return `昨天 ${t}`
  if (days < 7) return `${days}天前 ${t}`
  return `${formatDate(iso)} ${t}`
}

/** ¥128,450 */
export function formatMoney(n: number): string {
  return `¥${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

/** 2.4 MB */
export function formatSize(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`
  return `${mb.toFixed(1)} MB`
}

export function kindLabel(kind: FileKind): string {
  switch (kind) {
    case 'sheet':
      return '表格'
    case 'doc':
      return '方案'
    case 'ppt':
      return 'PPT'
    case 'pdf':
      return 'PDF'
  }
}

export function extLabel(ext: FileExt): string {
  return ext.toUpperCase()
}

/** 文件类型对应的主题色 */
export function kindColor(kind: FileKind): {
  text: string
  bg: string
  ring: string
  solid: string
  grad: string
} {
  switch (kind) {
    case 'sheet':
      return {
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        ring: 'ring-emerald-100',
        solid: 'bg-emerald-500',
        grad: 'from-emerald-400 to-teal-500',
      }
    case 'ppt':
      return {
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        ring: 'ring-orange-100',
        solid: 'bg-orange-500',
        grad: 'from-orange-400 to-rose-500',
      }
    case 'pdf':
      return {
        text: 'text-rose-600',
        bg: 'bg-rose-50',
        ring: 'ring-rose-100',
        solid: 'bg-rose-500',
        grad: 'from-rose-400 to-red-500',
      }
    case 'doc':
    default:
      return {
        text: 'text-brand-600',
        bg: 'bg-brand-50',
        ring: 'ring-brand-100',
        solid: 'bg-brand-600',
        grad: 'from-brand-500 to-orch-600',
      }
  }
}

const ACCENT: Record<AccentColor, { chip: string; dot: string; text: string }> = {
  indigo: { chip: 'bg-brand-50 text-brand-700 ring-brand-100', dot: 'bg-brand-500', text: 'text-brand-600' },
  violet: { chip: 'bg-orch-50 text-orch-700 ring-orch-100', dot: 'bg-orch-500', text: 'text-orch-600' },
  blue: { chip: 'bg-blue-50 text-blue-700 ring-blue-100', dot: 'bg-blue-500', text: 'text-blue-600' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  amber: { chip: 'bg-amber-50 text-amber-700 ring-amber-100', dot: 'bg-amber-500', text: 'text-amber-600' },
  rose: { chip: 'bg-rose-50 text-rose-700 ring-rose-100', dot: 'bg-rose-500', text: 'text-rose-600' },
  cyan: { chip: 'bg-cyan-50 text-cyan-700 ring-cyan-100', dot: 'bg-cyan-500', text: 'text-cyan-600' },
  slate: { chip: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400', text: 'text-slate-500' },
}

export function accent(color: AccentColor) {
  return ACCENT[color] ?? ACCENT.slate
}

const STATUS_STYLE: Record<string, string> = {
  已完成: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  进行中: 'bg-blue-50 text-blue-700 ring-blue-100',
  待审核: 'bg-amber-50 text-amber-700 ring-amber-100',
  草稿: 'bg-slate-100 text-slate-600 ring-slate-200',
  已审核: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  已驳回: 'bg-rose-50 text-rose-700 ring-rose-100',
}

export function statusStyle(status: string): string {
  return STATUS_STYLE[status] ?? STATUS_STYLE['草稿']
}

/** 高亮命中片段 */
export function highlight(text: string, query: string): Array<{ t: string; hit: boolean }> {
  const q = query.trim()
  if (!q) return [{ t: text, hit: false }]
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return [{ t: text, hit: false }]
  return [
    { t: text.slice(0, idx), hit: false },
    { t: text.slice(idx, idx + q.length), hit: true },
    { t: text.slice(idx + q.length), hit: false },
  ].filter((p) => p.t.length > 0)
}

export function download(name: string): void {
  const blob = new Blob(
    [`表格汇 TableHub Demo\n\n文件：${name}\n\n这是一个演示文件，用于展示下载交互。`],
    { type: 'text/plain;charset=utf-8' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/\.[^.]+$/, '')}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
