import type { ReactNode } from 'react'
import { cn, statusStyle } from '@/lib/utils'

export type BadgeTone =
  | 'brand'
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'orange'
  | 'cyan'

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  violet: 'bg-orch-50 text-orch-700 ring-orch-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
}

export function Badge({
  tone = 'slate',
  children,
  className,
  icon,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset',
        statusStyle(status),
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  )
}

export function TagChip({
  label,
  active,
  onClick,
  onRemove,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  onRemove?: () => void
}) {
  const Comp = onClick ? 'button' : 'span'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium ring-1 ring-inset transition-colors',
        active
          ? 'bg-brand-600 text-white ring-brand-600'
          : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100',
        onClick && 'cursor-pointer',
      )}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 text-current/70 hover:text-current"
          aria-label={`移除 ${label}`}
        >
          ×
        </button>
      ) : null}
    </Comp>
  )
}
