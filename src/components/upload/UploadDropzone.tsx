import { FileSpreadsheet, FileText, Presentation, Sparkles, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface PickedFile {
  name: string
  sizeMB: number
  file?: File
}

const ACCEPT = '.xlsx,.xls,.csv,.pdf,.ppt,.pptx,.doc,.docx'

/** 表格汇集器的拖拽上传区 */
export function UploadDropzone({
  onFiles,
  onDemo,
  className,
  busy,
}: {
  onFiles: (files: PickedFile[]) => void
  onDemo?: () => void
  className?: string
  busy?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handle(list: FileList | null) {
    if (!list || list.length === 0) return
    const picked: PickedFile[] = Array.from(list).map((f) => ({
      name: f.name,
      sizeMB: Number((f.size / 1024 / 1024).toFixed(3)),
      file: f,
    }))
    onFiles(picked)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (busy) return
        handle(e.dataTransfer.files)
      }}
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 sm:p-10',
        dragging
          ? 'border-brand-400 bg-brand-50/70 ring-4 ring-brand-100'
          : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/30',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-brand-100/50 to-transparent blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-orch-600 text-white shadow-glow transition-transform',
            dragging && 'scale-110',
          )}
        >
          <UploadCloud size={24} />
        </span>

        <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-slate-900">
          拖拽文件到这里
        </h3>
        <p className="mt-1 text-[13px] text-slate-500">
          支持 Excel、CSV、XLSX、PDF、PPT，可以一次拖入多个文件
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="primary"
            size="lg"
            icon={<span className="text-[17px] leading-none">＋</span>}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            上传表格
          </Button>
          {onDemo ? (
            <Button
              variant="outline"
              size="lg"
              icon={<Sparkles size={15} />}
              disabled={busy}
              onClick={onDemo}
            >
              体验 Demo 上传
            </Button>
          ) : null}
        </div>

        <p className="mt-4 max-w-md text-[12.5px] leading-relaxed text-slate-400">
          支持批量上传，系统会自动识别文件名称、类型、客户和关键词。
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[12px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <FileSpreadsheet size={13} className="text-emerald-500" />
            Excel / CSV
          </span>
          <span className="flex items-center gap-1.5">
            <Presentation size={13} className="text-orange-500" />
            PPT
          </span>
          <span className="flex items-center gap-1.5">
            <FileText size={13} className="text-rose-500" />
            PDF / Word
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        disabled={busy}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
