import { currentUser, json, type AuthEnv } from '../../_shared/auth'

export async function onRequestGet({ request, env }: { request: Request; env: AuthEnv }): Promise<Response> {
  if (!env.DB) return json({ error: '登录服务尚未完成配置' }, 503)
  try {
    return json({ user: await currentUser(request, env) })
  } catch {
    return json({ error: '登录服务暂时不可用' }, 503)
  }
}
