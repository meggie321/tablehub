import type {
  AISummary,
  AccentColor,
  ClientMeta,
  FileExt,
  FileKind,
  HubFile,
  ReimbursementRecord,
  SheetPreview,
} from '@/types'

/* ------------------------------------------------------------------ *
 * 时间工具：让 Demo 数据始终显示成「10分钟前 / 昨天 / 3天前」
 * ------------------------------------------------------------------ */

const DAY = 24 * 60 * 60 * 1000

function isoMinutesAgo(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString()
}

function isoTodayAt(hour: number, minute: number): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  // 如果今天这个时刻还没到，就当作昨天，避免出现「未来时间」
  if (d.getTime() > Date.now()) d.setTime(d.getTime() - DAY)
  return d.toISOString()
}

function isoDaysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/* ------------------------------------------------------------------ *
 * 伪随机（固定种子，保证每次打开数据一致）
 * ------------------------------------------------------------------ */

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/* ------------------------------------------------------------------ *
 * 客户
 * ------------------------------------------------------------------ */

export const CLIENTS: ClientMeta[] = [
  { name: '星河科技', industry: '人工智能 · A 轮', contact: '王总', manager: 'Meggie', color: 'indigo', since: '2023' },
  { name: 'ABC科技', industry: '企业服务 · 上市', contact: '李经理', manager: '陈涛', color: 'violet', since: '2024' },
  { name: '未来科技', industry: '新能源 · B 轮', contact: '周总', manager: '李雯', color: 'blue', since: '2024' },
  { name: '青云传媒', industry: 'MCN · 文化传媒', contact: '赵总监', manager: '周晓', color: 'amber', since: '2025' },
  { name: '智创有限公司', industry: '智能制造', contact: '孙工', manager: '王磊', color: 'emerald', since: '2025' },
]

/** 内部 / 非客户主体，用于「所属客户」筛选 */
export const INTERNAL_OWNERS = ['内部', '人事', '多个客户'] as const

export const ALL_CLIENT_NAMES = [...CLIENTS.map((c) => c.name), ...INTERNAL_OWNERS]

export const OWNERS = ['Meggie', '李雯', '陈涛', '周晓', '王磊', '赵敏']

/* ------------------------------------------------------------------ *
 * 关键词 / 标签 / AI 总结模板
 * ------------------------------------------------------------------ */

const SHEET_TOPICS = [
  '客户信息表', '报价表', '员工调查表', '月度销售数据', '项目进度表', '费用明细表',
  '合同台账', '客户回访记录', '预算执行表', '供应商名录', '渠道分析表', 'KPI 考核表',
  '库存盘点表', '产品报价单', '回款明细表', '培训签到表', '考勤统计表', '市场调研数据',
  '竞品分析表', '客户满意度调查', '推广效果数据', '订单明细表', '售后服务记录',
  '设备台账', '招聘进度表', '差旅费用表', '项目成本核算表', '质量检查记录',
]

const INNER_TOPICS = [
  '员工报销统计表', '员工信息表', '员工排班表', '部门预算表', '资产盘点表',
  '内部培训计划', '绩效考核汇总表', '考勤异常明细', '办公用品申领表', '面试评估表',
]

const PLAN_TOPICS = [
  '年度合作方案', '市场推广方案', '品牌运营方案', '数字化转型方案', '客户服务方案',
  '渠道拓展方案', '产品定价方案', '广告投放方案', '年度服务方案', '项目管理方案',
  '私域运营方案', '内容营销方案',
]

const PPT_TOPICS = [
  '项目介绍 PPT', '产品发布 PPT', '季度复盘 PPT', '融资路演 PPT', '客户提案 PPT',
  '团队培训 PPT', '年度总结 PPT', '行业洞察 PPT',
]

const KEYWORD_POOL = ['合作', '报价', '客户', '员工', '报销', '调研', '预算', '合同', '推广', '进度', '数据', '方案']
const TAG_POOL = ['客户', '方案', '2026', '重点', '季度', '归档', '长期合作', '待跟进', '汇报', '内部']
const VARIANTS = ['最终版', '初稿', '修订版', '内部版', '对外版', '终版']

function extOf(kind: FileKind): string {
  switch (kind) {
    case 'sheet':
      return '.xlsx'
    case 'doc':
      return '.docx'
    case 'ppt':
      return '.pptx'
    default:
      return '.pdf'
  }
}

function defaultExt(kind: FileKind, name: string): FileExt {
  if (kind === 'sheet') return name.endsWith('.csv') ? 'csv' : 'xlsx'
  if (kind === 'doc') return 'docx'
  if (kind === 'ppt') return 'pptx'
  return 'pdf'
}

function topicOf(name: string, client: string): string {
  let s = name.replace(/\.[^.]+$/, '')
  s = s.replace(client, '')
  s = s.replace(/^20\d{2}年?/, '')
  s = s.replace(/（[^）]*）/g, '')
  s = s.replace(/(最终版|初稿|修订版|内部版|对外版|终版|V\d+)$/g, '')
  return s.trim() || s
}

function guessCategory(name: string, client: string, kind: FileKind): string {
  if (/报销/.test(name)) return '报销'
  if (/调研|调查|问卷/.test(name)) return '调研'
  if (/报价|价格|合同|回款|报价单/.test(name)) return '商务'
  if (/员工|人事|招聘|考勤|入职|面试|绩效|培训/.test(name)) return '人事'
  if (/预算|费用|成本|财务|资产|差旅/.test(name)) return '财务'
  if (/销售|订单|渠道|推广|市场|竞品/.test(name)) return '销售'
  if (kind === 'doc' || kind === 'ppt') return '客户方案'
  if (client === '内部' || client === '人事') return '内部表格'
  return '客户表格'
}

function buildKeywords(name: string, client: string, category: string, tags: string[]): string[] {
  const rng = makeRng(hashString(name))
  const year = name.match(/20\d{2}/)?.[0]
  const base = [
    client,
    category,
    ...tags,
    ...(year ? [year] : []),
    ...KEYWORD_POOL.filter(() => rng() > 0.72).slice(0, 2),
  ]
  const fromName = name
    .replace(/\.[^.]+$/, '')
    .replace(client, '')
    .split(/[\s（()）·\-_]+/)
    .filter((s) => s.length >= 2 && s.length <= 6)
  return Array.from(new Set([...base, ...fromName])).slice(0, 10)
}

function defaultSummary(name: string, client: string, kind: FileKind, category: string): AISummary {
  const year = name.match(/20\d{2}/)?.[0] ?? String(new Date().getFullYear())
  const topic = topicOf(name, client)

  if (kind === 'doc' || kind === 'ppt' || category === '客户方案') {
    return {
      intro: `这是一份 ${client} ${year} 年度的${topic || '合作方案'}。`,
      bullets: [
        '项目背景与目标',
        '服务内容与交付范围',
        '合作方式与商务条款',
        '项目报价与付款节奏',
        '时间安排与里程碑',
      ],
      recommend: `建议发送给：${client}客户负责人。`,
    }
  }
  if (category === '报销' || category === '财务') {
    return {
      intro: `这是一份${topic || '费用'}相关的表格，共记录 ${120 + (hashString(name) % 380)} 条明细。`,
      bullets: ['费用总额与月度趋势', '部门 / 项目分布', '异常金额与待核查项', '审批状态统计', '与预算的偏差'],
      recommend: '建议发送给：财务负责人与部门主管。',
    }
  }
  if (category === '人事') {
    return {
      intro: `这是一份${topic || '人事'}表格，覆盖 ${18 + (hashString(name) % 260)} 名员工。`,
      bullets: ['人员基本信息与组织结构', '入职 / 离职时间分布', '岗位与职级构成', '考勤与绩效概况', '待补充的缺失字段'],
      recommend: '建议发送给：人力资源负责人。',
    }
  }
  if (category === '调研') {
    return {
      intro: `这是一份${topic || '调研'}数据表，有效样本 ${80 + (hashString(name) % 520)} 份。`,
      bullets: ['样本构成与回收率', '核心问题的选项分布', '客户关注点排序', '与上一期的对比变化', '可执行的结论建议'],
      recommend: '建议发送给：市场负责人与项目决策人。',
    }
  }
  return {
    intro: `这是一份${client}的${topic || '业务表格'}，由 ${OWNERS[hashString(name) % OWNERS.length]} 最近更新。`,
    bullets: ['数据范围与统计口径', '关键指标概览', '环比 / 同比变化', '异常数据提示', '后续跟进建议'],
    recommend: `建议发送给：${client === '内部' || client === '人事' ? '对应部门负责人' : `${client}对接人`}。`,
  }
}

/* ------------------------------------------------------------------ *
 * 文件工厂
 * ------------------------------------------------------------------ */

type FileInput = Partial<HubFile> & {
  name: string
  kind: FileKind
  client: string
  updatedAt: string
}

export function mkFile(p: FileInput): HubFile {
  const category = p.category ?? guessCategory(p.name, p.client, p.kind)
  const tags =
    p.tags ??
    (() => {
      const rng = makeRng(hashString(`${p.name}tags`))
      const pool = [...TAG_POOL]
      const out: string[] = []
      while (out.length < 2 && pool.length) {
        out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
      }
      return out
    })()
  const h = hashString(p.name)
  return {
    id: p.id ?? `f-${h.toString(36)}`,
    name: p.name,
    kind: p.kind,
    ext: p.ext ?? defaultExt(p.kind, p.name),
    category,
    client: p.client,
    owner: p.owner ?? OWNERS[h % OWNERS.length],
    createdAt: p.createdAt ?? new Date(new Date(p.updatedAt).getTime() - DAY * (20 + (h % 200))).toISOString(),
    updatedAt: p.updatedAt,
    sizeMB: p.sizeMB ?? Number((0.3 + ((h % 900) / 100)).toFixed(1)),
    tags,
    keywords: p.keywords ?? buildKeywords(p.name, p.client, category, tags),
    aiSummary: p.aiSummary ?? defaultSummary(p.name, p.client, p.kind, category),
    starred: p.starred ?? false,
    status: p.status ?? '已完成',
    version: p.version,
    seriesId: p.seriesId,
    rows: p.rows ?? (p.kind === 'sheet' ? 20 + (h % 480) : undefined),
    preview: p.preview,
    openCount: p.openCount ?? h % 40,
  }
}

/* ------------------------------------------------------------------ *
 * 精品文件（严格对齐需求文档的示例数据）
 * ------------------------------------------------------------------ */

const FEATURED: HubFile[] = [
  mkFile({
    id: 'f-xh-annual-plan',
    name: '星河科技年度合作方案.xlsx',
    kind: 'sheet',
    client: '星河科技',
    category: '客户方案',
    owner: 'Meggie',
    updatedAt: isoMinutesAgo(10),
    sizeMB: 2.4,
    tags: ['客户', '方案', '2026'],
    keywords: ['合作', '2026', '科技', '客户方案', '星河科技', '年度'],
    starred: true,
    status: '已完成',
    rows: 48,
    openCount: 37,
    preview: {
      headers: ['模块', '服务内容', '数量', '单价（元）', '小计（元）'],
      rows: [
        ['基础服务', '账号与权限体系', 1, 68000, 68000],
        ['增长服务', '内容代运营（月度）', 12, 12000, 144000],
        ['技术服务', '数据看板定制', 2, 35000, 70000],
        ['增值服务', '季度策略复盘会', 4, 8000, 32000],
        ['合计', '—', '—', '—', 314000],
      ],
    },
    aiSummary: {
      intro: '这是一份星河科技 2026 年度合作方案。',
      bullets: ['项目背景', '服务内容', '合作方式', '项目报价', '时间安排'],
      recommend: '建议发送给：星河科技客户负责人。',
    },
  }),
  mkFile({
    id: 'f-xh-quote',
    name: '星河科技报价表.xlsx',
    kind: 'sheet',
    client: '星河科技',
    category: '商务',
    owner: 'Meggie',
    updatedAt: isoTodayAt(9, 42),
    sizeMB: 1.2,
    tags: ['客户', '报价'],
    keywords: ['报价', '价格', '客户', '2026', '星河科技'],
    starred: true,
    openCount: 52,
    preview: {
      headers: ['产品 / 服务', '规格', '数量', '单价（元）', '小计（元）'],
      rows: [
        ['标准版授权', '10 席位 / 年', 1, 48000, 48000],
        ['专业版授权', '25 席位 / 年', 1, 96000, 96000],
        ['实施与培训', '一次性', 1, 26000, 26000],
        ['年度维保', '标准 SLA', 1, 18000, 18000],
        ['合计', '—', '—', '—', 188000],
      ],
    },
  }),
  mkFile({
    id: 'f-xh-client-profile',
    name: '星河科技客户资料.xlsx',
    kind: 'sheet',
    client: '星河科技',
    category: '客户资料',
    owner: '李雯',
    updatedAt: isoDaysAgo(2, 15, 20),
    sizeMB: 1.8,
    tags: ['客户', '归档'],
  }),
  mkFile({
    id: 'f-xh-client-info',
    name: '星河科技客户信息表.xlsx',
    kind: 'sheet',
    client: '星河科技',
    category: '客户资料',
    owner: '李雯',
    updatedAt: isoDaysAgo(4, 11, 5),
    sizeMB: 0.9,
    tags: ['客户', '重点'],
  }),
  mkFile({
    id: 'f-xh-staff-survey',
    name: '星河科技员工调查表.xlsx',
    kind: 'sheet',
    client: '星河科技',
    category: '调研',
    owner: '周晓',
    updatedAt: isoDaysAgo(6, 16, 40),
    sizeMB: 0.7,
    tags: ['客户', '汇报'],
  }),
  mkFile({
    id: 'f-abc-survey',
    name: 'ABC科技市场调查.xlsx',
    kind: 'sheet',
    client: 'ABC科技',
    category: '调研',
    owner: '陈涛',
    updatedAt: isoDaysAgo(3, 9, 30),
    sizeMB: 3.1,
    tags: ['客户', '汇报'],
  }),
  mkFile({
    id: 'f-abc-research',
    name: 'ABC公司市场调研.xlsx',
    kind: 'sheet',
    client: 'ABC科技',
    category: '调研',
    owner: '陈涛',
    updatedAt: isoDaysAgo(1, 18, 32),
    sizeMB: 2.7,
    tags: ['客户', '重点', '季度'],
  }),
  mkFile({
    id: 'f-reimb-summary',
    name: '员工报销统计表.xlsx',
    kind: 'sheet',
    client: '内部',
    category: '报销',
    owner: '赵敏',
    updatedAt: isoMinutesAgo(60),
    sizeMB: 1.5,
    tags: ['内部', '汇报'],
    starred: false,
    openCount: 64,
    preview: {
      headers: ['员工', '部门', '费用类型', '金额（元）', '状态'],
      rows: [
        ['张三', '市场', '差旅费', 560, '已审核'],
        ['李四', '产品', '招待费', 1280, '待审核'],
        ['王五', '销售', '交通费', 820, '已审核'],
        ['赵六', '研发', '设备采购', 2360, '已审核'],
        ['孙七', '市场', '差旅费', 1490, '待审核'],
      ],
    },
  }),
  mkFile({
    id: 'f-staff-info',
    name: '员工信息表.xlsx',
    kind: 'sheet',
    client: '内部',
    category: '人事',
    owner: '赵敏',
    updatedAt: isoDaysAgo(5, 14, 10),
    sizeMB: 2.2,
    tags: ['内部', '归档'],
  }),
  mkFile({
    id: 'f-new-staff',
    name: '新员工信息表.xlsx',
    kind: 'sheet',
    client: '人事',
    category: '人事',
    owner: '赵敏',
    updatedAt: isoDaysAgo(3, 10, 15),
    sizeMB: 0.5,
    tags: ['内部', '重点'],
    status: '进行中',
  }),
  mkFile({
    id: 'f-internal-budget',
    name: '2026年度部门预算执行表.xlsx',
    kind: 'sheet',
    client: '内部',
    category: '财务',
    owner: '赵敏',
    updatedAt: isoDaysAgo(7, 9, 0),
    sizeMB: 4.6,
    tags: ['内部', '2026', '季度'],
    starred: true,
  }),

  // —— 方案（word） ——
  mkFile({
    id: 'f-xh-plan-v1',
    name: '星河科技合作方案 V1.docx',
    kind: 'doc',
    client: '星河科技',
    category: '客户方案',
    owner: 'Meggie',
    updatedAt: isoDaysAgo(46, 14, 0),
    sizeMB: 1.1,
    tags: ['客户', '方案', '归档'],
    version: 'V1',
    seriesId: 'xh-coop',
    status: '已完成',
  }),
  mkFile({
    id: 'f-xh-plan-v2',
    name: '星河科技合作方案 V2.docx',
    kind: 'doc',
    client: '星河科技',
    category: '客户方案',
    owner: 'Meggie',
    updatedAt: isoDaysAgo(9, 17, 5),
    sizeMB: 1.9,
    tags: ['客户', '方案'],
    version: 'V2',
    seriesId: 'xh-coop',
    starred: true,
    openCount: 28,
  }),
  mkFile({
    id: 'f-xh-plan-v3',
    name: '星河科技合作方案 V3.docx',
    kind: 'doc',
    client: '星河科技',
    category: '客户方案',
    owner: 'Meggie',
    updatedAt: isoDaysAgo(1, 18, 32),
    sizeMB: 2.1,
    tags: ['客户', '方案', '2026'],
    version: 'V3',
    seriesId: 'xh-coop',
    status: '已完成',
    openCount: 11,
  }),
  mkFile({
    id: 'f-xh-annual-service',
    name: '星河科技年度服务方案.docx',
    kind: 'doc',
    client: '星河科技',
    category: '客户方案',
    owner: '李雯',
    updatedAt: isoDaysAgo(5, 11, 40),
    sizeMB: 1.6,
    tags: ['客户', '方案', '2026'],
    starred: true,
  }),
  mkFile({
    id: 'f-abc-promo',
    name: 'ABC科技市场推广方案.docx',
    kind: 'doc',
    client: 'ABC科技',
    category: '客户方案',
    owner: '陈涛',
    updatedAt: isoDaysAgo(8, 16, 0),
    sizeMB: 2.8,
    tags: ['客户', '方案', '汇报'],
    status: '进行中',
  }),

  // —— PPT ——
  mkFile({
    id: 'f-xh-ppt',
    name: '星河科技项目介绍 PPT.pptx',
    kind: 'ppt',
    client: '星河科技',
    category: '客户方案',
    owner: 'Meggie',
    updatedAt: isoDaysAgo(2, 20, 10),
    sizeMB: 6.4,
    tags: ['客户', '方案', '汇报'],
    starred: true,
    openCount: 19,
  }),
  mkFile({
    id: 'f-abc-coop-ppt',
    name: 'ABC科技合作方案.pptx',
    kind: 'ppt',
    client: 'ABC科技',
    category: '客户方案',
    owner: '陈涛',
    updatedAt: isoDaysAgo(4, 13, 25),
    sizeMB: 5.1,
    tags: ['客户', '方案'],
    status: '进行中',
  }),
  mkFile({
    id: 'f-2026-plan-summary',
    name: '2026客户方案汇总.pptx',
    kind: 'ppt',
    client: '多个客户',
    category: '客户方案',
    owner: 'Meggie',
    updatedAt: isoDaysAgo(1, 19, 45),
    sizeMB: 8.9,
    tags: ['方案', '2026', '汇报'],
    starred: true,
    openCount: 33,
  }),
]

/* ------------------------------------------------------------------ *
 * 批量生成（让数据量级接近真实：128 表格 / 36 方案 / 24 PPT / 6 PDF）
 * ------------------------------------------------------------------ */

const TARGET = { sheet: 128, doc: 36, ppt: 24, pdf: 6 } as const

function generate(kind: FileKind, count: number, topics: string[], seed: number): HubFile[] {
  const rng = makeRng(seed)
  const used = new Set(FEATURED.map((f) => f.name))
  const out: HubFile[] = []
  let guard = 0

  while (out.length < count && guard < count * 60) {
    guard++
    const client = CLIENTS[out.length % CLIENTS.length].name
    const topic = topics[Math.floor(rng() * topics.length)]
    const year = ['2024', '2025', '2026'][Math.floor(rng() * 3)]
    const style = Math.floor(rng() * 5)
    const variant = VARIANTS[Math.floor(rng() * VARIANTS.length)]
    let base: string
    if (style === 0) base = `${client}${topic}`
    else if (style === 1) base = `${year}${client}${topic}`
    else if (style === 2) base = `${client}${year}年度${topic}`
    else if (style === 3) base = `${client}${topic}（${variant}）`
    else base = `${year}${client}${topic}${variant}`

    // 避免出现「2025年度年度总结」这类重复词
    base = base.replace(/年度年度/g, '年度')

    const name = `${base}${extOf(kind)}`
    if (used.has(name)) continue
    used.add(name)

    const days = Math.floor(Math.pow(rng(), 1.5) * 300)
    const updatedAt = days === 0 ? isoMinutesAgo(30 + Math.floor(rng() * 600)) : isoDaysAgo(days, 8 + Math.floor(rng() * 11), Math.floor(rng() * 60))
    const category = kind === 'doc' || kind === 'ppt' ? '客户方案' : guessCategory(name, client, kind)
    const status: HubFile['status'] = rng() > 0.88 ? '进行中' : rng() > 0.94 ? '待审核' : rng() > 0.96 ? '草稿' : '已完成'

    out.push(
      mkFile({
        name,
        kind,
        client,
        updatedAt,
        category,
        status,
        starred: rng() > 0.9,
        owner: OWNERS[Math.floor(rng() * OWNERS.length)],
        sizeMB: Number((0.4 + rng() * 9).toFixed(1)),
        tags: Array.from(
          new Set([category === '客户方案' ? '方案' : '内部', year, ...TAG_POOL.filter(() => rng() > 0.75).slice(0, 2)]),
        ).slice(0, 3),
      }),
    )
  }
  return out
}

/** 内部表格：补一批「内部 / 人事」归属的文件，保证筛选器有内容 */
const INNER_FILES: HubFile[] = INNER_TOPICS.map((topic, i) =>
  mkFile({
    name: `${topic}${i % 3 === 0 ? '（内部）' : ''}.xlsx`,
    kind: 'sheet',
    client: i % 3 === 0 ? '人事' : '内部',
    category: guessCategory(topic, '内部', 'sheet'),
    updatedAt: isoDaysAgo(12 + i * 7, 9 + (i % 8), (i * 13) % 60),
    owner: OWNERS[i % OWNERS.length],
    starred: i % 4 === 0,
    status: i % 5 === 0 ? '待审核' : '已完成',
  }),
)

const FEATURED_SHEETS = FEATURED.filter((f) => f.kind === 'sheet').length
const FEATURED_DOCS = FEATURED.filter((f) => f.kind === 'doc').length
const FEATURED_PPTS = FEATURED.filter((f) => f.kind === 'ppt').length

const GENERATED: HubFile[] = [
  // 表格总数 = 精品(11) + 内部(10) + 生成(107) = 128
  ...generate('sheet', TARGET.sheet - FEATURED_SHEETS - INNER_FILES.length, SHEET_TOPICS, 20261006),
  ...generate('doc', TARGET.doc - FEATURED_DOCS, PLAN_TOPICS, 880317),
  ...generate('ppt', TARGET.ppt - FEATURED_PPTS, PPT_TOPICS, 551209),
  ...generate('pdf', TARGET.pdf, ['年度合作方案', '项目结项报告', '资质与合规材料', '服务报价单'], 314159),
]

const DEMO_FILES: HubFile[] = [...FEATURED, ...INNER_FILES, ...GENERATED]

/** 原演示文件 ID，用于永久清理浏览器中已保存的文件状态 */
export const DEMO_FILE_IDS = DEMO_FILES
  .map((file) => file.id)

/** 演示文件已按用户要求全部永久删除，不再进入应用数据或回收站。 */
export const FILES: HubFile[] = []

/* ------------------------------------------------------------------ *
 * 派生数据
 * ------------------------------------------------------------------ */

export function getFile(id: string): HubFile | undefined {
  return FILES.find((f) => f.id === id)
}

export const ALL_TAGS: string[] = Array.from(new Set(FILES.flatMap((f) => f.tags))).sort()

export const CLIENT_OPTIONS = ALL_CLIENT_NAMES.filter(
  (name) => FILES.some((f) => f.client === name),
)

/** 员工（用于「员工」维度的检索） */
export const EMPLOYEES = Array.from(
  new Set([...OWNERS, '张三', '李四', '王五', '赵六', '孙七']),
).map((name) => ({
  name,
  dept: ['市场', '产品', '销售', '研发', '运营', '人事'][hashString(name) % 6],
  files: FILES.filter((f) => f.owner === name).length,
}))

/** 表格预览：没有预置预览的文件按名称确定性地生成一份 */
export function getPreview(file: HubFile): SheetPreview {
  if (file.preview) return file.preview
  const rng = makeRng(hashString(file.id))
  const topic = topicOf(file.name, file.client)

  const templates: Array<{ match: RegExp; headers: string[] }> = [
    { match: /报价|价格/, headers: ['产品 / 服务', '规格', '数量', '单价（元）', '小计（元）'] },
    { match: /报销|费用|差旅/, headers: ['员工', '部门', '费用类型', '金额（元）', '状态'] },
    { match: /客户|回访/, headers: ['客户名称', '联系人', '联系电话', '合作金额（元）', '状态'] },
    { match: /员工|人事|招聘|考勤|入职|绩效/, headers: ['姓名', '部门', '职位', '入职日期', '状态'] },
    { match: /库存|设备|资产/, headers: ['名称', '编号', '数量', '状态', '负责人'] },
    { match: /调研|调查|问卷|满意/, headers: ['问题 / 选项', '选项 A', '选项 B', '样本数', '占比'] },
    { match: /销售|订单|回款/, headers: ['月份', '订单数', '金额（元）', '完成率', '负责人'] },
  ]
  const tpl = templates.find((t) => t.match.test(topic)) ?? {
    headers: ['项目', '负责人', '数量', '金额（元）', '状态'],
  }

  const statusPool = ['已完成', '进行中', '待审核', '已归档']
  const depts = ['市场', '产品', '销售', '研发', '运营']
  const rows = Array.from({ length: 6 }, (_, i) => {
    const amount = Math.round(800 + rng() * 24000)
    return tpl.headers.map((h, j) => {
      if (/（元）|金额|单价|小计/.test(h)) return amount
      if (/数量|样本数|订单数/.test(h)) return 1 + Math.floor(rng() * 40)
      if (/占比|完成率|率/.test(h)) return `${Math.round(40 + rng() * 59)}%`
      if (/状态/.test(h)) return statusPool[Math.floor(rng() * statusPool.length)]
      if (/日期|时间|月份/.test(h)) return `${10 + Math.floor(rng() * 3)}/${1 + Math.floor(rng() * 28)}`
      if (/姓名|员工|负责人/.test(h)) return OWNERS[(i + j) % OWNERS.length]
      if (/部门/.test(h)) return depts[(i + j) % depts.length]
      if (/客户名称/.test(h)) return file.client === '内部' ? '内部部门' : file.client
      if (/联系人/.test(h)) return ['王总', '李经理', '周总', '赵总监', '孙工'][(i + j) % 5]
      if (/电话/.test(h)) return `138****${String(1000 + Math.floor(rng() * 8999))}`
      if (/编号/.test(h)) return `NO.${1000 + Math.floor(rng() * 8999)}`
      if (/规格/.test(h)) return ['标准版', '专业版', '旗舰版'][Math.floor(rng() * 3)]
      if (/项目|名称|服务|产品|问题/.test(h)) return `${topic || '项目'} ${i + 1}`
      return `—`
    })
  })

  return { headers: tpl.headers, rows }
}

/* ------------------------------------------------------------------ *
 * 员工报销
 * ------------------------------------------------------------------ */

export const REIMBURSEMENT_SUMMARY = {
  total: 128450,
  pending: 12,
  approved: 86,
  monthTotal: 36800,
}

const REIMB_SEED: Array<[string, string, number, '已审核' | '待审核' | '已驳回', string]> = [
  ['张三', '市场', 560, '已审核', '差旅费'],
  ['李四', '产品', 1280, '待审核', '客户招待'],
  ['王五', '销售', 820, '已审核', '市内交通'],
  ['赵六', '研发', 2360, '已审核', '设备采购'],
  ['孙七', '市场', 1490, '待审核', '差旅费'],
  ['周八', '运营', 680, '已审核', '办公用品'],
  ['吴九', '销售', 3150, '待审核', '客户拜访'],
  ['郑十', '产品', 420, '已审核', '打车费'],
  ['钱一', '研发', 1780, '已审核', '云服务续费'],
  ['刘二', '人事', 950, '待审核', '招聘平台'],
  ['陈三', '市场', 2240, '已审核', '展会物料'],
  ['杨四', '运营', 310, '已驳回', '重复提交'],
  ['黄五', '销售', 5600, '待审核', '差旅费'],
  ['朱六', '产品', 1260, '已审核', '用户访谈礼品'],
  ['秦七', '研发', 890, '已审核', '技术书籍'],
  ['尤八', '市场', 1670, '待审核', '广告投放'],
  ['许九', '运营', 2330, '已审核', '活动执行'],
  ['何十', '销售', 740, '已审核', '样品寄送'],
]

export const REIMBURSEMENTS: ReimbursementRecord[] = REIMB_SEED.map((r, i) => ({
  id: `rb-${i + 1}`,
  employee: r[0],
  dept: r[1],
  amount: r[2],
  status: r[3],
  purpose: r[4],
  project: [
    '星河科技年度数字化升级', '云帆客户管理平台', '春季品牌推广计划', '企业数据中台建设',
    '智能客服系统试点', '华东区渠道拓展', '内部协同工具优化', '新产品市场调研',
  ][i % 8],
  date: isoDaysAgo(i % 6, 10, (i * 7) % 60),
}))

/* ------------------------------------------------------------------ *
 * Dashboard 图表数据
 * ------------------------------------------------------------------ */

export const SEARCH_TREND = [
  { label: '周一', value: 42 },
  { label: '周二', value: 58 },
  { label: '周三', value: 51 },
  { label: '周四', value: 73 },
  { label: '周五', value: 66 },
  { label: '周六', value: 28 },
  { label: '周日', value: 36 },
]

export const UPLOAD_TREND = [
  { label: '5月', value: 18 },
  { label: '6月', value: 26 },
  { label: '7月', value: 21 },
  { label: '8月', value: 34 },
  { label: '9月', value: 41 },
  { label: '10月', value: 12 },
]

export const HOT_SEARCHES = ['星河科技', '报价表', '员工报销', '客户方案']

export function countByKind(files: HubFile[], kind: FileKind): number {
  return files.filter((f) => f.kind === kind && !f.deleted).length
}

export function clientMeta(name: string): ClientMeta | undefined {
  return CLIENTS.find((c) => c.name === name)
}

export const ACCENT_BY_CLIENT: Record<string, AccentColor> = Object.fromEntries(
  CLIENTS.map((c) => [c.name, c.color]),
)
