export interface AuthEnv {
  DB?: D1Database
}

const SESSION_COOKIE = '__Host-tablehub_session'
const SESSION_SECONDS = 60 * 60 * 24 * 30
// Cloudflare Workers Web Crypto caps PBKDF2 at 100,000 iterations.
const PASSWORD_ITERATIONS = 100_000

export interface AuthUser {
  id: string
  username: string
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { status, headers: responseHeaders })
}

export function cookie(token: string, maxAge = SESSION_SECONDS): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`
}

export function sessionToken(request: Request): string | null {
  const value = request.headers.get('Cookie')?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
  return value ? decodeURIComponent(value.slice(SESSION_COOKIE.length + 1)) : null
}

export async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toBase64Url(new Uint8Array(bytes))
}

export async function passwordHash(password: string, salt: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64Url(salt), iterations: PASSWORD_ITERATIONS },
    material,
    256,
  )
  return toBase64Url(new Uint8Array(bits))
}

export function randomToken(bytes = 32): string {
  const value = new Uint8Array(bytes)
  crypto.getRandomValues(value)
  return toBase64Url(value)
}

export function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left)
  const b = new TextEncoder().encode(right)
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index]
  return difference === 0
}

export async function currentUser(request: Request, env: AuthEnv): Promise<AuthUser | null> {
  if (!env.DB) return null
  const token = sessionToken(request)
  if (!token) return null
  const tokenHash = await digest(token)
  const row = await env.DB.prepare(
    'SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?',
  ).bind(tokenHash, Math.floor(Date.now() / 1000)).first<AuthUser>()
  return row ?? null
}

export function newSessionToken(): string {
  return randomToken()
}

export async function saveSession(env: AuthEnv, userId: string, token: string): Promise<void> {
  if (!env.DB) throw new Error('auth_unavailable')
  const now = Math.floor(Date.now() / 1000)
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(await digest(token), userId, now + SESSION_SECONDS, now).run()
}

export async function deleteSession(env: AuthEnv, token: string): Promise<void> {
  if (!env.DB) return
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await digest(token)).run()
}

export function isValidUsername(value: string): boolean {
  return /^[A-Za-z0-9_-]{3,24}$/.test(value)
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 128
}

function toBase64Url(value: Uint8Array): string {
  let binary = ''
  value.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}
