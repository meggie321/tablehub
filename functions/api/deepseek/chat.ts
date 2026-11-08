import { deepSeekChat, json, readJson, type PagesContext } from '../../_shared/deepseek'
import { currentUser } from '../../_shared/auth'

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (!env.DB) return json({ error: '登录服务尚未配置' }, 503)
  if (!await currentUser(request, env)) return json({ error: '请先登录' }, 401)
  if (!env.DEEPSEEK_API_KEY) return json({ error: 'DeepSeek API 尚未配置' }, 503)
  try {
    const body = await readJson(request) as { question?: unknown; context?: unknown }
    if (typeof body.question !== 'string' || !body.question.trim()) {
      return json({ error: 'question is required' }, 400)
    }

    const result = await deepSeekChat(env.DEEPSEEK_API_KEY, [
      {
        role: 'system',
        content: '你是表格汇的 AI 助手。请用中文简洁回答，只根据提供的应用数据回答具体问题；不要编造数据。涉及报销时严格按员工姓名筛选，只汇总被问到的员工；没有对应记录就明确说明。数据不足时说明限制。',
      },
      { role: 'user', content: `用户问题：${body.question}\n\n应用数据（JSON）：${JSON.stringify(body.context ?? {})}` },
    ])
    if ('error' in result) return json({ error: result.error }, result.status)
    return json({ answer: result.content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DeepSeek 服务暂时不可用'
    return json({ error: message }, message === 'Request too large' ? 413 : 400)
  }
}
