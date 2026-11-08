import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_FILE_IDS, FILES } from '@/data/demo'
import { usePersistentState } from '@/lib/hooks'
import { uid } from '@/lib/utils'
import type { HubFile, OrganizedFileMetadata, ToastItem } from '@/types'
import { ConfirmDialog, type ConfirmOptions } from '@/components/ui/ConfirmDialog'
import { ToastViewport } from '@/components/ui/Toast'
import { VersionCheckDialog } from '@/components/ai/VersionCheckDialog'

interface AppContextValue {
  /** 全部文件（含已删除标记） */
  files: HubFile[]
  /** 未删除文件 */
  liveFiles: HubFile[]
  recents: HubFile[]
  starredFiles: HubFile[]
  trashedFiles: HubFile[]
  searchCount: number
  registerSearch: () => void
  toggleStar: (id: string) => void
  markOpened: (id: string) => void
  removeFile: (id: string) => void
  restoreFile: (id: string) => void
  purgeFile: (id: string) => void
  addFiles: (files: HubFile[]) => void
  updateFilesMetadata: (updates: Array<{ id: string; metadata: OrganizedFileMetadata }>) => void
  toast: (text: string, tone?: ToastItem['tone']) => void
  toasts: ToastItem[]
  dismissToast: (id: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** 分享前的 AI 版本检查（防止发错方案） */
  checkVersion: (file: HubFile) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const DEFAULT_RECENTS = [
  'f-xh-annual-plan',
  'f-reimb-summary',
  'f-abc-research',
  'f-2026-plan-summary',
  'f-new-staff',
]

export function AppProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const storagePrefix = `tablehub.user.${userId}`
  const [uploaded, setUploaded] = usePersistentState<HubFile[]>(`${storagePrefix}.uploaded.v1`, [])
  const [organizedMetadata, setOrganizedMetadata] = usePersistentState<Record<string, OrganizedFileMetadata>>(
    `${storagePrefix}.organized-metadata.v1`,
    {},
  )
  const [starred, setStarred] = usePersistentState<string[]>(
    `${storagePrefix}.starred.v1`,
    FILES.filter((f) => f.starred).map((f) => f.id),
  )
  const [deleted, setDeleted] = usePersistentState<Array<{ id: string; at: string }>>(
    `${storagePrefix}.deleted.v1`,
    [],
  )
  const [recents, setRecents] = usePersistentState<string[]>(`${storagePrefix}.recents.v1`, DEFAULT_RECENTS)
  useEffect(() => {
    const migrationKey = 'tablehub.migrations.all-team-files-purged.v1'
    try {
      if (localStorage.getItem(migrationKey)) return
      const removedFileIds = new Set([
        ...DEMO_FILE_IDS,
        ...uploaded.map((file) => file.id),
      ])
      setUploaded([])
      setDeleted((current) => current.filter((item) => !removedFileIds.has(item.id)))
      setStarred((current) => current.filter((id) => !removedFileIds.has(id)))
      setRecents((current) => current.filter((id) => !removedFileIds.has(id)))
      localStorage.setItem(migrationKey, 'done')
    } catch {
      /* ignore unavailable storage */
    }
  }, [setDeleted, setRecents, setStarred, setUploaded, uploaded])
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [searchCount, setSearchCount] = useState(0)

  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)
  const confirmResolver = useRef<((v: boolean) => void) | null>(null)
  const [versionTarget, setVersionTarget] = useState<HubFile | null>(null)

  const files = useMemo<HubFile[]>(() => {
    const delMap = new Map(deleted.map((d) => [d.id, d.at]))
    return [...FILES, ...uploaded].map((f) => {
      const at = delMap.get(f.id)
      return {
        ...f,
        ...organizedMetadata[f.id],
        starred: starred.includes(f.id),
        deleted: Boolean(at),
        deletedAt: at,
      }
    })
  }, [uploaded, starred, deleted, organizedMetadata])

  const liveFiles = useMemo(() => files.filter((f) => !f.deleted), [files])
  const trashedFiles = useMemo(
    () =>
      files
        .filter((f) => f.deleted)
        .sort((a, b) => +new Date(b.deletedAt ?? 0) - +new Date(a.deletedAt ?? 0)),
    [files],
  )
  const starredFiles = useMemo(() => liveFiles.filter((f) => f.starred), [liveFiles])
  const recentFiles = useMemo(
    () =>
      recents
        .map((id) => files.find((f) => f.id === id))
        .filter((f): f is HubFile => Boolean(f) && !f!.deleted),
    [recents, files],
  )

  const toast = useCallback((text: string, tone: ToastItem['tone'] = 'success') => {
    const item: ToastItem = { id: uid('t'), text, tone }
    setToasts((prev) => [...prev, item])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== item.id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleStar = useCallback(
    (id: string) => {
      setStarred((prev) => {
        const has = prev.includes(id)
        toast(has ? '已取消收藏' : '已加入我的收藏', has ? 'info' : 'success')
        return has ? prev.filter((x) => x !== id) : [...prev, id]
      })
    },
    [setStarred, toast],
  )

  const markOpened = useCallback(
    (id: string) => {
      setRecents((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 12))
    },
    [setRecents],
  )

  const removeFile = useCallback(
    (id: string) => {
      setDeleted((prev) => [...prev.filter((d) => d.id !== id), { id, at: new Date().toISOString() }])
      toast('已移入回收站，可随时恢复', 'info')
    },
    [setDeleted, toast],
  )

  const restoreFile = useCallback(
    (id: string) => {
      setDeleted((prev) => prev.filter((d) => d.id !== id))
      toast('文件已恢复')
    },
    [setDeleted, toast],
  )

  const purgeFile = useCallback(
    (id: string) => {
      setUploaded((prev) => prev.filter((f) => f.id !== id))
      setDeleted((prev) => prev.filter((d) => d.id !== id))
      setStarred((prev) => prev.filter((s) => s !== id))
      toast('已彻底删除', 'warn')
    },
    [setUploaded, setDeleted, setStarred, toast],
  )

  const addFiles = useCallback(
    (newFiles: HubFile[]) => {
      setUploaded((prev) => {
        const next = [...prev]
        for (const incoming of newFiles) {
          const existingIndex = incoming.contentHash
            ? next.findIndex((file) => file.contentHash === incoming.contentHash)
            : -1
          if (existingIndex < 0) {
            next.unshift(incoming)
            continue
          }
          const existing = next[existingIndex]
          next[existingIndex] = {
            ...existing,
            tags: [...new Set([...existing.tags, ...incoming.tags])],
            keywords: [...new Set([...existing.keywords, ...incoming.keywords])],
            sizeMB: existing.sizeMB || incoming.sizeMB,
          }
        }
        return next
      })
    },
    [setUploaded],
  )

  const updateFilesMetadata = useCallback((updates: Array<{ id: string; metadata: OrganizedFileMetadata }>) => {
    setOrganizedMetadata((current) => ({
      ...current,
      ...Object.fromEntries(updates.map(({ id, metadata }) => [id, metadata])),
    }))
  }, [setOrganizedMetadata])

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options)
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve
    })
  }, [])

  const closeConfirm = useCallback((result: boolean) => {
    setConfirmState(null)
    confirmResolver.current?.(result)
    confirmResolver.current = null
  }, [])

  const value: AppContextValue = {
    files,
    liveFiles,
    recents: recentFiles,
    starredFiles,
    trashedFiles,
    searchCount,
    registerSearch: () => setSearchCount((c) => c + 1),
    toggleStar,
    markOpened,
    removeFile,
    restoreFile,
    purgeFile,
    addFiles,
    updateFilesMetadata,
    toast,
    toasts,
    dismissToast,
    confirm,
    checkVersion: (file: HubFile) => setVersionTarget(file),
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog
        open={Boolean(confirmState)}
        options={confirmState}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />
      <VersionCheckDialog file={versionTarget} onClose={() => setVersionTarget(null)} />
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用')
  return ctx
}
