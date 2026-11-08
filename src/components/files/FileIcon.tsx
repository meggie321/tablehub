import { FileSpreadsheet, FileText, FileType2, Presentation } from 'lucide-react'
import { cn, kindColor } from '@/lib/utils'
import type { FileKind } from '@/types'

const ICONS: Record<FileKind, typeof FileText> = {
  sheet: FileSpreadsheet,
  doc: FileText,
  ppt: Presentation,
  pdf: FileType2,
}

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 15 },
  md: { box: 'h-10 w-10 rounded-xl', icon: 18 },
  lg: { box: 'h-12 w-12 rounded-xl', icon: 22 },
} as const

export function FileIcon({
  kind,
  size = 'md',
  className,
  filled,
}: {
  kind: FileKind
  size?: keyof typeof SIZES
  className?: string
  /** 使用实色渐变底 + 白色图标 */
  filled?: boolean
}) {
  const Icon = ICONS[kind]
  const c = kindColor(kind)
  const s = SIZES[size]
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center',
        s.box,
        filled ? cn('bg-gradient-to-br text-white', c.grad) : cn(c.bg, c.text),
        className,
      )}
    >
      <Icon size={s.icon} strokeWidth={2} />
    </span>
  )
}
