import { Presentation, Star } from 'lucide-react'
import { FileLibrary } from '@/components/files/FileLibrary'
import type { HubFile } from '@/types'

/* 预置筛选函数放在模块级，避免每次渲染都重建 */
const isPpt = (f: HubFile) => f.kind === 'ppt'
const isStarred = (f: HubFile) => f.starred

export function PptCenter() {
  return (
    <FileLibrary
      title="PPT"
      subtitle="演示文稿、汇报材料和路演 PPT 集中管理。"
      preset={isPpt}
      defaultLayout="cards"
      icon={<Presentation size={20} />}
    />
  )
}

export function FavoritesPage() {
  return (
    <FileLibrary
      title="我的收藏"
      subtitle="点击文件上的 ⭐ 就能收藏，重要方案不会再被淹没。"
      preset={isStarred}
      defaultLayout="table"
      icon={<Star size={20} />}
    />
  )
}
