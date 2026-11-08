/**
 * 表格汇 TableHub —— 响应式验证
 *
 * 通过 Chrome DevTools Protocol 设置真实移动端视口，
 * 逐个路由测量「是否横向溢出」，并可选截图。
 *
 * 用法: node scripts/check-responsive.mjs [截图路由] [输出png]
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9223
const BASE = 'http://127.0.0.1:5180'
const PROFILE = path.join(os.tmpdir(), 'th-cdp-profile')

const shotRoute = process.argv[2] ?? null
const shotOut = process.argv[3] ?? 'shots/mobile-cdp.png'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const proc = spawn(
  EDGE,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    `--user-data-dir=${PROFILE}`,
    `--remote-debugging-port=${PORT}`,
    'about:blank',
  ],
  { stdio: 'ignore', detached: false },
)

async function waitForDevtools() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const list = await r.json()
      const page = list.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* 还没起来 */
    }
    await sleep(400)
  }
  throw new Error('连接 DevTools 超时')
}

const wsUrl = await waitForDevtools()
const ws = new WebSocket(wsUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let seq = 0
const pending = new Map()
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
})
function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++seq
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

await send('Page.enable')
await send('Runtime.enable')

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return res.result?.result?.value
}

async function setViewport(width, height, mobile = true) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: mobile ? 2 : 1,
    mobile,
  })
}

const ROUTES = [
  '/',
  '/dashboard',
  '/search?q=星河科技',
  '/collector',
  '/plans',
  '/files',
  '/file/f-xh-annual-plan',
  '/ai',
  '/reimbursement',
  '/organize',
  '/trash',
  '/settings',
]

const WIDTHS = [390, 768]
const report = []

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    await setViewport(width, 844)
    await send('Page.navigate', { url: `${BASE}/#${route}` })
    await sleep(width === WIDTHS[0] && route === ROUTES[0] ? 2500 : 900)
    const metrics = await evaluate(`(() => {
      const de = document.documentElement
      let worst = { right: 0, path: '' }
      for (const el of document.querySelectorAll('body *')) {
        if (el.offsetParent === null) continue
        const r = el.getBoundingClientRect()
        if (r.right > worst.right) {
          worst = {
            right: Math.round(r.right),
            w: Math.round(r.width),
            path: el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 70),
          }
        }
      }
      return JSON.stringify({
        iw: window.innerWidth,
        cw: de.clientWidth,
        sw: de.scrollWidth,
        overflow: de.scrollWidth - de.clientWidth,
        worst,
      })
    })()`)
    report.push({ width, route, ...JSON.parse(metrics) })
  }
}

console.log('=== 响应式溢出检查（scrollWidth - clientWidth 应 <= 0）===')
for (const r of report) {
  const ok = r.overflow <= 1
  console.log(
    `${ok ? '✓' : '✗'} ${String(r.width).padStart(4)}px ${r.route.padEnd(24)} ` +
      `溢出=${r.overflow}px` +
      (ok ? '' : `  最右元素 right=${r.worst.right} w=${r.worst.w} :: ${r.worst.path}`),
  )
}

if (shotRoute) {
  await setViewport(390, 844)
  await send('Page.navigate', { url: `${BASE}/#${shotRoute}` })
  await sleep(2200)
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.mkdirSync(path.dirname(shotOut), { recursive: true })
  fs.writeFileSync(shotOut, Buffer.from(shot.result.data, 'base64'))
  console.log(`\n已保存移动端截图: ${shotOut}`)
}

const bad = report.filter((r) => r.overflow > 1)
ws.close()
proc.kill()
process.exit(bad.length ? 1 : 0)
