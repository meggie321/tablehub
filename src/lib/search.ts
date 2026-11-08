import {
  CLIENTS,
  EMPLOYEES,
  REIMBURSEMENT_SUMMARY,
  REIMBURSEMENTS,
} from '@/data/demo'
import type { ChatAction, HubFile, SearchFilters, SearchHit } from '@/types'
import { formatMoney, relativeTime, smartDateTime } from './utils'

/* ------------------------------------------------------------------ *
 * 查询归一化
 * ------------------------------------------------------------------ */

const STOP_WORDS = [
  '帮我', '帮忙', '请', '麻烦', '找到', '查找', '查一下', '查下', '查询', '查', '搜索', '搜一下', '搜',
  '一下', '最近', '最新', '有没有', '有哪些', '哪些', '我想', '我要', '想要', '看看', '看下', '关于',
  '相关', '的文件', '的文件', '文件', '们', '我', '给', '和', '与', '在', '是', '吗', '呢', '啊',
  '？', '?', '，', ',', '。', '.', '、', '：', ':', '！', '!',
]

export function normalizeQuery(q: string): string {
  let s = ` ${q.trim().toLowerCase()} `
  STOP_WORDS.forEach((w) => {
    s = s.split(w).join(' ')
  })
  return s.replace(/\s+/g, ' ').trim()
}

/* ------------------------------------------------------------------ *
 * 相关度打分
 * ------------------------------------------------------------------ */

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3600000
}

function scoreFile(file: HubFile, query: string, terms: string[]): { score: number; reasons: string[] } {
  const name = file.name.toLowerCase()
  const reasons: string[] = []
  let score = 0

  if (query) {
    if (name === `${query}.xlsx` || name === query) {
      score += 200
      reasons.push('文件名完全匹配')
    } else if (name.includes(query)) {
      score += 120
      reasons.push('文件名匹配')
    }
  }

  for (const term of terms) {
    if (!term) continue
    if (name.includes(term)) {
      score += 45
      reasons.push(`名称包含「${term}」`)
    } else if (file.client.toLowerCase().includes(term)) {
      score += 40
      reasons.push(`客户：${file.client}`)
    } else if (file.tags.some((t) => t.toLowerCase().includes(term))) {
      score += 28
      reasons.push(`标签：${file.tags.find((t) => t.toLowerCase().includes(term))}`)
    } else if (file.category.toLowerCase().includes(term)) {
      score += 24
      reasons.push(`分类：${file.category}`)
    } else if (file.keywords.some((k) => k.toLowerCase().includes(term))) {
      score += 20
      reasons.push(`关键词命中「${term}」`)
    } else if (file.aiSummary.bullets.some((b) => b.toLowerCase().includes(term))) {
      score += 10
      reasons.push('内容匹配')
    } else if (file.owner.toLowerCase().includes(term)) {
      score += 18
      reasons.push(`创建人：${file.owner}`)
    }
  }

  if (score > 0) {
    const h = hoursSince(file.updatedAt)
    if (h <= 24) {
      score += 18
      reasons.push('今天更新')
    } else if (h <= 24 * 7) {
      score += 10
    } else if (h <= 24 * 30) {
      score += 4
    }
    if (file.starred) score += 4
    if (file.kind === 'doc' || file.kind === 'ppt') score += 2
  }

  return { score, reasons: Array.from(new Set(reasons)).slice(0, 3) }
}

/* ------------------------------------------------------------------ *
 * 主搜索
 * ------------------------------------------------------------------ */

export function searchFiles(
  files: HubFile[],
  rawQuery: string,
  filters?: Partial<SearchFilters>,
): SearchHit[] {
  const query = normalizeQuery(rawQuery)
  const terms = query.split(' ').filter(Boolean)

  let list = files.filter((f) => !f.deleted)

  if (filters?.kind && filters.kind !== 'all') list = list.filter((f) => f.kind === filters.kind)
  if (filters?.client) list = list.filter((f) => f.client === filters.client)
  if (filters?.tags?.length) {
    const tags = filters.tags
    list = list.filter((f) => tags.every((t) => f.tags.includes(t)))
  }
  if (filters?.starredOnly) list = list.filter((f) => f.starred)

  let hits: SearchHit[]
  if (!query) {
    hits = list.map((file) => ({ file, score: 1, reasons: [] }))
  } else {
    hits = []
    for (const file of list) {
      const { score, reasons } = scoreFile(file, query, terms)
      if (score > 0) hits.push({ file, score, reasons })
    }
  }

  const sort = filters?.sort ?? 'relevance'
  const byUpdated = (a: SearchHit, b: SearchHit) =>
    +new Date(b.file.updatedAt) - +new Date(a.file.updatedAt)

  if (sort === 'relevance') {
    hits.sort((a, b) => b.score - a.score || byUpdated(a, b))
  } else if (sort === 'updated') {
    hits.sort(byUpdated)
  } else if (sort === 'name') {
    hits.sort((a, b) => a.file.name.localeCompare(b.file.name, 'zh-Hans-CN'))
  } else {
    hits.sort((a, b) => b.file.sizeMB - a.file.sizeMB)
  }

  return hits
}

/* ------------------------------------------------------------------ *
 * 搜索建议
 * ------------------------------------------------------------------ */

export interface Suggestion {
  type: 'file' | 'client' | 'tag' | 'owner'
  label: string
  hint: string
}

export function suggest(files: HubFile[], rawQuery: string, limit = 7): Suggestion[] {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return []
  const out: Suggestion[] = []

  for (const c of CLIENTS) {
    if (c.name.toLowerCase().includes(q)) {
      out.push({ type: 'client', label: c.name, hint: `${c.industry} · 对接人 ${c.contact}` })
    }
  }
  for (const f of files) {
    if (f.deleted) continue
    if (f.name.toLowerCase().includes(q)) {
      out.push({ type: 'file', label: f.name, hint: `${f.client} · ${relativeTime(f.updatedAt)}` })
    }
    if (out.length > limit * 3) break
  }
  const tagSet = new Set(files.flatMap((f) => f.tags))
  for (const t of tagSet) {
    if (t.toLowerCase().includes(q)) out.push({ type: 'tag', label: t, hint: '标签' })
  }
  for (const e of EMPLOYEES) {
    if (e.name.toLowerCase().includes(q)) {
      out.push({ type: 'owner', label: e.name, hint: `${e.dept} · ${e.files} 个文件` })
    }
  }

  const order: Record<Suggestion['type'], number> = { client: 0, file: 1, tag: 2, owner: 3 }
  return out.sort((a, b) => order[a.type] - order[b.type]).slice(0, limit)
}

/** 客户 / 员工 维度的检索结果 */
export function searchEntities(files: HubFile[], rawQuery: string) {
  const q = normalizeQuery(rawQuery)
  if (!q) return { clients: [], employees: [] }
  const clients = CLIENTS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.contact.includes(rawQuery.trim()),
  ).map((c) => ({ ...c, count: files.filter((f) => f.client === c.name && !f.deleted).length }))

  const employees = EMPLOYEES.filter((e) => e.name.toLowerCase().includes(q) || e.dept.includes(rawQuery.trim()))

  return { clients, employees }
}

/* ------------------------------------------------------------------ *
 * AI 搜索总结
 * ------------------------------------------------------------------ */

export interface AIAnswer {
  text: string[]
  recommend?: HubFile
  actions: ChatAction[]
}

export function buildAISearchAnswer(rawQuery: string, hits: SearchHit[]): AIAnswer {
  const query = rawQuery.trim()
  if (hits.length === 0) {
    return {
      text: [
        `我在表格汇里没有找到与「${query}」直接相关的文件。`,
        '可以尝试输入客户名称、表格用途或文件里的关键词；如果是新的资料，上传后我会自动识别客户和分类。',
      ],
      actions: [
        { label: '去上传表格', kind: 'to', payload: '/collector' },
        { label: '返回首页', kind: 'to', payload: '/dashboard' },
      ],
    }
  }

  const sheets = hits.filter((h) => h.file.kind === 'sheet').length
  const docs = hits.filter((h) => h.file.kind === 'doc').length
  const ppts = hits.filter((h) => h.file.kind === 'ppt').length
  const pdfs = hits.filter((h) => h.file.kind === 'pdf').length

  const parts: string[] = []
  parts.push(`我找到了 ${hits.length} 个与「${query}」相关的文件。`)
  const breakdown = [
    sheets ? `表格 ${sheets} 个` : '',
    docs ? `方案 ${docs} 个` : '',
    ppts ? `PPT ${ppts} 个` : '',
    pdfs ? `PDF ${pdfs} 个` : '',
  ].filter(Boolean)
  if (breakdown.length) parts.push(`其中 ${breakdown.join('、')}。`)

  const top = hits.slice(0, 2)
  if (top.length >= 2) {
    parts.push(`其中最相关的是「${trimExt(top[0].file.name)}」和「${trimExt(top[1].file.name)}」。`)
  } else {
    parts.push(`最相关的是「${trimExt(top[0].file.name)}」。`)
  }

  // 推荐一份"可发送"的方案：优先方案/PPT，其次最新的表格
  const sendable =
    hits.find((h) => h.file.kind === 'doc' || h.file.kind === 'ppt')?.file ?? hits[0].file

  const isPlanQuery = /方案|提案|报价|合作|ppt|PPT/.test(rawQuery)
  parts.push(
    isPlanQuery
      ? '如果你要给客户发送合作方案，建议使用：'
      : '如果要马上继续处理，建议优先打开：',
  )

  return {
    text: parts,
    recommend: sendable,
    actions: [
      { label: '打开文件', kind: 'open', payload: sendable.id },
      { label: '查看全部结果', kind: 'to', payload: '/search' },
    ],
  }
}

function trimExt(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

/* ------------------------------------------------------------------ *
 * AI 助手对话（规则 + 数据推理）
 * ------------------------------------------------------------------ */

export interface AIReply {
  text: string
  fileIds: string[]
  actions: ChatAction[]
  suggestions: string[]
}

const DEFAULT_SUGGESTIONS = [
  '帮我找星河科技最近的报价表',
  '哪些客户最近没有更新方案？',
  '本月员工报销一共多少钱？',
  '有没有发错版本的风险？',
]

export function aiRespond(question: string, files: HubFile[]): AIReply {
  const q = question.trim()
  const lower = q.toLowerCase()
  const live = files.filter((f) => !f.deleted)

  if (/^(你好|您好|hi|hello|在吗)/i.test(q)) {
    return {
      text: `你好，我是表格汇 AI 👋\n\n我可以帮你：\n1. 用一句话找到某份表格或方案\n2. 分析哪些客户很久没更新\n3. 汇总员工报销数据\n4. 检查方案版本，避免发错文件`,
      fileIds: [],
      actions: [{ label: '去搜索', kind: 'to', payload: '/search' }],
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  /* —— 1. 客户活跃度分析 —— */
  if (/哪些客户|没有更新|未更新|没更新|多久没|不活跃|跟进/.test(q)) {
    const rows = CLIENTS.map((c) => {
      const own = live.filter((f) => f.client === c.name)
      const latest = own.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0]
      return { client: c, latest, count: own.length }
    })
      .filter((r) => r.latest)
      .sort((a, b) => +new Date(a.latest.updatedAt) - +new Date(b.latest.updatedAt))

    const lines = rows
      .slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.client.name} — 最近更新：${relativeTime(r.latest.updatedAt)}（${r.latest.owner}，共 ${r.count} 个文件）`)

    const worst = rows[0]
    const days = Math.floor((Date.now() - new Date(worst.latest.updatedAt).getTime()) / 86400000)

    return {
      text: `我按「最近一次更新」排了一下表格汇里的 ${live.length} 个文件：\n\n需要重点跟进的 3 个客户：\n${lines.join('\n')}\n\n其中「${worst.client.name}」已经 ${days > 30 ? '超过一个月' : `${days} 天`}没有新的方案或表格了，建议优先确认需求进度。`,
      fileIds: rows.slice(0, 3).map((r) => r.latest.id),
      actions: [
        { label: '搜索相关客户', kind: 'to', payload: `/search?q=${encodeURIComponent(worst.client.name)}` },
        { label: `打开 ${trimExt(worst.latest.name)}`, kind: 'open', payload: worst.latest.id },
      ],
      suggestions: ['星河科技的方案都有哪些版本？', '本月员工报销一共多少钱？', '有哪些方案已经归档？'],
    }
  }

  /* —— 2. 报销 / 费用 —— */
  if (/报销|费用|花了多少|差旅/.test(q)) {
    // 员工维度必须先于全局汇总处理，避免把“张三报销”回答成全员总额。
    const reimbursementEmployees = Array.from(new Set(REIMBURSEMENTS.map((record) => record.employee)))
    const namedEmployee = reimbursementEmployees.find((name) => q.includes(name))
    const employeeRecords = namedEmployee
      ? REIMBURSEMENTS.filter((record) => record.employee === namedEmployee)
      : []

    if (namedEmployee) {
      if (!employeeRecords.length) {
        return {
          text: `没有找到「${namedEmployee}」的报销记录。`,
          fileIds: live.filter((f) => /报销|费用/.test(f.name)).slice(0, 3).map((f) => f.id),
          actions: [{ label: '打开报销看板', kind: 'to', payload: '/reimbursement' }],
          suggestions: ['本月员工报销一共多少钱？', '张三的报销明细有哪些？'],
        }
      }

      const employeeTotal = employeeRecords.reduce((sum, record) => sum + record.amount, 0)
      const employeePending = employeeRecords.filter((record) => record.status === '待审核').length
      const employeeApproved = employeeRecords.filter((record) => record.status === '已审核').length
      const employeeRejected = employeeRecords.filter((record) => record.status === '已驳回').length
      const detailLines = employeeRecords.map(
        (record) => `· ${formatMoney(record.amount)} · ${record.purpose} · ${record.status}`,
      )

      return {
        text: `「${namedEmployee}」累计报销：${formatMoney(employeeTotal)}（${employeeRecords.length} 笔）\n\n· 待审核：${employeePending} 笔\n· 已审核：${employeeApproved} 笔\n· 已驳回：${employeeRejected} 笔\n\n报销明细：\n${detailLines.join('\n')}`,
        fileIds: live.filter((f) => /报销|费用/.test(f.name)).slice(0, 3).map((f) => f.id),
        actions: [
          { label: '打开报销看板', kind: 'to', payload: '/reimbursement' },
          { label: '打开员工报销统计表', kind: 'open', payload: 'f-reimb-summary' },
        ],
        suggestions: ['本月员工报销一共多少钱？', '报销金额最高的部门是哪个？'],
      }
    }

    const pending = REIMBURSEMENTS.filter((r) => r.status === '待审核')
    const top = [...REIMBURSEMENTS].sort((a, b) => b.amount - a.amount).slice(0, 3)
    const topLines = top.map((r) => `· ${r.employee}（${r.dept}）${formatMoney(r.amount)} · ${r.purpose} · ${r.status}`)
    return {
      text: `我汇总了表格汇里的报销数据：\n\n· 累计总报销：${formatMoney(REIMBURSEMENT_SUMMARY.total)}\n· 本月报销：${formatMoney(REIMBURSEMENT_SUMMARY.monthTotal)}\n· 待审核：${REIMBURSEMENT_SUMMARY.pending} 笔\n· 已审核：${REIMBURSEMENT_SUMMARY.approved} 笔\n\n金额最高的 3 笔：\n${topLines.join('\n')}\n\n待审核里有 ${pending.length} 笔在演示数据中，建议先处理超过 3 天未审批的单据。`,
      fileIds: live.filter((f) => /报销|费用/.test(f.name)).slice(0, 3).map((f) => f.id),
      actions: [
        { label: '打开报销看板', kind: 'to', payload: '/reimbursement' },
        { label: '打开员工报销统计表', kind: 'open', payload: 'f-reimb-summary' },
      ],
      suggestions: ['报销金额最高的部门是哪个？', '哪些客户最近没有更新方案？', '帮我找星河科技最近的报价表'],
    }
  }

  /* —— 3. 版本 / 发错风险 —— */
  if (/版本|发错|最新版|v\d/i.test(q)) {
    const series = new Map<string, HubFile[]>()
    live.forEach((f) => {
      if (f.seriesId) series.set(f.seriesId, [...(series.get(f.seriesId) ?? []), f])
    })
    const groups = Array.from(series.values()).map((list) =>
      list.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    )
    const first = groups[0]
    const lines = groups.map((g) => `· ${trimExt(g[g.length - 1].name)} → 最新 ${g[0].version ?? ''}（${relativeTime(g[0].updatedAt)}）`)
    return {
      text: `我检查了所有存在多个版本的文件系列，共 ${groups.length} 组：\n\n${lines.join('\n')}\n\n分享文件时我会自动做一次版本检查：如果你选的是旧版本，我会提示你改用最新的那一份。`,
      fileIds: first ? first.slice(0, 3).map((f) => f.id) : [],
      actions: [{ label: '去看看最新版本', kind: 'open', payload: first?.[0]?.id ?? '' }],
      suggestions: ['帮我找星河科技最近的报价表', '本月员工报销一共多少钱？'],
    }
  }

  /* —— 4. 指定客户 —— */
  const namedClient = CLIENTS.find((c) => q.includes(c.name))
  if (namedClient) {
    const hits = searchFiles(files, q)
    const own = hits.filter((h) => h.file.client === namedClient.name).map((h) => h.file)
    const list = (own.length ? own : hits.map((h) => h.file)).slice(0, 6)
    if (!list.length) {
      return {
        text: `我暂时没有找到「${namedClient.name}」的文件。要不要先上传一份？上传后我会自动识别客户和用途。`,
        fileIds: [],
        actions: [{ label: '去上传', kind: 'to', payload: '/collector' }],
        suggestions: DEFAULT_SUGGESTIONS,
      }
    }
    const quote = list.find((f) => /报价|价格/.test(f.name))
    const plan = list.find((f) => f.kind === 'doc' || f.kind === 'ppt')
    const newest = [...list].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0]

    const focus = quote ?? newest
    const text = [
      `找到了 ${list.length} 个与「${namedClient.name}」相关的文件，最后更新的是：`,
      '',
      `${trimExt(newest.name)}`,
      `更新时间：${smartDateTime(newest.updatedAt)} · ${newest.owner}`,
    ]
    if (plan && plan.id !== newest.id) {
      text.push('', `如果要发方案，建议用「${trimExt(plan.name)}」（${relativeTime(plan.updatedAt)} 更新）。`)
    }
    text.push('', '是否打开？')

    return {
      text: text.join('\n'),
      fileIds: list.slice(0, 4).map((f) => f.id),
      actions: [
        { label: `打开 ${trimExt(focus.name)}`, kind: 'open', payload: focus.id },
        { label: '查看全部结果', kind: 'to', payload: '/search' },
      ],
      suggestions: ['哪些客户最近没有更新方案？', '有没有发错版本的风险？'],
    }
  }

  /* —— 5. 统计类问题 —— */
  if (/多少|几个|统计|一共|总数/.test(q)) {
    const sheets = live.filter((f) => f.kind === 'sheet').length
    const docs = live.filter((f) => f.kind === 'doc').length
    const ppts = live.filter((f) => f.kind === 'ppt').length
    const pdfs = live.filter((f) => f.kind === 'pdf').length
    return {
      text: `表格汇目前一共收录 ${live.length} 个文件：\n\n· 表格 ${sheets} 个\n· 方案 ${docs} 个\n· PPT ${ppts} 个\n· PDF ${pdfs} 个\n\n其中最近 7 天更新过的有 ${live.filter((f) => Date.now() - new Date(f.updatedAt).getTime() < 7 * 86400000).length} 个。`,
      fileIds: [],
      actions: [{ label: '返回首页', kind: 'to', payload: '/dashboard' }],
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  /* —— 6. 通用检索 —— */
  const hits = searchFiles(files, q)
  if (hits.length) {
    const answer = buildAISearchAnswer(q, hits)
    return {
      text: answer.text.join('\n'),
      fileIds: hits.slice(0, 4).map((h) => h.file.id),
      actions: answer.actions,
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  return {
    text: `我没有在 ${live.length} 个文件里找到与「${q}」匹配的内容。\n\n你可以：\n1. 换成客户名称试试，例如「星河科技」\n2. 换成文件用途，例如「报价表」「员工报销」\n3. 直接上传这份文件，我会自动识别客户、类型和关键词`,
    fileIds: [],
    actions: [
      { label: '去上传表格', kind: 'to', payload: '/collector' },
      { label: '打开搜索页', kind: 'to', payload: '/search' },
    ],
    suggestions: DEFAULT_SUGGESTIONS,
  }
}
