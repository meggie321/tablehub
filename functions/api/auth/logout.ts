import { cookie, deleteSession, json, sessionToken, type AuthEnv } from '../../_shared/auth'

export async function onRequestPost({ request, env }: { request: Request; env: AuthEnv }): Promise<Response> {
  try {
    const token = sessionToken(request)
    if (token) await deleteSession(env, token)
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) })
  } catch {
    return json({ error: '退出登录失败' }, 500, { 'Set-Cookie': cookie('', 0) })
  }
}
