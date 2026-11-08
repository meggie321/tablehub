import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { ToastItem } from '@/types'

const TONES: Record<ToastItem['tone'], { icon: typeof Info; className: string; iconClass: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'ring-emerald-100',
    iconClass: 'text-emerald-600',
  },
  info: { icon: Info, className: 'ring-brand-100', iconClass: 'text-brand-600' },
  warn: { icon: AlertTriangle, className: 'ring-amber-100', iconClass: 'text-amber-600' },
  error: { icon: XCircle, className: 'ring-rose-100', iconClass: 'text-rose-600' },
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end sm:px-0">
      {toasts.map((t) => {
        const cfg = TONES[t.tone]
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lift ring-1 animate-slide-in-right',
              cfg.className,
            )}
          >
            <Icon size={18} className={cn('shrink-0', cfg.iconClass)} />
            <p className="flex-1 text-[13.5px] font-medium text-slate-700">{t.text}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="关闭提示"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
