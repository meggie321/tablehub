import { Clock, MoreHorizontal, Share2, Star, Trash2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StatusPill, Badge } from '@/components/ui/Badge'
import { Dropdown, MenuItem, MenuDivider } from '@/components/ui/Dropdown'
import { FileIcon } from './FileIcon'
import { useApp } from '@/store/AppStore'
import { cn, formatSize, kindLabel, relativeTime } from '@/lib/utils'
import type { HubFile } from '@/types'

/** 卡片型文件（方案中心 / PPT 中心） */
export function FileCard({ file }: { file: HubFile }) {
  const navigate = useNavigate()
  const { toggleStar, markOpened, checkVersion, removeFile, confirm, toast } = useApp()

  return (
    <div
      className="group relative flex cursor-pointer flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:ring-slate-300/70"
      onClick={() => {
        markOpened(file.id)
        navigate(`/file/${file.id}`)
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <FileIcon kind={file.kind} filled size="lg" />
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleStar(file.id)}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              file.starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400',
            )}
            aria-label={file.starred ? '取消收藏' : '收藏'}
          >
            <Star size={15} fill={file.starred ? 'currentColor' : 'none'} />
          </button>
          <Dropdown
            trigger={() => (
              <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <MoreHorizontal size={16} />
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
                  分享（版本检查）
                </MenuItem>
                <MenuItem
                  icon={<Clock size={15} />}
                  onClick={() => {
                    close()
                    toast('已创建新版本草稿（演示）', 'info')
                  }}
                >
                  创建新版本
                </MenuItem>
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
        </div>
      </div>

      <h3 className="mt-3.5 line-clamp-2 text-[14.5px] font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
        {file.name}
      </h3>

      <div className="mt-2.5 flex items-center gap-3 text-[12px] text-slate-400">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {file.client}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {relativeTime(file.updatedAt)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusPill status={file.status} />
        {file.version ? <Badge tone="brand">{file.version}</Badge> : null}
        {file.tags.slice(0, 1).map((t) => (
          <Badge key={t} tone="slate">
            {t}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <span className="text-[11.5px] text-slate-400">
          {kindLabel(file.kind)} · {formatSize(file.sizeMB)}
        </span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[12.5px] font-medium text-slate-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
          查看
        </span>
      </div>
    </div>
  )
}
