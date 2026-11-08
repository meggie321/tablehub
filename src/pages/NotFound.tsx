import { Compass, Home } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageShell } from '@/components/ui/Card'

export default function NotFound() {
  return (
    <PageShell>
      <div className="py-16">
        <EmptyState
          icon={<Compass size={22} />}
          title="页面走丢了"
          description="这个地址没有对应的页面，可能链接已经失效。回到首页继续找表格吧。"
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <LinkButton to="/dashboard" variant="primary" icon={<Home size={15} />}>
                回到首页
              </LinkButton>
              <LinkButton to="/search" variant="secondary">
                去搜索
              </LinkButton>
            </div>
          }
        />
      </div>
    </PageShell>
  )
}
