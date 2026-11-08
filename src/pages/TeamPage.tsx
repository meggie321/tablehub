import { Check, Clipboard, Shield, UserMinus, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageShell } from '@/components/ui/Card'
import { useApp } from '@/store/AppStore'
import { TEAM_MODULES, type TeamModuleKey } from '@/team/modules'
import { useTeam } from '@/team/TeamProvider'

export default function TeamPage() {
  const navigate = useNavigate()
  const { toast } = useApp()
  const { membership, members, loading, error, setPermission, removeMember } = useTeam()
  const [pending, setPending] = useState('')

  async function togglePermission(userId: string, module: TeamModuleKey, allowed: boolean) {
    const key = `${userId}:${module}`
    setPending(key)
    try { await setPermission(userId, module, allowed) }
    catch (reason) { toast(reason instanceof Error ? reason.message : '保存权限失败', 'error') }
    finally { setPending('') }
  }

  async function kickMember(userId: string) {
    setPending(`remove:${userId}`)
    try { await removeMember(userId); toast('已将员工移出团队', 'success') }
    catch (reason) { toast(reason instanceof Error ? reason.message : '移除成员失败', 'error') }
    finally { setPending('') }
  }

  async function copyRoom() {
    if (!membership) return
    try { await navigator.clipboard.writeText(membership.roomCode); toast('房间号已复制', 'success') }
    catch { toast(`房间号：${membership.roomCode}`, 'info') }
  }

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-slate-200/80 shadow-card"><Users size={20} /></span>
          <div><h2 className="text-[24px] font-semibold tracking-tight text-slate-900">团队</h2><p className="mt-1 text-[13.5px] text-slate-500">查看团队人员，并管理每位员工可访问的区域。</p></div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/settings')}>返回设置</Button>
      </div>

      {loading ? <Card className="mt-6"><p className="text-sm text-slate-500">正在读取团队信息…</p></Card> : null}
      {error && !loading ? <Card className="mt-6"><p className="text-sm text-rose-600">{error}</p><p className="mt-2 text-xs text-slate-500">请确认团队数据库迁移已部署，然后刷新页面。</p></Card> : null}
      {!loading && !membership ? (
        <Card className="mt-6 text-center">
          <Shield size={28} className="mx-auto text-brand-500" />
          <h3 className="mt-3 text-lg font-semibold text-slate-900">你还没有加入团队</h3>
          <p className="mt-1 text-sm text-slate-500">在设置中选择“老板”创建房间号，或选择“员工”输入老板提供的房间号。</p>
          <Button className="mt-4" variant="primary" onClick={() => navigate('/settings')}>前往设置</Button>
        </Card>
      ) : null}

      {!loading && membership ? (
        <>
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-medium text-slate-400">团队房间号</p><p className="mt-1 text-2xl font-semibold tracking-[0.25em] text-slate-900">{membership.roomCode}</p><p className="mt-1 text-xs text-slate-500">把此 8 位号码提供给员工加入团队</p></div>
            <div className="flex items-center gap-2"><Badge tone={membership.role === 'owner' ? 'brand' : 'slate'}>{membership.role === 'owner' ? '老板' : '员工'}</Badge><Button variant="secondary" icon={<Clipboard size={14} />} onClick={() => void copyRoom()}>复制房间号</Button></div>
          </Card>

          <Card className="mt-5" padded={false}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-[15px] font-semibold text-slate-900">团队人员</h3><p className="mt-0.5 text-xs text-slate-500">共 {members.length} 人</p></div><Users size={18} className="text-slate-400" /></div>
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <section key={member.userId} className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.username} size={38} />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{member.username}</p><p className="text-xs text-slate-400">{member.role === 'owner' ? '房间创建者' : '团队员工'}</p></div>
                    <Badge tone={member.role === 'owner' ? 'brand' : 'slate'}>{member.role === 'owner' ? '老板' : '员工'}</Badge>
                  </div>
                  {member.role === 'employee' && membership.role === 'owner' ? (
                    <div className="mt-4 flex justify-end"><Button size="sm" variant="ghost" disabled={Boolean(pending)} icon={<UserMinus size={14} />} onClick={() => void kickMember(member.userId)}>移出团队</Button></div>
                  ) : null}
                  {member.role === 'employee' && membership.role === 'owner' ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {TEAM_MODULES.map(({ key, label }) => {
                        const checked = member.permissions[key]
                        const isPending = pending === `${member.userId}:${key}`
                        return <button key={key} type="button" role="switch" aria-checked={checked} disabled={Boolean(pending)} onClick={() => void togglePermission(member.userId, key, !checked)} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-left hover:bg-slate-100 disabled:opacity-60"><span className="text-[13px] text-slate-700">{label}</span><span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}><span className={`absolute top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}>{isPending ? null : checked ? <Check size={10} className="text-brand-600" /> : null}</span></span></button>
                      })}
                    </div>
                  ) : null}
                  {member.userId === members.find((person) => person.role !== 'owner')?.userId && membership.role === 'employee' ? (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs font-semibold text-slate-500">你当前可访问的区域</p><div className="flex flex-wrap gap-1.5">{TEAM_MODULES.map(({ key, label }) => <Badge key={key} tone={member.permissions[key] ? 'emerald' : 'slate'}>{label}：{member.permissions[key] ? '允许' : '已限制'}</Badge>)}</div></div>
                  ) : null}
                </section>
              ))}
            </div>
          </Card>
        </>
      ) : null}

      <p className="mt-4 text-center text-xs text-slate-400">区域限制会隐藏侧边栏入口并阻止直接打开对应页面；员工清空后，老板切回员工时房间会自动删除。</p>
    </PageShell>
  )
}
