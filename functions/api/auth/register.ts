import { cookie, isValidPassword, isValidUsername, json, newSessionToken, passwordHash, randomToken, saveSession, type AuthEnv } from '../../_shared/auth'

export async function onRequestPost({ request, env }: { request: Request; env: AuthEnv }): Promise<Response> {
  if (!env.DB) return json({ error: '登录服务尚未完成配置' }, 503)
  try {
    const body = await request.json() as { username?: unknown; password?: unknown }
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!isValidUsername(username)) return json({ error: '用户名需为 3–24 位字母、数字、下划线或连字符' }, 400)
    if (!isValidPassword(password)) return json({ error: '密码需为 8–128 位' }, 400)

    const id = crypto.randomUUID()
    const salt = randomToken(16)
    const hash = await passwordHash(password, salt)
    try {
      await env.DB.prepare('INSERT INTO users (id, username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(id, username, hash, salt, new Date().toISOString()).run()
    } catch {
      return json({ error: '这个用户名已被注册' }, 409)
    }

    const token = newSessionToken()
    await saveSession(env, id, token)
    return json({ user: { id, username } }, 201, { 'Set-Cookie': cookie(token) })
  } catch (error) {
    console.error('Auth registration failed:', error instanceof Error ? error.message : String(error))
    return json({ error: '注册失败，请稍后重试' }, 500)
  }
}
