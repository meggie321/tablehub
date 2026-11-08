import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StatTone = 'brand' | 'violet' | 'blue' | 'emerald' | 'amber'

const TONES: Record<StatTone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  violet: 'bg-orch-50 text-orch-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = 'brand',
  hintTone = 'muted',
  className,
  onClick,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: StatTone
  hintTone?: 'muted' | 'up' | 'down'
  className?: string
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl bg-white p-5 text-left ring-1 ring-slate-200/80 shadow-card transition-all duration-200',
        onClick && 'hover:-translate-y-0.5 hover:shadow-lift hover:ring-slate-300/70',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', TONES[tone])}>
          {icon}
        </span>
        <span className="text-[13.5px] font-medium text-slate-500">{label}</span>
      </div>
      <p className="mt-4 text-[30px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {hint ? (
        <p
          className={cn(
            'mt-2 text-[12.5px]',
            hintTone === 'up' && 'font-medium text-emerald-600',
            hintTone === 'down' && 'font-medium text-rose-600',
            hintTone === 'muted' && 'text-slate-400',
          )}
        >
          {hint}
        </p>
      ) : null}
    </Comp>
  )
}

/** 迷你柱状图（Dashboard 趋势用） */
export function MiniBars({
  data,
  className,
  tone = 'brand',
}: {
  data: Array<{ label: string; value: number }>
  className?: string
  tone?: 'brand' | 'emerald'
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className={cn('flex items-end gap-1.5', className)}>
      {data.map((d, i) => (
        <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-16 w-full items-end">
            <div
              className={cn(
                'w-full rounded-md transition-all duration-300',
                tone === 'brand'
                  ? 'bg-gradient-to-t from-brand-200 to-brand-500'
                  : 'bg-gradient-to-t from-emerald-200 to-emerald-500',
                i === data.length - 1 && 'opacity-60',
              )}
              style={{ height: `${Math.max(6, (d.value / max) * 100)}%` }}
              title={`${d.label}：${d.value}`}
            />
          </div>
          <span className="text-[10.5px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
