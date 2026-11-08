import { ChevronDown } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400',
        'ring-1 ring-slate-200 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/60',
        className,
      )}
      {...rest}
    />
  )
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400',
        'ring-1 ring-slate-200 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/60',
        className,
      )}
      {...rest}
    />
  )
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn(
          'h-10 w-full appearance-none rounded-xl bg-white px-3.5 pr-9 text-sm text-slate-700',
          'ring-1 ring-slate-200 transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/60',
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-slate-600">
        {label}
        {hint ? <span className="text-[12px] font-normal text-slate-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-slate-700">{label}</p>
        {description ? <p className="mt-0.5 text-[12.5px] text-slate-500">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-brand-600' : 'bg-slate-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}
