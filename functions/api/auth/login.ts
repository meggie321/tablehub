import { constantTimeEqual, cookie, isValidUsername, isValidPassword, json, newSessionToken, passwordHash, saveSession, type AuthEnv } from '../../_shared/auth'

export async function onRequestPost({ request, env }: { request: Request; env: AuthEnv }): Promise<Response> {
  if (!env.DB) return json({ error: '登录服务尚未完成配置' }, 503)
  try {
    const body = await request.json() as { username?: unknown; password?: unknown }
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!isValidUsername(username) || !isValidPassword(password)) return json({ error: '用户名或密码错误' }, 401)

    const user = await env.DB.prepare('SELECT id, username, password_hash, password_salt FROM users WHERE username = ? COLLATE NOCASE')
      .bind(username).first<{ id: string; username: string; password_hash: string; password_salt: string }>()
    const actual = user ? await passwordHash(password, user.password_salt) : await passwordHash(password, 'dW5rbm93bi11c2VyLXNhbHQ')
    if (!user || !constantTimeEqual(actual, user.password_hash)) return json({ error: '用户名或密码错误' }, 401)

    const token = newSessionToken()
    await saveSession(env, user.id, token)
    return json({ user: { id: user.id, username: user.username } }, 200, { 'Set-Cookie': cookie(token) })
  } catch {
    return json({ error: '登录服务暂时不可用' }, 503)
  }
}
