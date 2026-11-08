import { ArrowLeft, LockKeyhole, Sparkles, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function Brand() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-orch-600 text-white shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 8h16M4 12.5h16M4 17h9" />
        </svg>
      </span>
      <span><span className="block text-[16px] font-semibold text-slate-900">表格汇</span><span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">TableHub</span></span>
    </Link>
  )
}

export default function LoginPage() {
  const { status, error: sessionError, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (status === 'signedIn') return <Navigate to="/dashboard" replace />

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    setBusy(true)
    try {
      if (mode === 'register') await register(username, password)
      else await login(username, password)
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-5 py-12">
      <div className="hero-grid mask-fade-b pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[440px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-200/45 via-orch-200/35 to-blue-200/35 blur-3xl" aria-hidden />
      <Link to="/" className="absolute left-5 top-5 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800 sm:left-8 sm:top-8">
        <ArrowLeft size={16} /> 返回首页
      </Link>

      <section className="relative w-full max-w-[430px] rounded-[26px] bg-white p-7 shadow-pop ring-1 ring-slate-200/80 sm:p-9">
        <Brand />
        <div className="mt-8">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Sparkles size={19} /></span>
          <h1 className="mt-4 text-[25px] font-semibold tracking-tight text-slate-900">{mode === 'login' ? '登录工作台' : '注册账号'}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{mode === 'login' ? '登录后继续使用表格汇' : '创建账号，开始使用表格汇'}</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={submit} autoComplete="off">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">用户名</span>
            <span className="relative block"><UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><Input autoComplete="off" autoFocus minLength={3} maxLength={24} required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="3–24 位字母、数字或 _ -" className="pl-10" /></span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">密码</span>
            <span className="relative block"><LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><Input autoComplete="new-password" minLength={8} maxLength={128} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 位" className="pl-10" /></span>
          </label>
          {mode === 'register' ? (
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">确认密码</span>
              <Input autoComplete="new-password" required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" />
            </label>
          ) : null}

          {error || (status === 'error' ? sessionError : '') ? <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">{error || sessionError}</p> : null}
          {status === 'loading' ? <p className="text-[12px] text-slate-400">正在连接登录服务…</p> : null}
          <Button type="submit" variant="primary" disabled={busy || status === 'loading'} className="w-full" size="lg">
            {busy ? '请稍候…' : mode === 'login' ? '登录' : '创建账号'}
          </Button>
        </form>

        <div className="my-6 border-t border-slate-200" />
        <p className="text-center text-[13px] text-slate-400">
          {mode === 'login' ? '还没有账号？' : '已经有账号了？'}{' '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="font-medium text-slate-500 transition hover:text-brand-600">
            {mode === 'login' ? '注册账号' : '返回登录'}
          </button>
        </p>
      </section>
    </main>
  )
}
