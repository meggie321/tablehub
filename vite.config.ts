import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

function deepSeekApi(apiKey: string) {
  return {
    name: 'tablehub-deepseek-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/deepseek/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        if (!apiKey) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: '尚未配置 DeepSeek API Key。请在项目根目录的 .env.local 中配置 DEEPSEEK_API_KEY。' }))
          return
        }

        try {
          let rawBody = ''
          for await (const chunk of req) rawBody += chunk
          if (rawBody.length > 1_000_000) {
            res.statusCode = 413
            res.end('Request too large')
            return
          }

          const body = JSON.parse(rawBody) as { question?: string; context?: unknown }
          if (typeof body.question !== 'string' || !body.question.trim()) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'question is required' }))
            return
          }

          const upstream = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'deepseek-flash',
              messages: [
                {
                  role: 'system',
                  content: '你是表格汇的 AI 助手。请用中文简洁回答，只根据提供的应用数据回答具体问题；不要编造数据。涉及报销时严格按员工姓名筛选，只汇总被问到的员工；没有对应记录就明确说明。数据不足时说明限制。',
                },
                { role: 'user', content: `用户问题：${body.question}\n\n应用数据（JSON）：${JSON.stringify(body.context ?? {})}` },
              ],
              stream: false,
            }),
            signal: AbortSignal.timeout(60_000),
          })
          const result = await upstream.json() as {
            choices?: Array<{ message?: { content?: string } }>
            error?: { message?: string }
          }
          if (!upstream.ok) {
            res.statusCode = upstream.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: result.error?.message ?? 'DeepSeek 请求失败' }))
            return
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ answer: result.choices?.[0]?.message?.content ?? '' }))
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'DeepSeek 服务暂时不可用' }))
        }
      })

      server.middlewares.use('/api/deepseek/organize', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        if (!apiKey) {
          res.statusCode = 503
          res.end(JSON.stringify({ error: '尚未配置 DeepSeek API Key' }))
          return
        }

        try {
          let rawBody = ''
          for await (const chunk of req) rawBody += chunk
          if (rawBody.length > 500_000) {
            res.statusCode = 413
            res.end(JSON.stringify({ error: 'Request too large' }))
            return
          }

          const body = JSON.parse(rawBody) as {
            files?: Array<{ name?: string; sizeMB?: number; kind?: string }>
            clients?: string[]
          }
          if (!Array.isArray(body.files) || body.files.length < 1 || body.files.length > 30) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'files must contain 1 to 30 entries' }))
            return
          }
          const files = body.files.map((file) => ({
            name: String(file.name ?? '').slice(0, 240),
            sizeMB: Number(file.sizeMB ?? 0),
            kind: String(file.kind ?? 'sheet'),
          }))
          if (files.some((file) => !file.name)) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Each file needs a name' }))
            return
          }

          const upstream = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'deepseek-flash',
              response_format: { type: 'json_object' },
              messages: [
                {
                  role: 'system',
                  content: '你负责整理上传文件的元信息。只能根据文件名、格式和大小推断，不要声称读取了文件内容。对每个文件返回 JSON：{"files":[{"name":"原文件名","client":"客户名或内部或未分类","category":"用途分类","keywords":["关键词"],"tags":["标签"],"confidence":0.8,"summary":"一句话说明"}]}。confidence 必须是 0 到 1 的数字；关键词最多 8 个，标签最多 5 个。客户只能从用户提供的客户名单中选择，否则填未分类。保持输入顺序，不要遗漏文件。',
                },
                {
                  role: 'user',
                  content: JSON.stringify({ files, knownClients: body.clients ?? [] }),
                },
              ],
              stream: false,
            }),
            signal: AbortSignal.timeout(60_000),
          })
          const result = await upstream.json() as {
            choices?: Array<{ message?: { content?: string } }>
            error?: { message?: string }
          }
          if (!upstream.ok) {
            res.statusCode = upstream.status
            res.end(JSON.stringify({ error: result.error?.message ?? 'DeepSeek 请求失败' }))
            return
          }

          const parsed = JSON.parse(result.choices?.[0]?.message?.content ?? '{}') as { files?: unknown[] }
          if (!Array.isArray(parsed.files) || parsed.files.length !== files.length) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'DeepSeek 返回的整理结果格式不正确' }))
            return
          }
          res.end(JSON.stringify({ files: parsed.files }))
        } catch (error) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'DeepSeek 整理服务暂时不可用' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './',
    plugins: [react(), deepSeekApi(env.DEEPSEEK_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? '')],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5180,
      strictPort: false,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1200,
    },
  }
})
