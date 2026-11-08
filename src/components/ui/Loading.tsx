import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 三个跳动的圆点 */
export function AIDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-end gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current animate-dot-bounce"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  )
}

export function AILoading({
  text = 'AI 正在整理你的文件',
  hint,
  className,
}: {
  text?: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orch-500 text-white shadow-glow">
        <AIDots />
      </span>
      <div>
        <p className="text-[13.5px] font-medium text-slate-700">{text}</p>
        {hint ? <p className="text-[12px] text-slate-400">{hint}</p> : null}
      </div>
    </div>
  )
}

export interface StepItem {
  label: string
  state: 'pending' | 'active' | 'done'
}

/** AI 多步骤进度（正在分析 / 正在提取 / 正在生成……） */
export function AISteps({ steps, className }: { steps: StepItem[]; className?: string }) {
  return (
    <ul className={cn('space-y-2.5', className)}>
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-3 text-[13.5px]">
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors',
              s.state === 'done' && 'bg-emerald-100 text-emerald-600',
              s.state === 'active' && 'bg-brand-100 text-brand-600',
              s.state === 'pending' && 'bg-slate-100 text-slate-300',
            )}
          >
            {s.state === 'done' ? (
              <Check size={12} strokeWidth={3} />
            ) : s.state === 'active' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
          </span>
          <span
            className={cn(
              s.state === 'pending' ? 'text-slate-400' : 'text-slate-700',
              s.state === 'active' && 'font-medium',
            )}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ProgressBar({
  value,
  className,
  tone = 'brand',
}: {
  value: number
  className?: string
  tone?: 'brand' | 'emerald' | 'amber'
}) {
  const tones = {
    brand: 'from-brand-500 to-orch-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
  }
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-300 ease-out', tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-slate-100', className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  )
}
