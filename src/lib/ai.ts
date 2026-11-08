import { CLIENTS, OWNERS, mkFile } from '@/data/demo'
import type { FileExt, FileKind, HubFile, OrganizedFileMetadata, WorkbookSheetMeta } from '@/types'

/* ------------------------------------------------------------------ *
 * 上传文件的「AI 自动识别」
 * DeepSeek 按文件名与格式整理；DeepSeek 不可用时回退到本地规则
 * ------------------------------------------------------------------ */

const EXT_TO_KIND: Record<string, FileKind> = {
  xlsx: 'sheet',
  xls: 'sheet',
  csv: 'sheet',
  docx: 'doc',
  doc: 'doc',
  pptx: 'ppt',
  ppt: 'ppt',
  pdf: 'pdf',
}

const EXT_TO_FILE_EXT: Record<string, FileExt> = {
  xlsx: 'xlsx',
  xls: 'xlsx',
  csv: 'csv',
  docx: 'docx',
  doc: 'docx',
  pptx: 'pptx',
  ppt: 'pptx',
  pdf: 'pdf',
}

export function getExtension(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i)
  return m ? m[1].toLowerCase() : 'xlsx'
}

const INTERNAL_HINTS = ['内部', '人事', '员工', '团队', '部门', '考勤', '招聘']

/** 从文件名里识别客户 */
export function detectClient(name: string): string {
  const hit = CLIENTS.find(
    (c) => name.includes(c.name) || name.includes(c.name.replace(/(科技|传媒|有限公司)$/, '')),
  )
  if (hit) return hit.name
  if (INTERNAL_HINTS.some((k) => name.includes(k))) return '内部'
  return '未分类'
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface UploadResult {
  file: HubFile
  confidence: number
}

export interface AIFileAnalysis {
  name: string
  client: string
  category: string
  keywords: string[]
  tags: string[]
  confidence: number
  summary: string
}

/** 通过本地服务端代理调用 DeepSeek，仅发送文件名、格式与大小，不发送文件内容。 */
export async function analyzeFilesWithDeepSeek(
  files: Array<{ name: string; sizeMB: number }>,
): Promise<AIFileAnalysis[]> {
  const out: AIFileAnalysis[] = []
  for (let offset = 0; offset < files.length; offset += 30) {
    const batch = files.slice(offset, offset + 30)
    const response = await fetch('/api/deepseek/organize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: batch.map((file) => ({
          ...file,
          kind: EXT_TO_KIND[getExtension(file.name)] ?? 'sheet',
        })),
        clients: CLIENTS.map((client) => client.name),
      }),
    })
    const result = await response.json() as { files?: AIFileAnalysis[]; error?: string }
    if (!response.ok) throw new Error(result.error || 'DeepSeek 智能整理失败')
    if (!Array.isArray(result.files) || result.files.length !== batch.length) {
      throw new Error('DeepSeek 返回的整理结果不完整')
    }
    out.push(...result.files.map((item, index) => ({
      name: batch[index].name,
      client: CLIENTS.some((client) => client.name === item.client) || item.client === '内部'
        ? item.client
        : '未分类',
      category: typeof item.category === 'string' && item.category.trim() ? item.category.trim() : '未分类',
      keywords: Array.isArray(item.keywords) ? item.keywords.filter((word) => typeof word === 'string').slice(0, 8) : [],
      tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === 'string').slice(0, 5) : [],
      confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
      summary: typeof item.summary === 'string' ? item.summary : '',
    })))
  }
  return out
}

export function toOrganizedMetadata(analysis: AIFileAnalysis): OrganizedFileMetadata {
  return {
    client: analysis.client,
    category: analysis.category,
    keywords: analysis.keywords,
    tags: analysis.tags,
    aiSummary: {
      intro: analysis.summary || `DeepSeek 根据文件名推断为「${analysis.category}」。`,
      bullets: ['根据文件名与格式生成；未读取文件内容', '建议人工核对客户归属和分类'],
      recommend: `识别置信度 ${Math.round(analysis.confidence * 100)}%，建议人工确认。`,
    },
  }
}

/** 把一次上传变成一条完整的 Demo 文件记录 */
export function buildUploadedFile(name: string, sizeMB: number, analysis?: AIFileAnalysis, contentHash?: string, worksheets?: WorkbookSheetMeta[]): UploadResult {
  const ext = getExtension(name)
  const kind = EXT_TO_KIND[ext] ?? 'sheet'
  const client = analysis?.client ?? detectClient(name)
  const file = mkFile({
    id: `up-${hash(name).toString(36)}-${Date.now().toString(36).slice(-4)}`,
    contentHash,
    worksheets,
    name,
    kind,
    ext: EXT_TO_FILE_EXT[ext] ?? 'xlsx',
    client,
    category: analysis?.category,
    keywords: analysis?.keywords,
    tags: analysis?.tags,
    aiSummary: analysis ? toOrganizedMetadata(analysis).aiSummary : undefined,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    sizeMB: Number(sizeMB.toFixed(1)),
    status: '已完成',
  })
  const confidence = analysis
    ? analysis.confidence
    : 0.86 + (hash(name) % 14) / 100
  return { file, confidence }
}

/** Demo 上传用的示例文件（让用户不选文件也能完整体验流程） */
export const DEMO_UPLOAD_FILES: Array<{ name: string; sizeMB: number }> = [
  { name: '星河科技2026年度合作方案最终版.xlsx', sizeMB: 2.6 },
  { name: '星河科技报价表V2.xlsx', sizeMB: 1.1 },
  { name: '员工报销统计表-10月.xlsx', sizeMB: 0.8 },
  { name: 'ABC科技合作方案.pptx', sizeMB: 5.4 },
  { name: '客户调查表汇总.csv', sizeMB: 0.4 },
]

/* ------------------------------------------------------------------ *
 * AI 创建客户方案
 * ------------------------------------------------------------------ */

export interface PlanSlide {
  title: string
  points: string[]
}

export interface PlanDraft {
  title: string
  subtitle: string
  slides: PlanSlide[]
  summary: string
}

export function buildPlanDraft(client: string, topic: string, refs: HubFile[]): PlanDraft {
  const year = new Date().getFullYear()
  const refNames = refs.map((r) => r.name.replace(/\.[^.]+$/, ''))
  const numbers = refs
    .filter((r) => r.preview)
    .flatMap((r) => r.preview!.rows)
    .flat()
    .filter((v): v is number => typeof v === 'number')
  const total = numbers.length ? Math.max(...numbers) : 314000

  return {
    title: `${client} ${topic || `${year} 年度合作方案`}`,
    subtitle: `由表格汇 AI 基于 ${refs.length || 0} 份参考表格生成 · ${new Date().toLocaleDateString('zh-CN')}`,
    slides: [
      {
        title: '项目背景',
        points: [
          `${client} 当前业务增长迅速，需要一套可持续的数字化协作方案`,
          '现有资料分散在多个表格与文档中，检索与复用成本较高',
          '本次合作目标：统一资料管理、提升响应速度',
        ],
      },
      {
        title: '服务内容',
        points: [
          '资料汇集与自动分类（表格、方案、PPT 统一管理）',
          'AI 搜索与智能总结，输入名字即可定位文件',
          '发前版本检查，避免把旧方案发给客户',
        ],
      },
      {
        title: '合作方式',
        points: ['按年度框架协议执行，分季度验收', '专属客户成功经理 1 对 1 对接', '支持按需扩展服务模块'],
      },
      {
        title: '项目报价',
        points: [
          refNames.length ? `参考《${refNames[0]}》的报价结构` : '参考历史报价结构',
          `预估年度总投入约 ¥${total.toLocaleString('en-US')}`,
          '付款节奏：签约 40% / 中期 30% / 结项 30%',
        ],
      },
      {
        title: '时间安排',
        points: [
          '第 1 个月：需求调研与方案确认',
          '第 2-3 个月：系统上线与数据迁移',
          '第 4 个月起：运营支持与季度复盘',
        ],
      },
    ],
    summary: `本方案面向 ${client}，围绕「汇集 + 搜索 + AI 整理 + 防止发错」四条主线设计，${
      refs.length ? `已引用 ${refs.length} 份内部表格作为数据依据。` : '未选择参考表格，内容基于行业通用模板生成。'
    }`,
  }
}

/** 导出方案大纲（浏览器端下载 HTML，可直接打印成 PPT 讲稿） */
export function exportPlanDraft(draft: PlanDraft): void {
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${draft.title}</title>
<style>
 body{font-family:system-ui,"Microsoft YaHei",sans-serif;max-width:820px;margin:48px auto;padding:0 24px;color:#0f172a}
 h1{font-size:28px;margin-bottom:4px}
 .sub{color:#64748b;margin-bottom:32px}
 section{border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:16px}
 h2{font-size:17px;margin:0 0 12px;color:#4f46e5}
 li{margin:6px 0;line-height:1.7}
 footer{margin-top:32px;color:#94a3b8;font-size:13px}
</style></head><body>
<h1>${draft.title}</h1>
<p class="sub">${draft.subtitle}</p>
${draft.slides
  .map((s) => `<section><h2>${s.title}</h2><ul>${s.points.map((p) => `<li>${p}</li>`).join('')}</ul></section>`)
  .join('\n')}
<footer>${draft.summary}<br>由 表格汇 TableHub AI 生成</footer>
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${draft.title}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 新建方案时的默认负责人 */
export const DEFAULT_OWNER = OWNERS[0]
