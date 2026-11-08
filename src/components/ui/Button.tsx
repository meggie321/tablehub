import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'ai' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-[0_1px_2px_rgba(15,23,42,0.10)]',
  secondary:
    'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 shadow-card',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  outline: 'bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50',
  ai: 'text-white bg-gradient-to-r from-brand-600 via-brand-500 to-orch-600 hover:brightness-110 shadow-glow',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
  icon: 'h-9 w-9 rounded-xl',
}

const BASE =
  'inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-all duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 ' +
  'disabled:opacity-50 disabled:pointer-events-none'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  full?: boolean
  className?: string
  children?: ReactNode
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>
type LinkButtonProps = CommonProps & { to: string; title?: string }

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], full && 'w-full', className)}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
  to,
  title,
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      title={title}
      className={cn(BASE, VARIANTS[variant], SIZES[size], full && 'w-full', className)}
    >
      {icon}
      {children}
      {iconRight}
    </Link>
  )
}

/** 只显示图标的方形按钮 */
export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        BASE,
        'h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
