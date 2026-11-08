import { cn } from '@/lib/utils'

const GRADIENTS = [
  'from-brand-500 to-orch-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-fuchsia-500',
]

function initials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  if (/^[\x00-\x7F]+$/.test(trimmed)) {
    return trimmed.slice(0, 2).toUpperCase()
  }
  return trimmed.slice(-2)
}

export function Avatar({
  name,
  size = 36,
  className,
  ring,
}: {
  name: string
  size?: number
  className?: string
  ring?: boolean
}) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  const grad = GRADIENTS[h % GRADIENTS.length]
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
        grad,
        ring && 'ring-2 ring-white',
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  )
}
