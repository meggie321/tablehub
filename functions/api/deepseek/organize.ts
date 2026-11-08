import { deepSeekChat, json, readJson, type PagesContext } from '../../_shared/deepseek'
import { currentUser } from '../../_shared/auth'

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (!env.DB) return json({ error: '登录服务尚未配置' }, 503)
  if (!await currentUser(request, env)) return json({ error: '请先登录' }, 401)
  if (!env.DEEPSEEK_API_KEY) return json({ error: 'DeepSeek API 尚未配置' }, 503)
  try {
    const body = await readJson(request, 500_000) as {
      files?: Array<{ name?: unknown; sizeMB?: unknown; kind?: unknown }>
      clients?: string[]
    }
    if (!Array.isArray(body.files) || body.files.length < 1 || body.files.length > 30) {
      return json({ error: 'files must contain 1 to 30 entries' }, 400)
    }
    const files = body.files.map((file) => ({
      name: String(file.name ?? '').slice(0, 240),
      sizeMB: Number(file.sizeMB ?? 0),
      kind: String(file.kind ?? 'sheet'),
    }))
    if (files.some((file) => !file.name)) return json({ error: 'Each file needs a name' }, 400)

    const result = await deepSeekChat(env.DEEPSEEK_API_KEY, [
      {
        role: 'system',
        content: '你负责整理上传文件的元信息。只能根据文件名、格式和大小推断，不要声称读取了文件内容。对每个文件返回 JSON：{"files":[{"name":"原文件名","client":"客户名或内部或未分类","category":"用途分类","keywords":["关键词"],"tags":["标签"],"confidence":0.8,"summary":"一句话说明"}]}。confidence 必须是 0 到 1 的数字；关键词最多 8 个，标签最多 5 个。客户只能从用户提供的客户名单中选择，否则填未分类。保持输入顺序，不要遗漏文件。',
      },
      { role: 'user', content: JSON.stringify({ files, knownClients: body.clients ?? [] }) },
    ], true)
    if ('error' in result) return json({ error: result.error }, result.status)
    const parsed = JSON.parse(result.content) as { files?: unknown[] }
    if (!Array.isArray(parsed.files) || parsed.files.length !== files.length) {
      return json({ error: 'DeepSeek 返回的整理结果格式不正确' }, 502)
    }
    return json({ files: parsed.files })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DeepSeek 整理服务暂时不可用'
    return json({ error: message }, message === 'Request too large' ? 413 : 400)
  }
}
