import { ArrowRight, CornerDownLeft, Sparkles, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileIcon } from '@/components/files/FileIcon'
import { REIMBURSEMENTS } from '@/data/demo'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { AIDots } from '@/components/ui/Loading'
import { useApp } from '@/store/AppStore'
import { aiRespond } from '@/lib/search'
import { cn, formatTime, uid } from '@/lib/utils'
import type { ChatMessage } from '@/types'
import { useAuth } from '@/auth/AuthProvider'

function renderBold(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-slate-900">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function RichText({ text }: { text: string }) {
  return (
    <div>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        const isItem = /^([·•]|\d+\.)\s/.test(line)
        return (
          <p
            key={i}
            className={cn(
              'text-[13.5px] leading-relaxed text-slate-700',
              isItem && 'pl-1.5',
            )}
          >
            {renderBold(line)}
          </p>
        )
      })}
    </div>
  )
}

function FileChip({ id, onOpened }: { id: string; onOpened: (id: string) => void }) {
  const { files } = useApp()
  const file = files.find((f) => f.id === id)
  if (!file) return null
  return (
    <button
      onClick={() => onOpened(file.id)}
      className="group flex w-full items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-left ring-1 ring-slate-200/70 transition-all hover:bg-white hover:ring-brand-200"
    >
      <FileIcon kind={file.kind} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-slate-700">{file.name}</span>
        <span className="block truncate text-[11px] text-slate-400">
          {file.client} · 更新于 {new Date(file.updatedAt).toLocaleDateString('zh-CN')}
        </span>
      </span>
      <ArrowRight size={13} className="shrink-0 text-slate-300 group-hover:text-brand-500" />
    </button>
  )
}

const GREETING: ChatMessage = {
  id: 'm-welcome',
  role: 'ai',
  text: '你好，我是表格汇 AI 👋\n\n我会帮你快速找到、整理和分析表格。试试问我：\n· 帮我找星河科技最近的报价表\n· 哪些客户最近没有更新方案？\n· 本月员工报销一共多少钱？',
  time: '',
}

export function AIChat({
  className,
  heightClass = 'h-[calc(100vh-330px)] min-h-[440px]',
  initialQuestion,
}: {
  className?: string
  heightClass?: string
  initialQuestion?: string
}) {
  const { user } = useAuth()
  const { liveFiles, files, markOpened, toast } = useApp()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([
    '帮我找星河科技最近的报价表',
    '哪些客户最近没有更新方案？',
    '有没有发错版本的风险？',
  ])
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoSent = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, thinking])

  // 支持从其它页面带问题跳转过来（/ai?q=...）
  useEffect(() => {
    if (!initialQuestion || autoSent.current) return
    autoSent.current = true
    send(initialQuestion)
  }, [initialQuestion])

  function openFile(id: string) {
    if (!id) return
    markOpened(id)
    navigate(`/file/${id}`)
  }

  async function send(raw?: string) {
    const text = (raw ?? input).trim()
    if (!text || thinking) return
    setInput('')

    const pendingId = uid('m')
    setMessages((prev) => [
      ...prev,
      { id: uid('m'), role: 'user', text, time: formatTime(new Date().toISOString()) },
      { id: pendingId, role: 'ai', text: '', pending: true, time: '' },
    ])
    setThinking(true)

    const localReply = aiRespond(text, liveFiles)
    try {
      const response = await fetch('/api/deepseek/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          context: {
            files: liveFiles.map((file) => ({
              name: file.name,
              category: file.category,
              client: file.client,
              owner: file.owner,
              updatedAt: file.updatedAt,
              summary: file.aiSummary.intro,
            })),
            reimbursements: REIMBURSEMENTS,
          },
        }),
      })
      const result = await response.json() as { answer?: string; error?: string }
      if (!response.ok) throw new Error(result.error || 'DeepSeek 请求失败')

      setMessages((prev) => prev.map((m) => m.id === pendingId
        ? {
            id: pendingId,
            role: 'ai',
            text: result.answer?.trim() || localReply.text,
            files: localReply.fileIds,
            actions: localReply.actions,
            time: formatTime(new Date().toISOString()),
          }
        : m))
      setSuggestions(localReply.suggestions)
    } catch (error) {
      const reason = error instanceof Error ? error.message : '连接失败'
      const missingKey = reason.includes('API Key')
      setMessages((prev) => prev.map((m) => m.id === pendingId
        ? {
            id: pendingId,
            role: 'ai',
            text: `${missingKey ? 'DeepSeek 尚未配置，当前显示本地演示回答。' : `DeepSeek 暂时连接失败（${reason}），当前显示本地演示回答。`}\n\n${localReply.text}`,
            files: localReply.fileIds,
            actions: localReply.actions,
            time: formatTime(new Date().toISOString()),
          }
        : m))
      setSuggestions(localReply.suggestions)
    } finally {
      setThinking(false)
    }
  }

  const canSend = useMemo(() => input.trim().length > 0 && !thinking, [input, thinking])

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-card',
        className,
      )}
    >
      {/* 消息区 */}
      <div ref={scrollRef} className={cn('flex-1 space-y-5 overflow-y-auto p-5', heightClass)}>
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex items-start justify-end gap-2.5">
              <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-brand-600 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white shadow-[0_2px_10px_-4px_rgba(79,70,229,0.6)]">
                {m.text}
              </div>
              <Avatar name={user?.username ?? '用户'} size={30} />
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2.5">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orch-500 text-white">
                <Sparkles size={15} />
              </span>
              <div className="min-w-0 max-w-[86%] flex-1">
                <div className="rounded-2xl rounded-tl-md bg-slate-50/90 p-3.5 ring-1 ring-slate-200/70">
                  {m.pending ? (
                    <div className="flex items-center gap-2.5 py-0.5">
                      <AIDots className="text-brand-500" />
                      <span className="text-[13px] text-slate-400">AI 正在检索表格汇…</span>
                    </div>
                  ) : (
                    <RichText text={m.text} />
                  )}

                  {m.files && m.files.length ? (
                    <div className="mt-3 space-y-1.5">
                      {m.files.map((id) => (
                        <FileChip key={id} id={id} onOpened={openFile} />
                      ))}
                    </div>
                  ) : null}

                  {m.actions && m.actions.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.actions.map((a) => (
                        <Button
                          key={a.label}
                          size="sm"
                          variant={a.kind === 'open' ? 'ai' : 'secondary'}
                          onClick={() => {
                            if (a.kind === 'open') {
                              if (a.payload) openFile(a.payload)
                              else toast('没有可打开的文件', 'info')
                            } else if (a.payload) {
                              navigate(a.payload)
                            }
                          }}
                        >
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {m.time ? (
                  <p className="mt-1.5 pl-1 text-[11px] text-slate-300">{m.time}</p>
                ) : null}
              </div>
            </div>
          ),
        )}
      </div>

      {/* 建议问题 */}
      {suggestions.length && !thinking ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-slate-100 px-5 py-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 rounded-xl bg-slate-50 px-3 py-1.5 text-[12.5px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {/* 输入区 */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-end gap-2 rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-200 transition-all focus-within:bg-white focus-within:ring-brand-500/50">
          <textarea
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="问我任何关于表格和方案的问题，例如：帮我找星河科技最近的报价表"
            className="max-h-28 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <Button
            variant="ai"
            size="sm"
            disabled={!canSend}
            onClick={() => send()}
            icon={<CornerDownLeft size={14} />}
          >
            发送
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 pl-1 text-[11.5px] text-slate-400">
          <User size={11} />
          DeepSeek AI · 会将问题及所需的演示数据发送至 DeepSeek（当前 {liveFiles.length} 个文件）
        </p>
      </div>
    </div>
  )
}
