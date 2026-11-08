import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  count?: number
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: Array<SegmentedOption<T>>
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/80 p-1',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-[12.5px]' : 'h-8 px-3 text-[13px]',
              active
                ? 'bg-white text-brand-700 shadow-card ring-1 ring-slate-200/70'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {o.label}
            {typeof o.count === 'number' ? (
              <span
                className={cn(
                  'rounded-md px-1.5 py-px text-[11px] tabular-nums',
                  active ? 'bg-brand-50 text-brand-600' : 'bg-slate-200/70 text-slate-500',
                )}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** 横向滚动的筛选胶囊（移动端友好） */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1', className)}>
      {children}
    </div>
  )
}

export function Chip({
  active,
  onClick,
  children,
  tone = 'brand',
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  tone?: 'brand' | 'slate'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium transition-all duration-150',
        active
          ? tone === 'brand'
            ? 'bg-brand-600 text-white shadow-[0_2px_8px_-2px_rgba(79,70,229,0.5)]'
            : 'bg-slate-900 text-white'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900',
      )}
    >
      {children}
    </button>
  )
}
