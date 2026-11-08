/**
 * 表格汇 TableHub —— 构建产物冒烟测试
 *
 * 用 jsdom 加载 dist 里的真实 bundle，逐个路由渲染，
 * 检查页面关键文案是否存在、控制台是否有报错。
 *
 * 用法: node scripts/smoke.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM, VirtualConsole } from 'jsdom'

const DIST = path.resolve('dist')
const ASSETS = path.join(DIST, 'assets')

const jsFile = fs.readdirSync(ASSETS).find((f) => f.endsWith('.js'))
if (!jsFile) {
  console.error('✗ dist/assets 下没有找到 JS bundle，请先运行 pnpm build')
  process.exit(1)
}

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')

const errors = []
const virtualConsole = new VirtualConsole()
virtualConsole.on('jsdomError', (e) => {
  if (!/Not implemented/.test(e.message)) errors.push(`jsdomError: ${e.message}`)
})
virtualConsole.on('error', (...args) => errors.push(`console.error: ${args.join(' ')}`))

const dom = new JSDOM(html, {
  url: 'http://127.0.0.1:5180/',
  pretendToBeVisual: true,
  virtualConsole,
})

const { window } = dom

// jsdom 缺失的浏览器 API
window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }))
window.scrollTo = () => {}
window.HTMLElement.prototype.scrollIntoView = () => {}

function expose(key, value) {
  try {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  } catch {
    /* 某些全局属性不可覆盖，忽略 */
  }
}

for (const key of [
  'window',
  'document',
  'HTMLElement',
  'Element',
  'Node',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'CustomEvent',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'localStorage',
  'sessionStorage',
  'location',
  'history',
  'SVGElement',
  'MutationObserver',
  'IntersectionObserver',
  'ResizeObserver',
  'Blob',
  'File',
  'FormData',
  'DOMParser',
]) {
  if (key === 'location' || key === 'history') continue
  expose(key, window[key])
}
expose('navigator', window.navigator)
expose('self', window)

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// 加载真实 bundle
await import(pathToFileURL(path.join(ASSETS, jsFile)).href)

const ROUTES = [
  ['/', '再也不用'],
  ['/dashboard', '欢迎回来'],
  ['/search', '搜索表格、客户、员工、方案'],
  ['/search?q=星河科技', 'AI 搜索助手'],
  ['/tables', '表格中心'],
  ['/plans', '方案中心'],
  ['/ppt', 'PPT'],
  ['/files', '全部文件'],
  ['/favorites', '我的收藏'],
  ['/file/f-xh-annual-plan', 'AI 智能总结'],
  ['/reimbursement', '员工报销'],
  ['/ai', '表格汇 AI'],
  ['/organize', 'AI 智能整理'],
  ['/collector', '表格汇集器'],
  ['/trash', '回收站'],
  ['/settings', '存储空间'],
  ['/no-such-page', '页面走丢了'],
]

const results = []

for (const [route, expect] of ROUTES) {
  window.location.hash = `#${route}`
  window.dispatchEvent(new window.HashChangeEvent('hashchange'))
  await wait(160)
  const text = window.document.getElementById('root')?.textContent ?? ''
  results.push({ route, ok: text.includes(expect), expect, length: text.length })
}

// 搜索交互：确认真的能搜到数据
window.location.hash = '#/search?q=星河科技'
window.dispatchEvent(new window.HashChangeEvent('hashchange'))
await wait(700)
const searchText = window.document.getElementById('root')?.textContent ?? ''
const searchWorks = /找到\s*\d+\s*个/.test(searchText.replace(/\s+/g, ' ')) || searchText.includes('星河科技年度合作方案')

/** 内容断言：核对 Demo 数据与关键文案 */
async function view(route, waitMs = 500) {
  window.location.hash = `#${route}`
  window.dispatchEvent(new window.HashChangeEvent('hashchange'))
  await wait(waitMs)
  return (window.document.getElementById('root')?.textContent ?? '').replace(/\s+/g, ' ')
}

const CHECKS = [
  ['表格数量为 128', await view('/tables'), '共 128 个文件'],
  ['方案数量为 36', await view('/plans'), '共 36 个文件'],
  ['PPT 数量为 24', await view('/ppt'), '共 24 个文件'],
  ['全部文件为 194', await view('/files'), '共 194 个文件'],
  ['表格汇集器有拖拽区', await view('/collector'), '拖拽文件到这里'],
  ['搜索命中报价表', searchText, '星河科技报价表'],
  ['搜索结果数量', await view('/search?q=星河科技', 700), '个与「星河科技」相关的结果'],
  ['详情页标题', await view('/file/f-xh-annual-plan'), '星河科技年度合作方案'],
  ['详情页文件大小', await view('/file/f-xh-annual-plan'), '2.4 MB'],
  ['详情页 AI 建议', await view('/file/f-xh-annual-plan'), '建议发送给'],
  ['AI 助手示例问题', await view('/ai'), '帮我找星河科技最近的报价表'],
  ['报销 KPI', await view('/reimbursement'), '¥128,450'],
  ['首页统计卡片', await view('/dashboard'), '最近使用'],
]

console.log('\n=== 路由冒烟测试 ===')
for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.route.padEnd(28)} 期望包含「${r.expect}」 文本量=${r.length}`)
}
console.log(`${searchWorks ? '✓' : '✗'} 搜索页能返回结果（匹配到文件名/结果数）`)

console.log('\n=== 数据与文案断言 ===')
const checkResults = CHECKS.map(([label, text, expect]) => ({
  label,
  ok: text.includes(expect),
  expect,
}))
for (const c of checkResults) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.label.padEnd(18)} 期望「${c.expect}」`)
}


if (errors.length) {
  console.log('\n=== 运行时错误 ===')
  errors.slice(0, 20).forEach((e) => console.log('! ' + e))
}

const failed = results.filter((r) => !r.ok)
const failedChecks = checkResults.filter((c) => !c.ok)
console.log(
  `\n结果: ${results.length - failed.length}/${results.length} 个路由渲染正常; ` +
    `${checkResults.length - failedChecks.length}/${checkResults.length} 条断言通过; ` +
    `运行时错误 ${errors.length} 条`,
)
process.exit(failed.length === 0 && failedChecks.length === 0 && errors.length === 0 ? 0 : 1)
