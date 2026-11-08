import {
  Download,
  Eye,
  FileSpreadsheet,
  FolderInput,
  Link2,
  MoreHorizontal,
  Pencil,
  Share2,
  Star,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Dropdown, MenuDivider, MenuItem } from '@/components/ui/Dropdown'
import { Badge, StatusPill } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileIcon } from './FileIcon'
import { useApp } from '@/store/AppStore'
import { cn, download, highlight, kindLabel, relativeTime, formatSize } from '@/lib/utils'
import type { HubFile } from '@/types'

function HighlightedName({ name, query }: { name: string; query: string }) {
  const parts = highlight(name, query.replace(/\s+/g, ''))
  return (
    <span className="truncate">
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-amber-100 px-0.5 text-amber-800">
            {p.t}
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </span>
  )
}

/** 行内「更多」菜单（查看 / 分享 / 收藏 / 重命名 / 删除） */
export function FileMoreMenu({ file, onRename }: { file: HubFile; onRename?: () => void }) {
  const { toggleStar, removeFile, confirm, toast, checkVersion, markOpened } = useApp()
  const navigate = useNavigate()

  return (
    <Dropdown
      trigger={() => (
        <button
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="更多操作"
        >
          <MoreHorizontal size={16} />
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuItem
            icon={<Eye size={15} />}
            onClick={() => {
              close()
              markOpened(file.id)
              navigate(`/file/${file.id}`)
            }}
          >
            查看详情
          </MenuItem>
          <MenuItem
            icon={<Share2 size={15} />}
            onClick={() => {
              close()
              checkVersion(file)
            }}
          >
            分享（AI 版本检查）
          </MenuItem>
          <MenuItem
            icon={<Star size={15} />}
            onClick={() => {
              close()
              toggleStar(file.id)
            }}
          >
            {file.starred ? '取消收藏' : '加入收藏'}
          </MenuItem>
          <MenuItem
            icon={<Link2 size={15} />}
            onClick={() => {
              close()
              toast('已复制文件链接（演示）', 'info')
            }}
          >
            复制链接
          </MenuItem>
          {onRename ? (
            <MenuItem
              icon={<Pencil size={15} />}
              onClick={() => {
                close()
                onRename()
              }}
            >
              重命名
            </MenuItem>
          ) : null}
          <MenuDivider />
          <MenuItem
            icon={<Trash2 size={15} />}
            danger
            onClick={async () => {
              close()
              const ok = await confirm({
                title: '确定要删除这个文件吗？',
                description: `「${file.name}」会被移到回收站，之后可以随时恢复。`,
                confirmText: '删除',
                cancelText: '取消',
              })
              if (ok) removeFile(file.id)
            }}
          >
            删除
          </MenuItem>
        </>
      )}
    </Dropdown>
  )
}

/** 操作列：查看 / 搜索 / 下载 / 更多 */
function RowActions({ file }: { file: HubFile }) {
  const navigate = useNavigate()
  const { markOpened, toast, checkVersion } = useApp()
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        onClick={() => {
          markOpened(file.id)
          navigate(`/file/${file.id}`)
        }}
        className="rounded-lg px-2 py-1 text-[12.5px] font-medium text-brand-600 transition-colors hover:bg-brand-50"
      >
        查看
      </button>
      <button
        onClick={() => navigate(`/search?q=${encodeURIComponent(file.name.replace(/\.[^.]+$/, ''))}`)}
        className="rounded-lg px-2 py-1 text-[12.5px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        搜索
      </button>
      <button
        onClick={() => {
          download(file.name)
          toast('已开始下载（演示文件）', 'success')
        }}
        className="rounded-lg px-2 py-1 text-[12.5px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        下载
      </button>
      <Dropdown
        trigger={() => (
          <button
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="更多"
          >
            <MoreHorizontal size={15} />
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem
              icon={<Share2 size={15} />}
              onClick={() => {
                close()
                checkVersion(file)
              }}
            >
              分享（AI 版本检查）
            </MenuItem>
            <MenuItem
              icon={<FolderInput size={15} />}
              onClick={() => {
                close()
                toast('已移动到「客户方案」文件夹', 'success')
              }}
            >
              移动到文件夹
            </MenuItem>
            <MenuItem
              icon={<Download size={15} />}
              onClick={() => {
                close()
                download(file.name)
              }}
            >
              下载副本
            </MenuItem>
          </>
        )}
      </Dropdown>
    </div>
  )
}

/** 列表型文件表格（最近使用 / 搜索结果） */
export function FileTable({
  files,
  query = '',
  showClient = true,
  compact,
  emptyAction,
}: {
  files: HubFile[]
  query?: string
  showClient?: boolean
  compact?: boolean
  emptyAction?: React.ReactNode
}) {
  const { toggleStar } = useApp()
  const navigate = useNavigate()

  if (files.length === 0) {
    return (
      <EmptyState
        icon={<FileSpreadsheet size={22} />}
        title="还没有表格"
        description="上传你的第一个表格，让表格汇帮你整理。"
        action={emptyAction}
        compact={compact}
      />
    )
  }

  return (
    <>
      {/* 桌面端表格 */}
      <div className="hidden overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-card md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                名称
              </th>
              <th className="w-24 px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                类型
              </th>
              {showClient ? (
                <th className="w-32 px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                  所属客户
                </th>
              ) : null}
              <th className="w-28 px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                更新时间
              </th>
              <th className="w-[210px] px-4 py-2.5 text-right text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {files.map((f) => (
              <tr
                key={f.id}
                className="group cursor-pointer transition-colors hover:bg-slate-50/70"
                onClick={() => navigate(`/file/${f.id}`)}
              >
                <td className="max-w-0 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileIcon kind={f.kind} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleStar(f.id)
                          }}
                          className={cn(
                            'shrink-0 rounded-md p-0.5 transition-colors',
                            f.starred
                              ? 'text-amber-400'
                              : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-400',
                          )}
                          aria-label={f.starred ? '取消收藏' : '收藏'}
                        >
                          <Star size={14} fill={f.starred ? 'currentColor' : 'none'} />
                        </button>
                        <p className="min-w-0 truncate text-[13.5px] font-medium text-slate-800">
                          <HighlightedName name={f.name} query={query} />
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-2 pl-[22px]">
                        <span className="text-[11.5px] text-slate-400">{formatSize(f.sizeMB)}</span>
                        {f.tags.slice(0, 2).map((t) => (
                          <Badge key={t} tone="slate">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[12.5px] font-medium text-slate-500">
                    {kindLabel(f.kind)}
                  </span>
                </td>
                {showClient ? (
                  <td className="px-3 py-3">
                    <span className="text-[12.5px] text-slate-600">{f.client}</span>
                  </td>
                ) : null}
                <td className="px-3 py-3">
                  <span className="text-[12.5px] text-slate-500">{relativeTime(f.updatedAt)}</span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <RowActions file={f} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端卡片列表 */}
      <ul className="space-y-2.5 md:hidden">
        {files.map((f) => (
          <li key={f.id}>
            <button
              onClick={() => navigate(`/file/${f.id}`)}
              className="flex w-full items-start gap-3 rounded-2xl bg-white p-3.5 text-left ring-1 ring-slate-200/80 shadow-card"
            >
              <FileIcon kind={f.kind} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-slate-800">{f.name}</p>
                <p className="mt-1 text-[11.5px] text-slate-400">
                  {kindLabel(f.kind)} · {f.client} · {relativeTime(f.updatedAt)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusPill status={f.status} />
                  {f.tags.slice(0, 2).map((t) => (
                    <Badge key={t} tone="slate">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStar(f.id)
                }}
                className={cn('shrink-0 p-1', f.starred ? 'text-amber-400' : 'text-slate-300')}
              >
                <Star size={15} fill={f.starred ? 'currentColor' : 'none'} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
