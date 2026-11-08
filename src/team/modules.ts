export const TEAM_MODULES = [
  { key: 'dashboard', label: '首页' },
  { key: 'search', label: '全局搜索' },
  { key: 'favorites', label: '我的收藏' },
  { key: 'collector', label: '表格汇集器' },
  { key: 'ppt', label: 'PPT' },
  { key: 'ai', label: 'AI 助手' },
  { key: 'organize', label: 'AI 智能整理' },
  { key: 'reimbursement', label: '员工报销' },
  { key: 'trash', label: '回收站' },
  { key: 'files', label: '文件详情' },
] as const

export type TeamModuleKey = (typeof TEAM_MODULES)[number]['key']
