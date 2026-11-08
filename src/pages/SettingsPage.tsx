import { Bell, Copy, Database, RefreshCcw, Save, Settings as SettingsIcon, Shield, Sparkles, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageShell } from '@/components/ui/Card'
import { Field, Input, Switch } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/Loading'
import { useApp } from '@/store/AppStore'
import { formatSize } from '@/lib/utils'
import { useAuth } from '@/auth/AuthProvider'
import { useTeam } from '@/team/TeamProvider'

export default function SettingsPage() {
  const { liveFiles, toast } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { membership, members, createTeam, setEmployeeRole, joinTeam } = useTeam()
  const [name, setName] = useState(user?.username ?? '')
  const [email, setEmail] = useState('')
  const [identity, setIdentity] = useState<'老板' | '员工'>('员工')
  const [roomCode, setRoomCode] = useState('')
  const [roomPopup, setRoomPopup] = useState('')
  const [teamBusy, setTeamBusy] = useState(false)
  const [prefs, setPrefs] = useState({
    autoDetect: true,
    autoKeywords: true,
    versionCheck: true,
    aiSuggest: true,
    notifyUpload: true,
    notifyAudit: true,
  })

  const used = liveFiles.reduce((s, f) => s + f.sizeMB, 0)
  const quota = 1024

  async function selectIdentity(next: '老板' | '员工') {
    setTeamBusy(true)
    try {
      if (next === '老板') {
        const team = await createTeam()
        setIdentity('老板')
        const code = team.membership?.roomCode
        if (code) {
          setRoomPopup(code)
          window.scrollTo(0, 0)
        }
        toast(membership?.role === 'owner' ? '你的团队房间号已就绪' : '团队已创建，房间号已生成', 'success')
      } else {
        await setEmployeeRole()
        setIdentity('员工')
        toast(membership?.role === 'owner' ? '已切换为员工，原房间及成员权限已删除，成员账号保留' : '当前身份为员工', 'success')
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : '切换身份失败', 'error')
    } finally { setTeamBusy(false) }
  }

  async function joinRoom() {
    setTeamBusy(true)
    try { await joinTeam(roomCode); toast('已加入团队', 'success') }
    catch (error) { toast(error instanceof Error ? error.message : '加入团队失败', 'error') }
    finally { setTeamBusy(false) }
  }

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(roomPopup)
      toast('房间密码已复制', 'success')
    } catch {
      toast(`房间密码：${roomPopup}`, 'info')
    }
  }

  return (
    <PageShell wide>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200/80 shadow-card">
          <SettingsIcon size={20} />
        </span>
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">设置</h2>
          <p className="mt-1 text-[13.5px] text-slate-500">
            管理账户信息、团队协作与 AI 偏好。
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <h3 className="text-[15px] font-semibold text-slate-900">我是什么</h3>
            <p className="mt-1 text-[12.5px] text-slate-500">老板可创建房间并管理成员权限；房间清空后切回员工会删除该房间。</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(['老板', '员工'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={membership ? (membership.role === 'owner' ? option === '老板' : option === '员工') : identity === option}
                  disabled={teamBusy}
                  onClick={() => void selectIdentity(option)}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-medium ring-1 transition ${(membership ? (membership.role === 'owner' ? option === '老板' : option === '员工') : identity === option) ? 'bg-brand-50 text-brand-700 ring-brand-300' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="block">{option}</span>
                  <span className="mt-1 block text-xs font-normal opacity-70">{option === '老板' ? '管理团队与查看报销' : '提交和查看工作信息'}</span>
                </button>
              ))}
            </div>
            {membership?.role === 'owner' ? <button type="button" onClick={() => { setRoomPopup(membership.roomCode); window.scrollTo(0, 0) }} className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-left text-sm text-brand-700">你的团队房间号：<strong className="ml-1 select-all text-lg tracking-widest">{membership.roomCode}</strong><span className="ml-2 text-xs">点击查看</span></button> : null}
            {!membership && identity === '员工' ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Input value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" placeholder="输入老板提供的 8 位房间号" />
                <Button variant="primary" disabled={teamBusy || roomCode.length !== 8} onClick={() => void joinRoom()}>{teamBusy ? '处理中…' : '加入团队'}</Button>
              </div>
            ) : null}
            {membership?.role === 'employee' ? <p className="mt-3 text-sm text-slate-500">你已加入房间 {membership.roomCode}，团队负责人设置的区域权限会自动生效。</p> : null}
          </Card>
          <Card>
            <h3 className="text-[15px] font-semibold text-slate-900">账户资料</h3>
            <div className="mt-4 flex items-center gap-4">
              <Avatar name={name || user?.username || '用户'} size={56} />
              <div>
                <p className="text-[14px] font-semibold text-slate-800">{name || '未命名'}</p>
                <p className="text-[12.5px] text-slate-400">{email}</p>
                <Badge tone="brand" className="mt-1.5">
                  {membership?.role === 'employee' || (!membership && identity === '员工') ? '员工' : '老板'}
                </Badge>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="姓名">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="邮箱">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="公司名称">
                <Input defaultValue="表格汇科技（演示）" />
              </Field>
              <Field label="默认文件归属">
                <Input defaultValue="内部" />
              </Field>
            </div>
            <Button
              variant="primary"
              className="mt-5"
              icon={<Save size={15} />}
              onClick={() => toast('✓ 设置已保存（演示）', 'success')}
            >
              保存修改
            </Button>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-600" />
              <h3 className="text-[15px] font-semibold text-slate-900">AI 偏好</h3>
            </div>
            <div className="mt-2 divide-y divide-slate-100">
              <Switch
                label="上传后自动识别客户与类型"
                description="AI 会读取文件名和内容，自动填写所属客户与文件用途"
                checked={prefs.autoDetect}
                onChange={(v) => setPrefs({ ...prefs, autoDetect: v })}
              />
              <Switch
                label="自动生成关键词与标签"
                description="为每个文件生成可搜索的关键词，命中率更高"
                checked={prefs.autoKeywords}
                onChange={(v) => setPrefs({ ...prefs, autoKeywords: v })}
              />
              <Switch
                label="分享前进行版本检查"
                description="发现更新版本时提醒你改用最新方案，避免发错"
                checked={prefs.versionCheck}
                onChange={(v) => setPrefs({ ...prefs, versionCheck: v })}
              />
              <Switch
                label="搜索时显示 AI 建议"
                description="在搜索结果顶部展示 AI 推荐的文件"
                checked={prefs.aiSuggest}
                onChange={(v) => setPrefs({ ...prefs, aiSuggest: v })}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-blue-600" />
              <h3 className="text-[15px] font-semibold text-slate-900">通知</h3>
            </div>
            <div className="mt-2 divide-y divide-slate-100">
              <Switch
                label="文件更新提醒"
                description="同一系列文件有新版本时通知我"
                checked={prefs.notifyUpload}
                onChange={(v) => setPrefs({ ...prefs, notifyUpload: v })}
              />
              <Switch
                label="报销待审核提醒"
                description="有新的报销单等待我审批时通知我"
                checked={prefs.notifyAudit}
                onChange={(v) => setPrefs({ ...prefs, notifyAudit: v })}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              <h3 className="text-[15px] font-semibold text-slate-900">团队</h3>
              {membership ? <Badge tone="slate">{members.length} 人</Badge> : null}
            </div>
            <Button
              variant="secondary"
              full
              className="mt-3.5"
              icon={<Users size={15} />}
              onClick={() => navigate('/team')}
            >
              团队
            </Button>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Database size={16} className="text-slate-500" />
              <h3 className="text-[15px] font-semibold text-slate-900">存储空间</h3>
            </div>
            <p className="mt-3 text-[22px] font-semibold tabular-nums text-slate-900">
              {formatSize(used)}
            </p>
            <p className="text-[12px] text-slate-400">已使用 / {formatSize(quota)} 额度</p>
            <ProgressBar value={(used / quota) * 100} className="mt-3" />
            <p className="mt-3 text-[12.5px] text-slate-500">
              共 {liveFiles.length} 个文件，全部保存在本地浏览器中（Demo）。
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" />
              <h3 className="text-[15px] font-semibold text-slate-900">数据与隐私</h3>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
              这是纯前端 Demo：所有 Demo 数据都打包在页面里，你的操作（收藏、删除、上传）只保存在本机浏览器的
              localStorage，不会上传到任何服务器。
            </p>
            <Button
              variant="secondary"
              full
              className="mt-4"
              icon={<RefreshCcw size={15} />}
              onClick={() => {
                localStorage.clear()
                toast('已重置演示数据，即将刷新', 'info')
                window.setTimeout(() => window.location.reload(), 700)
              }}
            >
              重置演示数据
            </Button>
          </Card>
        </div>
      </div>
      {roomPopup ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 pb-8 pt-6 backdrop-blur-sm sm:pt-12" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRoomPopup('') }}>
          <section role="dialog" aria-modal="true" aria-labelledby="room-password-title" className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-white/70 sm:p-8">
            <button type="button" aria-label="关闭" onClick={() => setRoomPopup('')} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Shield size={23} /></div>
            <h2 id="room-password-title" className="mt-4 text-center text-xl font-semibold text-slate-900">您的房间密码是</h2>
            <p className="mt-2 text-center text-sm text-slate-500">请把它提供给员工，用于加入您的团队</p>
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-50 to-orch-50 px-4 py-5 text-center ring-1 ring-brand-100">
              <span className="select-all font-mono text-4xl font-bold tracking-[0.3em] text-brand-700">{roomPopup}</span>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <Button variant="secondary" onClick={() => setRoomPopup('')}>关闭</Button>
              <Button variant="primary" icon={<Copy size={15} />} onClick={() => void copyRoomCode()}>复制房间密码</Button>
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  )
}
