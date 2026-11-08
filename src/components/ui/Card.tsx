import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({
  className,
  children,
  hoverable,
  padded = true,
}: {
  className?: string
  children: ReactNode
  hoverable?: boolean
  padded?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-card',
        padded && 'p-5',
        hoverable && 'transition-all duration-200 hover:shadow-lift hover:ring-slate-300/80',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900 truncate">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

/** 页面级容器：统一最大宽度与间距 */
export function PageShell({
  children,
  className,
  wide,
}: {
  children: ReactNode
  className?: string
  wide?: boolean
}) {
  return (
    <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8', wide ? 'max-w-[1500px]' : 'max-w-[1240px]', className)}>
      {children}
    </div>
  )
}
