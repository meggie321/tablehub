import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export interface AuthUser {
  id: string
  username: string
}

type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'error'
interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  error: string
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        const result = await response.json() as { user?: AuthUser | null; error?: string }
        if (!response.ok) throw new Error(result.error || '登录服务暂时不可用')
        if (active) {
          setUser(result.user ?? null)
          setStatus(result.user ? 'signedIn' : 'signedOut')
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '登录服务暂时不可用')
          setStatus('error')
        }
      })
    return () => { active = false }
  }, [])

  const authenticate = useCallback(async (mode: 'login' | 'register', username: string, password: string) => {
    setError('')
    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const result = await response.json() as { user?: AuthUser; error?: string }
    if (!response.ok || !result.user) throw new Error(result.error || '操作失败，请重试')
    setUser(result.user)
    setStatus('signedIn')
  }, [])

  const login = useCallback((username: string, password: string) => authenticate('login', username, password), [authenticate])
  const register = useCallback((username: string, password: string) => authenticate('register', username, password), [authenticate])
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      setUser(null)
      setStatus('signedOut')
    }
  }, [])

  return <AuthContext.Provider value={{ user, status, error, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
