import { ArrowRight, Building2, Clock, Search, Sparkles, Tag, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileIcon } from '@/components/files/FileIcon'
import { useApp } from '@/store/AppStore'
import { suggest, type Suggestion } from '@/lib/search'
import { cn, relativeTime } from '@/lib/utils'

const SIZES = {
  md: { box: 'h-11 rounded-xl', text: 'text-sm', pad: 'px-3.5', icon: 16 },
  lg: { box: 'h-12 rounded-2xl', text: 'text-[15px]', pad: 'px-4', icon: 18 },
  hero: { box: 'h-14 sm:h-16 rounded-2xl', text: 'text-[15px] sm:text-base', pad: 'px-4 sm:px-5', icon: 20 },
} as const

const SUGGEST_ICON: Record<Suggestion['type'], ReactNode> = {
  client: <Building2 size={15} className="text-brand-500" />,
  file: <FileIcon kind="sheet" size="sm" className="h-6 w-6 rounded-md" />,
  tag: <Tag size={15} className="text-amber-500" />,
  owner: <User size={15} className="text-slate-400" />,
}

/** 图标按文件类型展示更准确，这里做一次轻量替换 */
function suggestIcon(s: Suggestion, files: ReturnType<typeof useApp>['liveFiles']): ReactNode {
  if (s.type !== 'file') return SUGGEST_ICON[s.type]
  const f = files.find((x) => x.name === s.label)
  return f ? <FileIcon kind={f.kind} size="sm" className="h-6 w-6 rounded-md" /> : SUGGEST_ICON.file
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  size = 'md',
  placeholder = '搜索表格、客户、员工、方案名称……',
  autoFocus,
  className,
  rightSlot,
  showSuggest = true,
  showHot,
  hotSearches = [],
  extraFooter,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  size?: keyof typeof SIZES
  placeholder?: string
  autoFocus?: boolean
  className?: string
  rightSlot?: ReactNode
  showSuggest?: boolean
  showHot?: boolean
  hotSearches?: string[]
  extraFooter?: ReactNode
}) {
  const { liveFiles } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const s = SIZES[size]

  const suggestions = useMemo(
    () => (showSuggest && value.trim() ? suggest(liveFiles, value, 6) : []),
    [liveFiles, value, showSuggest],
  )

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    setActive(-1)
  }, [value])

  function pick(sg: Suggestion) {
    setOpen(false)
    if (sg.type === 'file') {
      const f = liveFiles.find((x) => x.name === sg.label)
      if (f) {
        navigate(`/file/${f.id}`)
        return
      }
    }
    onChange(sg.label)
    onSubmit(sg.label)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, -1))
    } else if (e.key === 'Enter') {
      if (active >= 0 && suggestions[active]) {
        e.preventDefault()
        pick(suggestions[active])
      } else {
        setOpen(false)
        onSubmit(value)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showPanel = open && (suggestions.length > 0 || Boolean(value.trim()))

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center gap-2.5 bg-white ring-1 ring-slate-200 transition-all duration-200',
          'shadow-soft focus-within:ring-2 focus-within:ring-brand-500/50',
          s.box,
          s.pad,
        )}
      >
        <Search size={s.icon} className="shrink-0 text-slate-400" />
        <input
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          className={cn('min-w-0 flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none', s.text)}
        />
        {value ? (
          <button
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="shrink-0 rounded-md px-1.5 text-[11px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            清空
          </button>
        ) : null}
        {rightSlot}
      </div>

      {showHot && hotSearches.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] text-slate-400">热门搜索：</span>
          {hotSearches.map((h) => (
            <button
              key={h}
              onClick={() => {
                onChange(h)
                onSubmit(h)
              }}
              className="rounded-lg bg-white px-2.5 py-1 text-[12.5px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
            >
              {h}
            </button>
          ))}
        </div>
      ) : null}

      {showPanel ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-slate-200/80 animate-scale-in">
          {suggestions.length ? (
            <ul className="max-h-[340px] overflow-y-auto p-1.5">
              {suggestions.map((sg, i) => (
                <li key={`${sg.type}-${sg.label}`}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(sg)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                      active === i ? 'bg-brand-50' : 'hover:bg-slate-50',
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                      {suggestIcon(sg, liveFiles)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-slate-700">
                        {sg.label}
                      </span>
                      <span className="block truncate text-[11.5px] text-slate-400">{sg.hint}</span>
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-[13px] text-slate-400">
              没有匹配的建议，按 Enter 直接搜索「{value}」
            </div>
          )}

          <button
            onClick={() => {
              setOpen(false)
              onSubmit(value)
            }}
            className="flex w-full items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-left text-[13px] font-medium text-brand-700 hover:bg-brand-50"
          >
            <Sparkles size={14} />
            用 AI 搜索「{value.trim() || '全部文件'}」
          </button>
          {extraFooter}
        </div>
      ) : null}
    </div>
  )
}

/** 搜索框下方的热门搜索（独立使用） */
export function HotSearches({
  items,
  onPick,
  className,
}: {
  items: string[]
  onPick: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="flex items-center gap-1 text-[12.5px] text-slate-400">
        <Clock size={12} />
        热门搜索
      </span>
      {items.map((h) => (
        <button
          key={h}
          onClick={() => onPick(h)}
          className="rounded-lg bg-white px-2.5 py-1 text-[12.5px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
        >
          {h}
        </button>
      ))}
    </div>
  )
}
