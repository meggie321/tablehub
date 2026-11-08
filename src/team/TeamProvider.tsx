import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import type { TeamModuleKey } from './modules'

export interface TeamMember {
  userId: string
  username: string
  role: 'owner' | 'employee'
  permissions: Record<TeamModuleKey, boolean>
}

export interface TeamState {
  membership: { teamId: string; roomCode: string; role: 'owner' | 'employee' } | null
  permissions: Record<TeamModuleKey, boolean>
  members: TeamMember[]
}

interface TeamContextValue extends TeamState {
  loading: boolean
  error: string
  refresh: () => Promise<void>
  createTeam: () => Promise<TeamState>
  setEmployeeRole: () => Promise<void>
  joinTeam: (roomCode: string) => Promise<void>
  removeMember: (userId: string) => Promise<void>
  setPermission: (userId: string, module: TeamModuleKey, allowed: boolean) => Promise<void>
}

const ALL_ALLOWED = {
  dashboard: true, search: true, favorites: true, collector: true, ppt: true,
  ai: true, organize: true, reimbursement: true, trash: true, files: true,
} as const

const TeamContext = createContext<TeamContextValue | null>(null)

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<TeamState>({ membership: null, permissions: ALL_ALLOWED, members: [] })
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!user) {
      setData({ membership: null, permissions: ALL_ALLOWED, members: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/team', { credentials: 'include' })
      const result = await response.json() as TeamState & { error?: string }
      if (!response.ok) throw new Error(result.error || '读取团队信息失败')
      setData({ membership: result.membership ?? null, permissions: result.permissions ?? ALL_ALLOWED, members: result.members ?? [] })
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '团队服务暂时不可用')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  const post = useCallback(async (body: Record<string, unknown>): Promise<TeamState> => {
    const response = await fetch('/api/team', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const result = await response.json() as TeamState & { error?: string }
    if (!response.ok) throw new Error(result.error || '团队操作失败')
    const next = { membership: result.membership ?? null, permissions: result.permissions ?? ALL_ALLOWED, members: result.members ?? [] }
    setData(next)
    setError('')
    return next
  }, [])

  const createTeam = useCallback(() => post({ action: 'boss' }), [post])
  const setEmployeeRole = useCallback(async () => { await post({ action: 'employee' }) }, [post])
  const joinTeam = useCallback(async (roomCode: string) => { await post({ action: 'join', roomCode }) }, [post])
  const removeMember = useCallback(async (userId: string) => { await post({ action: 'removeMember', userId }) }, [post])
  const setPermission = useCallback(async (userId: string, module: TeamModuleKey, allowed: boolean) => {
    const response = await fetch('/api/team', {
      method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, module, allowed }),
    })
    const result = await response.json() as TeamState & { error?: string }
    if (!response.ok) throw new Error(result.error || '权限保存失败')
    setData({ membership: result.membership ?? null, permissions: result.permissions ?? ALL_ALLOWED, members: result.members ?? [] })
  }, [])

  const value = useMemo(() => ({ ...data, loading, error, refresh, createTeam, setEmployeeRole, joinTeam, removeMember, setPermission }), [data, loading, error, refresh, createTeam, setEmployeeRole, joinTeam, removeMember, setPermission])
  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam(): TeamContextValue {
  const context = useContext(TeamContext)
  if (!context) throw new Error('useTeam must be used inside TeamProvider')
  return context
}
