import { RotateCcw, Trash, Trash2 } from 'lucide-react'
import { FileIcon } from '@/components/files/FileIcon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageShell } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApp } from '@/store/AppStore'
import { formatSize, kindLabel, relativeTime } from '@/lib/utils'

export default function TrashPage() {
  const { trashedFiles, restoreFile, purgeFile, confirm } = useApp()

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200/80 shadow-card">
            <Trash2 size={20} />
          </span>
          <div>
            <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">回收站</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">
              删除的文件会先放在这里，确认不需要后再彻底删除。
            </p>
          </div>
        </div>
        {trashedFiles.length ? (
          <Button
            variant="secondary"
            icon={<Trash size={15} />}
            className="text-rose-600 hover:bg-rose-50"
            onClick={async () => {
              const ok = await confirm({
                title: '确定要清空回收站吗？',
                description: `回收站里的 ${trashedFiles.length} 个文件将被彻底删除，此操作无法撤销。`,
                confirmText: '清空回收站',
              })
              if (ok) trashedFiles.forEach((f) => purgeFile(f.id))
            }}
          >
            清空回收站
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        {trashedFiles.length === 0 ? (
          <EmptyState
            icon={<Trash2 size={22} />}
            title="回收站是空的"
            description="被删除的文件会出现在这里，可以随时恢复。"
          />
        ) : (
          <Card padded={false}>
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-[15px] font-semibold text-slate-900">
                已删除 {trashedFiles.length} 个文件
              </h3>
              <p className="mt-0.5 text-[12.5px] text-slate-500">
                演示环境中会保留在本地浏览器，刷新后依然存在
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {trashedFiles.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60"
                >
                  <FileIcon kind={f.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-slate-800">{f.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-slate-400">
                      {kindLabel(f.kind)} · {f.client} · {formatSize(f.sizeMB)} · 删除于{' '}
                      {f.deletedAt ? relativeTime(f.deletedAt) : '刚刚'}
                    </p>
                  </div>
                  <Badge tone="slate">{f.category}</Badge>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<RotateCcw size={13} />}
                      onClick={() => restoreFile(f.id)}
                    >
                      恢复
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:bg-rose-50"
                      icon={<Trash2 size={13} />}
                      onClick={async () => {
                        const ok = await confirm({
                          title: '确定要彻底删除吗？',
                          description: `「${f.name}」将被永久删除，无法恢复。`,
                          confirmText: '彻底删除',
                        })
                        if (ok) purgeFile(f.id)
                      }}
                    >
                      彻底删除
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </PageShell>
  )
}
