import { CheckCircle2, CircleDollarSign, Clock, Download, FileImage, FileSpreadsheet, Plus, Wallet, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageShell } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/ui/StatCard'
import { Chip } from '@/components/ui/Segmented'
import { REIMBURSEMENTS, REIMBURSEMENT_SUMMARY } from '@/data/demo'
import { useApp } from '@/store/AppStore'
import { download, formatMoney } from '@/lib/utils'
import type { ReimbursementRecord } from '@/types'

type Filter = 'all' | '待审核' | '已审核' | '已驳回'

function md(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function ReimbursementPage() {
  const { toast } = useApp()
  const [records, setRecords] = useState<ReimbursementRecord[]>(REIMBURSEMENTS)
  const [filter, setFilter] = useState<Filter>('all')
  const [paymentImages, setPaymentImages] = useState<Record<string, string>>({})

  function setPaymentImage(id: string, file?: File) {
    if (!file || !file.type.startsWith('image/')) return
    const imageUrl = URL.createObjectURL(file)
    setPaymentImages((previous) => {
      const oldUrl = previous[id]
      if (oldUrl) URL.revokeObjectURL(oldUrl)
      return { ...previous, [id]: imageUrl }
    })
  }

  const rows = useMemo(
    () => (filter === 'all' ? records : records.filter((r) => r.status === filter)),
    [records, filter],
  )

  const counts = useMemo(
    () => ({
      all: records.length,
      pending: records.filter((r) => r.status === '待审核').length,
      approved: records.filter((r) => r.status === '已审核').length,
      rejected: records.filter((r) => r.status === '已驳回').length,
    }),
    [records],
  )

  function decide(id: string, status: '已审核' | '已驳回') {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    toast(status === '已审核' ? '✓ 已通过该笔报销' : '已驳回该笔报销', status === '已审核' ? 'success' : 'warn')
  }

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-slate-200/80 shadow-card">
            <Wallet size={20} />
          </span>
          <div>
            <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">员工报销</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">
              报销单据集中管理，搜索员工名字或部门就能定位（Demo 数据）。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={() => {
              download('员工报销统计表.xlsx')
              toast('已开始导出报销明细（演示）', 'success')
            }}
          >
            导出报表
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => toast('演示环境不提交真实单据', 'info')}
          >
            新建报销
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CircleDollarSign size={18} />}
          label="总报销"
          value={formatMoney(REIMBURSEMENT_SUMMARY.total)}
          hint="累计已提交金额"
          tone="brand"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="待审核"
          value={REIMBURSEMENT_SUMMARY.pending}
          hint="需要尽快处理"
          tone="amber"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="已审核"
          value={REIMBURSEMENT_SUMMARY.approved}
          hint="已通过的单据"
          tone="emerald"
        />
        <StatCard
          icon={<FileSpreadsheet size={18} />}
          label="本月报销"
          value={formatMoney(REIMBURSEMENT_SUMMARY.monthTotal)}
          hint="本月累计"
          tone="blue"
        />
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">报销明细</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              共 {records.length} 条记录 · 当前筛选 {rows.length} 条
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
              全部 {counts.all}
            </Chip>
            <Chip active={filter === '待审核'} onClick={() => setFilter('待审核')}>
              待审核 {counts.pending}
            </Chip>
            <Chip active={filter === '已审核'} onClick={() => setFilter('已审核')}>
              已审核 {counts.approved}
            </Chip>
            <Chip active={filter === '已驳回'} onClick={() => setFilter('已驳回')}>
              已驳回 {counts.rejected}
            </Chip>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState compact icon={<Wallet size={20} />} title="没有符合条件的报销记录" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['员工', '部门', '用途', '所属项目', '支付图片', '金额', '状态', '日期', '操作'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400 ${
                        h === '金额' ? 'text-right' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-slate-800">{r.employee}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="slate">{r.dept}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12.5px] text-slate-500">{r.purpose}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12.5px] text-slate-600">{r.project}</span>
                    </td>
                    <td className="px-4 py-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 ring-1 ring-slate-200 hover:bg-brand-50">
                        {paymentImages[r.id] ? (
                          <img src={paymentImages[r.id]} alt={`${r.employee}支付凭证`} className="h-8 w-10 rounded object-cover" />
                        ) : (
                          <><FileImage size={14} /><span>上传图片</span></>
                        )}
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => setPaymentImage(r.id, event.target.files?.[0])} />
                      </label>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] font-semibold tabular-nums text-slate-800">
                        {formatMoney(r.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12.5px] text-slate-500">{md(r.date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === '待审核' ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-600 hover:bg-emerald-50"
                            icon={<CheckCircle2 size={13} />}
                            onClick={() => decide(r.id, '已审核')}
                          >
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50"
                            icon={<XCircle size={13} />}
                            onClick={() => decide(r.id, '已驳回')}
                          >
                            驳回
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-300">已处理</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 text-center text-[12.5px] text-slate-400">
        报销模块为 Demo 展示；支付图片仅在当前页面临时预览，不会上传或保存。
      </p>
    </PageShell>
  )
}
