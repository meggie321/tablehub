/** 表格汇 TableHub —— 全局类型定义 */

export type FileKind = 'sheet' | 'doc' | 'ppt' | 'pdf'
export type FileExt = 'xlsx' | 'csv' | 'docx' | 'pptx' | 'pdf'
export type FileStatus = '已完成' | '进行中' | '待审核' | '草稿'
export type AccentColor =
  | 'indigo'
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'slate'

/** 表格预览（详情页展示用） */
export interface SheetPreview {
  headers: string[]
  rows: (string | number)[][]
}

/** AI 生成的总结 */
export interface AISummary {
  intro: string
  bullets: string[]
  recommend: string
}

export interface HubFile {
  id: string
  /** SHA-256 of a locally inspected upload, stored only for exact duplicate detection. */
  contentHash?: string
  name: string
  kind: FileKind
  ext: FileExt
  /** 客户方案 / 内部表格 / 报销 / 调研 / 人事 / 财务 */
  category: string
  /** 星河科技 / 内部 / 人事 / 多个客户 … */
  client: string
  owner: string
  createdAt: string
  updatedAt: string
  sizeMB: number
  tags: string[]
  keywords: string[]
  aiSummary: AISummary
  starred: boolean
  status: FileStatus
  /** 版本号，如 V2、V3 */
  version?: string
  /** 同一系列（用于"防止发错方案"的版本检测） */
  seriesId?: string
  rows?: number
  preview?: SheetPreview
  /** 工作簿拆分索引；只包含工作表名称/标题/表头，不保存单元格数据。 */
  worksheets?: WorkbookSheetMeta[]
  openCount?: number
  deleted?: boolean
  deletedAt?: string
}

export interface WorkbookSheetMeta {
  name: string
  title: string
  headers: string[]
  rowCount: number
}

export interface ClientMeta {
  name: string
  industry: string
  contact: string
  manager: string
  color: AccentColor
  since: string
}

export interface ReimbursementRecord {
  id: string
  employee: string
  dept: string
  amount: number
  status: '已审核' | '待审核' | '已驳回'
  date: string
  purpose: string
  project: string
  paymentImage?: string
}

/** DeepSeek 对文件名元数据的整理结果；不包含文件内容。 */
export interface OrganizedFileMetadata {
  client: string
  category: string
  keywords: string[]
  tags: string[]
  aiSummary: AISummary
}

export interface ChatAction {
  label: string
  /** open=打开文件详情 to=跳到某个页面（payload 为路径） */
  kind: 'open' | 'to'
  payload?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  files?: string[]
  actions?: ChatAction[]
  pending?: boolean
  time: string
}

export type SortKey = 'relevance' | 'updated' | 'name' | 'size'

export interface SearchFilters {
  kind: FileKind | 'all'
  client: string
  tags: string[]
  sort: SortKey
  starredOnly: boolean
}

export interface SearchHit {
  file: HubFile
  score: number
  reasons: string[]
}

export interface UploadTask {
  id: string
  name: string
  sizeMB: number
  contentHash?: string
  worksheets?: WorkbookSheetMeta[]
  progress: number
  stage: 'uploading' | 'analyzing' | 'done'
  /** AI 识别出的元信息 */
  detected?: {
    kind: FileKind
    client: string
    category: string
    keywords: string[]
    tags: string[]
  }
}

export interface ToastItem {
  id: string
  text: string
  tone: 'success' | 'info' | 'warn' | 'error'
}
