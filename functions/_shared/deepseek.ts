import type { AuthEnv } from './auth'

export interface Env extends AuthEnv {
  DEEPSEEK_API_KEY?: string
}

export interface PagesContext {
  request: Request
  env: Env
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export async function readJson(request: Request, limit = 1_000_000): Promise<unknown> {
  const raw = await request.text()
  if (raw.length > limit) throw new Error('Request too large')
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('Invalid JSON body')
  }
}

export async function deepSeekChat(apiKey: string, messages: Array<{ role: string; content: string }>, jsonMode = false) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-flash',
      messages,
      thinking: { type: 'disabled' },
      reasoning_effort: 'none',
      stream: false,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  const result = await response.json().catch(() => ({})) as {
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }
  if (!response.ok) {
    return { error: result.error?.message ?? 'DeepSeek 请求失败', status: response.status }
  }
  return { content: result.choices?.[0]?.message?.content ?? '' }
}
