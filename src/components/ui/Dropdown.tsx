import { useState, type ReactNode } from 'react'
import { useClickOutside } from '@/lib/hooks'
import { cn } from '@/lib/utils'

export function Dropdown({
  trigger,
  children,
  align = 'right',
  width = 'w-52',
  className,
}: {
  trigger: (open: boolean) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  width?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open)

  return (
    <div className={cn('relative', className)} ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open ? (
        <div
          className={cn(
            'absolute z-50 mt-2 overflow-hidden rounded-xl bg-white p-1.5 shadow-pop ring-1 ring-slate-200/80 animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            width,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors',
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-slate-100" />
}
