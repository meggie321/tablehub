import {
  Home,
  Presentation,
  Settings,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  Wallet,
  Wand2,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** 高亮成 AI 风格 */
  ai?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: '工作台',
    items: [
      { to: '/dashboard', label: '首页', icon: Home },
      { to: '/favorites', label: '我的收藏', icon: Star },
    ],
  },
  {
    title: '文件',
    items: [
      { to: '/collector', label: '表格汇集器', icon: UploadCloud },
      { to: '/ppt', label: 'PPT', icon: Presentation },
    ],
  },
  {
    title: 'AI',
    items: [
      { to: '/ai', label: 'AI 助手', icon: Sparkles, ai: true },
      { to: '/organize', label: 'AI 智能整理', icon: Wand2, ai: true },
    ],
  },
  {
    title: '管理',
    items: [
      { to: '/trash', label: '回收站', icon: Trash2 },
      { to: '/settings', label: '设置', icon: Settings },
      { to: '/reimbursement', label: '员工报销', icon: Wallet },
    ],
  },
]

export const PAGE_TITLES: Record<string, { title: string; desc: string }> = {
  '/dashboard': { title: '首页', desc: '今天也来快速找到你需要的表格和方案' },
  '/search': { title: '全局搜索', desc: '输入名字，快速找到正确的那一份' },
  '/favorites': { title: '我的收藏', desc: '你标记过的重要文件' },
  '/ppt': { title: 'PPT', desc: '演示文稿与汇报材料' },
  '/reimbursement': { title: '员工报销', desc: '报销单据与审核状态（Demo）' },
  '/ai': { title: 'AI 助手', desc: '帮你快速找到、整理和分析表格' },
  '/collector': { title: '表格汇集器', desc: '把分散的表格统一放到这里，搜索一次即可找到' },
  '/organize': { title: 'AI 智能整理', desc: '查看并确认 AI 自动识别出的文件信息' },
  '/trash': { title: '回收站', desc: '删除的文件会先放在这里' },
  '/settings': { title: '设置', desc: '账户、团队与 AI 偏好' },
  '/team': { title: '团队', desc: '团队人员与区域权限管理' },
}

