import { useCallback, useEffect, useRef, useState } from 'react'

/** 媒体查询 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** 点击外部关闭 */
export function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
  active = true,
): React.RefObject<T> {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!active) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onOutside, active])
  return ref
}

/** localStorage 持久化状态 */
export function usePersistentState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw) as T
    } catch {
      /* ignore */
    }
    return initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [key, state])

  return [state, setState]
}

/** 防抖值 */
export function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

/** 锁定 body 滚动（弹窗用） */
export function useLockBody(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

/** 模拟异步流程：分步回调 */
export function useSequence(): {
  run: (steps: Array<{ label: string; ms: number; onDone?: () => void }>, onFinish?: () => void) => void
  step: string | null
  running: boolean
} {
  const [step, setStep] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const run = useCallback(
    (
      steps: Array<{ label: string; ms: number; onDone?: () => void }>,
      onFinish?: () => void,
    ) => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
      setRunning(true)
      let acc = 0
      steps.forEach((s, i) => {
        acc += s.ms
        const id = window.setTimeout(() => {
          setStep(s.label)
          s.onDone?.()
          if (i === steps.length - 1) {
            setRunning(false)
            onFinish?.()
          }
        }, acc)
        timers.current.push(id)
      })
    },
    [],
  )

  return { run, step, running }
}
