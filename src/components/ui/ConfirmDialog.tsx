import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  tone?: 'danger' | 'brand'
}

export function ConfirmDialog({
  open,
  options,
  onCancel,
  onConfirm,
}: {
  open: boolean
  options: ConfirmOptions | null
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!options) return null
  const tone = options.tone ?? 'danger'
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={options.title}
      icon={
        <span
          className={
            tone === 'danger'
              ? 'flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600'
              : 'flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600'
          }
        >
          {tone === 'danger' ? <AlertTriangle size={18} /> : <HelpCircle size={18} />}
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {options.cancelText ?? '取消'}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {options.confirmText ?? '删除'}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">
        {options.description ?? '此操作无法撤销，请确认。'}
      </p>
    </Modal>
  )
}
